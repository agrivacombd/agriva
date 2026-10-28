-- Align legacy admin-only RLS/RPC guards with the controlled platform-admin membership model.
-- This helper recognizes legacy profile admins and explicitly provisioned admin/super_admin memberships.
CREATE OR REPLACE FUNCTION public.has_platform_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.has_platform_admin_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_platform_admin_access() TO anon, authenticated, service_role;

-- Update known admin RPCs without changing their validation, audit, or business logic.
DO $migration$
DECLARE
  v_signature text;
  v_oid regprocedure;
  v_definition text;
  v_signatures text[] := ARRAY[
    'public.admin_update_site_setting(text,text)',
    'public.admin_save_product_category(uuid,text,text,text,boolean,integer)',
    'public.admin_set_product_category(uuid,text)',
    'public.admin_set_user_role(uuid,public.user_role)',
    'public.admin_set_staff_role(uuid,text,boolean)',
    'public.admin_update_product(uuid,text,text,numeric,numeric,numeric,public.product_status)'
  ];
BEGIN
  FOREACH v_signature IN ARRAY v_signatures LOOP
    v_oid := to_regprocedure(v_signature);
    IF v_oid IS NOT NULL THEN
      v_definition := pg_get_functiondef(v_oid);
      v_definition := replace(v_definition, 'public.is_admin()', 'public.has_platform_admin_access()');
      EXECUTE v_definition;
    END IF;
  END LOOP;
END;
$migration$;

-- Keep admin reads consistent across the browser UI and database boundary.
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
CREATE POLICY "profiles_admin_read" ON public.profiles
FOR SELECT TO authenticated USING (public.has_platform_admin_access());

DROP POLICY IF EXISTS "site_settings_admin_read" ON public.site_settings;
CREATE POLICY "site_settings_admin_read" ON public.site_settings
FOR SELECT TO authenticated USING (public.has_platform_admin_access());

DROP POLICY IF EXISTS "product_categories_public_read" ON public.product_categories;
CREATE POLICY "product_categories_public_read" ON public.product_categories
FOR SELECT TO anon, authenticated
USING (is_active OR public.has_platform_admin_access());

DROP POLICY IF EXISTS transport_partners_read ON public.transport_partners;
CREATE POLICY transport_partners_read ON public.transport_partners
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR verification_status = 'verified'
  OR public.has_platform_admin_access()
);

CREATE OR REPLACE FUNCTION public.admin_set_transport_partner_verification(
  p_user_id uuid,
  p_status text,
  p_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_platform_admin_access() THEN
    RAISE EXCEPTION 'Platform admin permission required' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Transport partner user ID is required' USING ERRCODE = '22023';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('verified', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'Invalid verification status' USING ERRCODE = '22023';
  END IF;
  IF p_note IS NULL OR char_length(p_note) > 1000 THEN
    RAISE EXCEPTION 'Review note must be 1000 characters or fewer' USING ERRCODE = '22023';
  END IF;

  UPDATE public.transport_partners
  SET verification_status = p_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      verification_note = trim(p_note)
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transport partner application not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'transport_partner.verification.' || p_status,
    'transport_partner',
    p_user_id,
    jsonb_build_object('status', p_status, 'note', nullif(trim(p_note), ''))
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_transport_partner_verification(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_transport_partner_verification(uuid, text, text) TO authenticated;
