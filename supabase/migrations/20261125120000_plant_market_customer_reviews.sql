-- Customer reviews for Plant Market. Reviews are submitted as pending and require admin moderation.
CREATE TABLE IF NOT EXISTS public.plant_market_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.plant_market_products(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 10 AND 2000),
  photo_urls text[] NOT NULL DEFAULT '{}' CHECK (cardinality(photo_urls) <= 3),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  moderation_note text,
  moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  verified_purchase boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS plant_market_reviews_public_idx
  ON public.plant_market_reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS plant_market_reviews_moderation_idx
  ON public.plant_market_reviews(status, created_at DESC);

ALTER TABLE public.plant_market_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plant_market_reviews_public_read ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_public_read ON public.plant_market_reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved');
DROP POLICY IF EXISTS plant_market_reviews_own_read ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_own_read ON public.plant_market_reviews
  FOR SELECT TO authenticated USING (reviewer_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS plant_market_reviews_authenticated_insert ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_authenticated_insert ON public.plant_market_reviews
  FOR INSERT TO authenticated WITH CHECK (
    reviewer_id = (SELECT auth.uid()) AND status = 'pending' AND verified_purchase = false
    AND photo_urls = '{}' AND moderated_by IS NULL AND moderated_at IS NULL
  );
DROP POLICY IF EXISTS plant_market_reviews_own_update ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_own_update ON public.plant_market_reviews
  FOR UPDATE TO authenticated USING (reviewer_id = (SELECT auth.uid()) AND status = 'pending')
  WITH CHECK (reviewer_id = (SELECT auth.uid()) AND status = 'pending' AND verified_purchase = false
    AND moderated_by IS NULL AND moderated_at IS NULL);

REVOKE ALL ON public.plant_market_reviews FROM anon;
GRANT SELECT ON public.plant_market_reviews TO anon;
REVOKE INSERT, UPDATE, DELETE ON public.plant_market_reviews FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.plant_market_reviews TO authenticated;

-- Public photo read, authenticated upload limited to a user's own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('plant-market-review-photos','plant-market-review-photos',false,4194304,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=4194304,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];
DROP POLICY IF EXISTS plant_market_review_photo_public_read ON storage.objects;
CREATE POLICY plant_market_review_photo_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'plant-market-review-photos'
    AND EXISTS (
      SELECT 1 FROM public.plant_market_reviews review
      WHERE review.id::text = (storage.foldername(name))[2] AND review.status = 'approved'
    )
  );
DROP POLICY IF EXISTS plant_market_review_photo_owner_read ON storage.objects;
CREATE POLICY plant_market_review_photo_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'plant-market-review-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS plant_market_review_photo_admin_read ON storage.objects;
CREATE POLICY plant_market_review_photo_admin_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'plant-market-review-photos' AND public.is_admin());
DROP POLICY IF EXISTS plant_market_review_photo_owner_insert ON storage.objects;
CREATE POLICY plant_market_review_photo_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'plant-market-review-photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.plant_market_reviews review
      WHERE review.id::text = (storage.foldername(name))[2]
        AND review.reviewer_id = (SELECT auth.uid())
        AND review.status = 'pending'
    )
  );
DROP POLICY IF EXISTS plant_market_review_photo_owner_delete ON storage.objects;
CREATE POLICY plant_market_review_photo_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'plant-market-review-photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.plant_market_reviews review
      WHERE review.id::text = (storage.foldername(name))[2]
        AND review.reviewer_id = (SELECT auth.uid())
        AND review.status = 'pending'
    )
  );

-- Allow a reviewer to discard their own pending draft/submission if upload processing rolls back.
DROP POLICY IF EXISTS plant_market_reviews_own_delete_pending ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_own_delete_pending ON public.plant_market_reviews
  FOR DELETE TO authenticated USING (reviewer_id = (SELECT auth.uid()) AND status = 'pending');
GRANT DELETE ON public.plant_market_reviews TO authenticated;

-- Admins can moderate through the capability-checked API. Reviewers may attach
-- only URLs in their own storage folder while the review remains pending.
DROP POLICY IF EXISTS plant_market_reviews_admin_update ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_admin_update ON public.plant_market_reviews
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS plant_market_reviews_own_update ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_own_update ON public.plant_market_reviews
  FOR UPDATE TO authenticated USING (reviewer_id = (SELECT auth.uid()) AND status = 'pending')
  WITH CHECK (
    reviewer_id = (SELECT auth.uid()) AND status = 'pending' AND verified_purchase = false
    AND moderated_by IS NULL AND moderated_at IS NULL
    AND cardinality(photo_urls) <= 3
    AND NOT EXISTS (
      SELECT 1 FROM unnest(photo_urls) AS photo_url
      WHERE photo_url NOT LIKE (SELECT auth.uid())::text || '/%'
    )
  );

DROP POLICY IF EXISTS plant_market_reviews_admin_read ON public.plant_market_reviews;
CREATE POLICY plant_market_reviews_admin_read ON public.plant_market_reviews
  FOR SELECT TO authenticated USING (public.is_admin());
