-- Publish farmer harvest listings immediately while preserving owner controls and contact privacy.
-- Forward-only corrective migration: the earlier 20261030150000 version collides with
-- an already-applied Production migration and its policy helper does not match Production.

DROP TRIGGER IF EXISTS harvest_listings_guard_moderation ON public.harvest_listings;
DROP FUNCTION IF EXISTS public.guard_harvest_listing_moderation();

UPDATE public.harvest_listings
SET moderation_status = 'approved',
    moderation_note = NULL,
    contact_phone = CASE WHEN contact_phone_public THEN contact_phone ELSE NULL END;

ALTER TABLE public.harvest_listings
  ALTER COLUMN moderation_status SET DEFAULT 'approved';

CREATE OR REPLACE FUNCTION public.set_harvest_listing_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    NEW.moderation_status := 'approved';
    NEW.moderation_note := NULL;
  END IF;
  IF NOT NEW.contact_phone_public THEN
    NEW.contact_phone := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Keep the legacy admin RPC callable during the staggered application rollout.
-- The old Production UI still invokes this signature until the new app deploys.
-- Moderation status is no longer changed; admins can hide/resume listings via status.
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

CREATE OR REPLACE FUNCTION public.admin_moderate_harvest_listing(
  p_listing_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
  SELECT private.admin_moderate_harvest_listing($1, $2, $3);
$$;

REVOKE ALL ON FUNCTION private.admin_moderate_harvest_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_moderate_harvest_listing(uuid, text, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_moderate_harvest_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_harvest_listing(uuid, text, text) TO authenticated, service_role;

DROP TRIGGER IF EXISTS harvest_listings_publish_immediately ON public.harvest_listings;
CREATE TRIGGER harvest_listings_publish_immediately
  BEFORE INSERT OR UPDATE ON public.harvest_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_harvest_listing_published();

REVOKE ALL ON FUNCTION public.set_harvest_listing_published() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_harvest_listing_published() TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can delete harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Authenticated users can submit harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Owners can update own harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Public can read approved available harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Users can read approved or own harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_admin_delete ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_public_read ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_authenticated_read ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_owner_insert ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_owner_status_update ON public.harvest_listings;

CREATE POLICY harvest_listings_admin_delete
  ON public.harvest_listings FOR DELETE TO authenticated
  USING (private.is_admin());

CREATE POLICY harvest_listings_public_read
  ON public.harvest_listings FOR SELECT TO anon
  USING (status = 'available');

CREATE POLICY harvest_listings_authenticated_read
  ON public.harvest_listings FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR status = 'available'
    OR private.is_admin()
  );

CREATE POLICY harvest_listings_owner_insert
  ON public.harvest_listings FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'available'
  );

CREATE POLICY harvest_listings_owner_status_update
  ON public.harvest_listings FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR private.is_admin())
  WITH CHECK (owner_id = (SELECT auth.uid()) OR private.is_admin());

DROP INDEX IF EXISTS public.harvest_listings_public_feed_idx;
CREATE INDEX harvest_listings_public_feed_idx
  ON public.harvest_listings(district, crop_name, created_at DESC)
  WHERE status = 'available';
