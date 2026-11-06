-- Forward-only hardening for Transport verification and delegated Admin read access.
-- Safe to apply after the existing transport verification and RBAC foundation migrations.

CREATE OR REPLACE FUNCTION public.admin_set_transport_partner_verification(
  p_user_id uuid,
  p_status text,
  p_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_previous_status text;
  v_note text := btrim(coalesce(p_note, ''));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT (
    public.is_admin()
    OR public.has_admin_permission('transport.moderate')
  ) THEN
    RAISE EXCEPTION 'Transport moderation permission required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL
     OR p_status IS NULL
     OR p_status NOT IN ('verified', 'rejected', 'suspended')
     OR p_note IS NULL
     OR char_length(v_note) > 1000 THEN
    RAISE EXCEPTION 'Invalid transport review input' USING ERRCODE = '22023';
  END IF;

  SELECT verification_status
    INTO v_previous_status
  FROM public.transport_partners
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transport partner application not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.transport_partners
  SET verification_status = p_status,
      reviewed_at = now(),
      reviewed_by = v_actor,
      verification_note = v_note
  WHERE user_id = p_user_id;

  -- Same transaction as the status mutation: audit failure rolls back the update.
  INSERT INTO public.admin_audit_log (
    admin_id, action, entity_type, entity_id, metadata
  ) VALUES (
    v_actor,
    'transport.partner.verification.updated',
    'transport_partner',
    p_user_id,
    jsonb_build_object(
      'previous_status', v_previous_status,
      'new_status', p_status,
      'review_note_length', char_length(v_note)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_transport_partner_verification(uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_transport_partner_verification(uuid, text, text)
  TO authenticated;

-- Keep the existing self/verified read behavior while allowing explicitly
-- delegated Transport readers to see the review queue.
DROP POLICY IF EXISTS transport_partners_read ON public.transport_partners;
CREATE POLICY transport_partners_read ON public.transport_partners
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR verification_status = 'verified'
  OR public.is_admin()
  OR public.has_admin_permission('transport.read')
);

-- Audit readers may be legacy Admins or explicitly delegated audit readers.
DROP POLICY IF EXISTS audit_admin_read ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_admin_read" ON public.admin_audit_log;
CREATE POLICY audit_admin_read ON public.admin_audit_log
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_admin_permission('audit.read')
);

-- Green Exchange read access for a dedicated delegated capability.
DROP POLICY IF EXISTS "Admins can read all exchange listings" ON public.green_exchange_listings;
CREATE POLICY "Admins can read all exchange listings"
ON public.green_exchange_listings FOR SELECT TO authenticated
USING (
  private.is_admin()
  OR public.has_admin_permission('green_exchange.read')
);

CREATE OR REPLACE FUNCTION public.admin_moderate_green_exchange_listing(
  p_listing_id uuid,
  p_moderation_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_previous_status text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT (
    public.is_admin()
    OR public.has_admin_permission('green_exchange.moderate')
  ) THEN
    RAISE EXCEPTION 'Green Exchange moderation permission required' USING ERRCODE = '42501';
  END IF;

  IF p_listing_id IS NULL
     OR p_moderation_status IS NULL
     OR p_moderation_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid listing or moderation status' USING ERRCODE = '22023';
  END IF;

  SELECT moderation_status
    INTO v_previous_status
  FROM public.green_exchange_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.green_exchange_listings
  SET moderation_status = p_moderation_status
  WHERE id = p_listing_id;

  INSERT INTO public.admin_audit_log (
    admin_id, action, entity_type, entity_id, metadata
  ) VALUES (
    v_actor,
    'green_exchange.listing.moderated',
    'green_exchange_listing',
    p_listing_id,
    jsonb_build_object(
      'previous_status', v_previous_status,
      'new_status', p_moderation_status
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_moderate_green_exchange_listing(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_green_exchange_listing(uuid, text)
  TO authenticated, service_role;
