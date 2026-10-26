-- Prevent listing owners from editing moderation notes and provide an audited admin-only moderation RPC.
-- This migration is intentionally committed to the PR only; do not apply to production until release approval.

CREATE OR REPLACE FUNCTION public.guard_harvest_listing_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'::public.user_role
  )
  INTO is_admin;

  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.moderation_status := 'pending';
      NEW.moderation_note := NULL;
    END IF;
  ELSIF NOT is_admin AND (
    NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
    OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note
  ) THEN
    -- Restore both moderation fields if a non-admin tries to change either one.
    NEW.moderation_status := OLD.moderation_status;
    NEW.moderation_note := OLD.moderation_note;
  END IF;

  IF NOT NEW.contact_phone_public THEN
    NEW.contact_phone := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_harvest_listing(
  p_listing_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_admin uuid;
  v_previous_status text;
  v_previous_note text;
  v_note text;
BEGIN
  v_admin := auth.uid();
  IF v_admin IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_admin
      AND p.role = 'admin'::public.user_role
  ) THEN
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

  SELECT h.moderation_status, h.moderation_note
  INTO v_previous_status, v_previous_note
  FROM public.harvest_listings h
  WHERE h.id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Harvest listing not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_previous_status IS DISTINCT FROM p_status
    OR v_previous_note IS DISTINCT FROM v_note THEN
    UPDATE public.harvest_listings
    SET moderation_status = p_status,
        moderation_note = v_note,
        updated_at = now()
    WHERE id = p_listing_id;

    INSERT INTO public.admin_audit_log (
      admin_id, action, entity_type, entity_id, metadata
    ) VALUES (
      v_admin,
      'harvest_listing.moderated',
      'harvest_listing',
      p_listing_id,
      jsonb_build_object(
        'previous_status', v_previous_status,
        'new_status', p_status,
        'previous_note', v_previous_note,
        'new_note', v_note
      )
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_moderate_harvest_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_harvest_listing(uuid, text, text) TO authenticated, service_role;
