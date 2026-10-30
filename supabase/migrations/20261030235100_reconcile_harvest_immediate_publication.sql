-- Publish farmer harvest listings immediately while preserving owner controls and contact privacy.
-- Forward-only corrective migration: the earlier 20261030150000 version collides with
-- an already-applied Production migration and its policy helper does not match Production.

DROP TRIGGER IF EXISTS harvest_listings_guard_moderation ON public.harvest_listings;
DROP FUNCTION IF EXISTS public.guard_harvest_listing_moderation();
DROP FUNCTION IF EXISTS public.admin_moderate_harvest_listing(uuid, text, text);
DROP FUNCTION IF EXISTS private.admin_moderate_harvest_listing(uuid, text, text);

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
  NEW.moderation_status := 'approved';
  NEW.moderation_note := NULL;
  IF NOT NEW.contact_phone_public THEN
    NEW.contact_phone := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

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
