-- Restore the production schema required by the live Sell My Harvest UI.
-- This is a forward-only addition; Production currently has no harvest listing rows.
CREATE OR REPLACE FUNCTION public.harvest_listing_image_urls_valid(p_urls text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT p_urls IS NOT NULL
    AND cardinality(p_urls) BETWEEN 1 AND 5
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(p_urls) AS item(url)
      WHERE item.url IS NULL
        OR item.url !~ '^https://[^/]+/storage/v1/object/public/harvest-images/[^[:space:]]+$'
    );
$$;
REVOKE ALL ON FUNCTION public.harvest_listing_image_urls_valid(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.harvest_listing_image_urls_valid(text[]) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.harvest_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name text NOT NULL CHECK (char_length(btrim(seller_name)) BETWEEN 1 AND 100),
  crop_name text NOT NULL CHECK (char_length(btrim(crop_name)) BETWEEN 1 AND 100),
  variety text CHECK (variety IS NULL OR char_length(variety) <= 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 3000),
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL CHECK (unit IN ('kg', 'maund', 'ton', 'bag')),
  price_per_unit numeric(12,2) NOT NULL CHECK (price_per_unit >= 0),
  district text NOT NULL CHECK (char_length(btrim(district)) BETWEEN 1 AND 100),
  upazila text CHECK (upazila IS NULL OR char_length(upazila) <= 100),
  pickup_details text CHECK (pickup_details IS NULL OR char_length(pickup_details) <= 500),
  quality text CHECK (quality IS NULL OR char_length(quality) <= 60),
  harvest_ready text NOT NULL DEFAULT 'ready_now'
    CHECK (harvest_ready IN ('ready_now', 'within_7_days', 'later')),
  minimum_order numeric(12,2) CHECK (minimum_order IS NULL OR minimum_order > 0),
  negotiable boolean NOT NULL DEFAULT true,
  transport_available boolean NOT NULL DEFAULT false,
  contact_phone text CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 25),
  contact_phone_public boolean NOT NULL DEFAULT false,
  image_urls text[] NOT NULL CHECK (public.harvest_listing_image_urls_valid(image_urls)),
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'sold_out', 'paused')),
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_note text CHECK (moderation_note IS NULL OR char_length(moderation_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT harvest_listings_phone_consent_check
    CHECK (NOT contact_phone_public OR nullif(btrim(contact_phone), '') IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS harvest_listings_owner_created_idx
  ON public.harvest_listings(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS harvest_listings_moderation_created_idx
  ON public.harvest_listings(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS harvest_listings_public_feed_idx
  ON public.harvest_listings(district, crop_name, created_at DESC)
  WHERE moderation_status = 'approved' AND status = 'available';

ALTER TABLE public.harvest_listings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.harvest_listings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.harvest_listings TO anon, authenticated;
GRANT INSERT ON TABLE public.harvest_listings TO authenticated;
GRANT UPDATE (status) ON TABLE public.harvest_listings TO authenticated;

DROP POLICY IF EXISTS harvest_listings_public_read ON public.harvest_listings;
CREATE POLICY harvest_listings_public_read
  ON public.harvest_listings FOR SELECT TO anon
  USING (moderation_status = 'approved' AND status = 'available');

DROP POLICY IF EXISTS harvest_listings_authenticated_read ON public.harvest_listings;
CREATE POLICY harvest_listings_authenticated_read
  ON public.harvest_listings FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR (moderation_status = 'approved' AND status = 'available')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS harvest_listings_owner_insert ON public.harvest_listings;
CREATE POLICY harvest_listings_owner_insert
  ON public.harvest_listings FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'available'
    AND moderation_status = 'pending'
    AND moderation_note IS NULL
  );

DROP POLICY IF EXISTS harvest_listings_owner_status_update ON public.harvest_listings;
CREATE POLICY harvest_listings_owner_status_update
  ON public.harvest_listings FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_harvest_listing_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'::public.user_role
  )
  INTO v_is_admin;

  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_admin THEN
      NEW.moderation_status := 'pending';
      NEW.moderation_note := NULL;
    END IF;
  ELSIF NOT v_is_admin AND (
    NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
    OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note
  ) THEN
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

DROP TRIGGER IF EXISTS harvest_listings_guard_moderation ON public.harvest_listings;
CREATE TRIGGER harvest_listings_guard_moderation
  BEFORE INSERT OR UPDATE ON public.harvest_listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_harvest_listing_moderation();

-- Public image URLs are intentional; writes are restricted to each authenticated owner's folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('harvest-images', 'harvest-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS harvest_images_owner_upload ON storage.objects;
CREATE POLICY harvest_images_owner_upload
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'harvest-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
