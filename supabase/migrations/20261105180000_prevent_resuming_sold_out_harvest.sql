-- Prevent an already sold-out harvest listing from being reactivated by an admin action.
-- The row lock and state check live in the RPC so the rule is race-safe.
CREATE OR REPLACE FUNCTION private.admin_moderate_harvest_listing(
  p_listing_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_admin uuid;
  v_previous_status text;
  v_target_status text;
  v_note text;
BEGIN
  v_admin := auth.uid();
  IF v_admin IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'Listing id is required' USING ERRCODE = '22023';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid moderation status' USING ERRCODE = '22023';
  END IF;

  v_note := NULLIF(btrim(p_note), '');
  IF char_length(coalesce(v_note, '')) > 500 THEN
    RAISE EXCEPTION 'Moderation note must be at most 500 characters' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'rejected' AND v_note IS NULL THEN
    RAISE EXCEPTION 'A reason is required to reject a harvest listing' USING ERRCODE = '22023';
  END IF;

  SELECT status INTO v_previous_status
  FROM public.harvest_listings
  WHERE id = p_listing_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Harvest listing not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_status = 'approved' AND v_previous_status = 'sold_out' THEN
    RAISE EXCEPTION 'Sold-out harvest listings cannot be reactivated' USING ERRCODE = '22023';
  END IF;

  v_target_status := CASE WHEN p_status = 'approved' THEN 'available' ELSE 'paused' END;
  UPDATE public.harvest_listings
  SET status = v_target_status,
      moderation_status = p_status,
      moderation_note = v_note
  WHERE id = p_listing_id;

  INSERT INTO public.admin_audit_log (
    admin_id, action, entity_type, entity_id, metadata
  ) VALUES (
    v_admin,
    'harvest_listing.visibility_changed',
    'harvest_listing',
    p_listing_id,
    jsonb_build_object(
      'requested_moderation_status', p_status,
      'previous_visibility_status', v_previous_status,
      'new_visibility_status', v_target_status,
      'moderation_note', v_note
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.admin_moderate_harvest_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_moderate_harvest_listing(uuid, text, text) TO authenticated, service_role;
