-- Reconcile legacy harvest policy names before the forward-only schema repair is released.
-- Existing production migrations used different policy names; PostgreSQL combines permissive policies with OR.
-- Remove the legacy policies so they cannot bypass the narrower replacement policies.

DROP POLICY IF EXISTS "Admins can delete harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Authenticated users can submit harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Owners can update own harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Public can read approved available harvest listings" ON public.harvest_listings;
DROP POLICY IF EXISTS "Users can read approved or own harvest listings" ON public.harvest_listings;

DROP POLICY IF EXISTS harvest_listings_public_read ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_authenticated_read ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_owner_insert ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_owner_status_update ON public.harvest_listings;
DROP POLICY IF EXISTS harvest_listings_admin_delete ON public.harvest_listings;

CREATE POLICY harvest_listings_public_read
  ON public.harvest_listings FOR SELECT TO anon
  USING (moderation_status = 'approved' AND status = 'available');

CREATE POLICY harvest_listings_authenticated_read
  ON public.harvest_listings FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR (moderation_status = 'approved' AND status = 'available')
    OR public.is_admin()
  );

CREATE POLICY harvest_listings_owner_insert
  ON public.harvest_listings FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'available'
    AND moderation_status = 'pending'
    AND moderation_note IS NULL
  );

CREATE POLICY harvest_listings_owner_status_update
  ON public.harvest_listings FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (owner_id = (SELECT auth.uid()) OR public.is_admin());

-- Direct deletion remains possible only through the admin-only RLS policy.
GRANT DELETE ON TABLE public.harvest_listings TO authenticated;
CREATE POLICY harvest_listings_admin_delete
  ON public.harvest_listings FOR DELETE TO authenticated
  USING (public.is_admin());
