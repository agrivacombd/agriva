-- Controlled provisioning of scoped staff roles. Public signup/profile role selection
-- cannot grant these memberships; only an authenticated platform admin can.
CREATE OR REPLACE FUNCTION public.admin_set_staff_role(
  p_user_id uuid,
  p_role text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  allowed_roles constant text[] := ARRAY[
    'operations', 'product_moderator', 'content_seo_manager',
    'marketing_manager', 'finance_manager', 'support_agent'
  ]::text[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Platform admin permission required' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR p_role IS NULL OR NOT (p_role = ANY(allowed_roles)) OR p_enabled IS NULL THEN
    RAISE EXCEPTION 'Invalid staff role assignment' USING ERRCODE = '22023';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Self-service staff role changes are not allowed' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Target user profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_enabled THEN
    INSERT INTO public.user_role_memberships(user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_role_memberships
    WHERE user_id = p_user_id AND role = p_role;
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    CASE WHEN p_enabled THEN 'staff.role.granted' ELSE 'staff.role.revoked' END,
    'user',
    p_user_id,
    jsonb_build_object('role', p_role, 'enabled', p_enabled)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_staff_role(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_role(uuid, text, boolean) TO authenticated;
