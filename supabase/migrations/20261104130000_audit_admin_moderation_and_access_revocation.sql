-- Forward-only audit hardening for two existing Admin SECURITY DEFINER RPCs.
-- Based on read-only Production body/trigger inspection. This migration is branch-only
-- and must not be applied until the complete migration matrix and release gates are approved.

CREATE OR REPLACE FUNCTION public.admin_moderate_green_exchange_listing(
  p_listing_id uuid,
  p_moderation_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'admin'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Admin permission required' USING ERRCODE = '42501';
  END IF;

  IF p_listing_id IS NULL OR p_moderation_status IS NULL
     OR p_moderation_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid listing or moderation status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.green_exchange_listings
  SET moderation_status = p_moderation_status
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'green_exchange.listing.moderated',
    'green_exchange_listing',
    p_listing_id,
    jsonb_build_object('moderation_status', p_moderation_status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_market_access(
  p_user_id uuid,
  p_module text,
  p_scope_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_grant_count integer := 0;
  v_application_count integer := 0;
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL
     OR p_module IS NULL
     OR p_module NOT IN ('marketplace', 'plant_market')
     OR (p_module = 'marketplace' AND p_scope_id IS NULL)
     OR (p_module = 'plant_market' AND p_scope_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Invalid user, module or scope' USING ERRCODE = '22023';
  END IF;

  UPDATE public.user_module_grants
  SET status = 'revoked',
      revoked_by = v_actor,
      revoked_at = now(),
      reason = 'Seller access revoked by administrator'
  WHERE user_id = p_user_id
    AND module = p_module
    AND status = 'active'
    AND (
      (p_module = 'marketplace' AND scope_type = 'organization' AND scope_id = p_scope_id)
      OR (p_module = 'plant_market' AND scope_type = 'global' AND scope_id IS NULL)
    );
  GET DIAGNOSTICS v_grant_count = ROW_COUNT;

  UPDATE public.module_access_applications
  SET status = 'withdrawn',
      review_note = 'Module access revoked by administrator',
      reviewed_by = v_actor,
      reviewed_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id
    AND module = p_module
    AND status = 'approved'
    AND (
      (p_module = 'marketplace' AND organization_id = p_scope_id)
      OR (p_module = 'plant_market' AND organization_id IS NULL)
    );
  GET DIAGNOSTICS v_application_count = ROW_COUNT;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'admin.module_access.revoked',
    'user',
    p_user_id,
    jsonb_build_object(
      'module', p_module,
      'scope_id', p_scope_id,
      'revoked_grants', v_grant_count,
      'withdrawn_applications', v_application_count
    )
  );

  RETURN v_grant_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_moderate_green_exchange_listing(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_green_exchange_listing(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_revoke_market_access(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_market_access(uuid, text, uuid) TO authenticated, service_role;
