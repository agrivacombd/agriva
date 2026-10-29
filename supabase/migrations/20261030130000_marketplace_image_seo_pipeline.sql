-- Secure image processing metadata and private original retention for marketplace uploads.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_variants jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_image_variants_is_array;
ALTER TABLE public.products
  ADD CONSTRAINT products_image_variants_is_array
  CHECK (CASE WHEN jsonb_typeof(image_variants) = 'array' THEN jsonb_array_length(image_variants) <= 4 ELSE false END);

-- Original uploads are retained privately; only generated responsive derivatives are public/crawlable.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-image-originals', 'product-image-originals', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'product-images';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Sellers can upload own private product originals'
  ) THEN
    CREATE POLICY "Sellers can upload own private product originals"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'product-image-originals'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND EXISTS (
          SELECT 1 FROM public.user_role_memberships membership
          WHERE membership.user_id = (SELECT auth.uid())
            AND membership.role IN ('seller', 'organization')
        )
      );
  END IF;
END
$$;

COMMENT ON COLUMN public.products.image_variants IS 'Responsive, public image derivative metadata. Original source files remain in the private product-image-originals bucket.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Sellers can delete own processed product images'
  ) THEN
    CREATE POLICY "Sellers can delete own processed product images"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'product-images'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND EXISTS (
          SELECT 1 FROM public.user_role_memberships membership
          WHERE membership.user_id = (SELECT auth.uid())
            AND membership.role IN ('seller', 'organization')
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Sellers can delete own private product originals'
  ) THEN
    CREATE POLICY "Sellers can delete own private product originals"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'product-image-originals'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND EXISTS (
          SELECT 1 FROM public.user_role_memberships membership
          WHERE membership.user_id = (SELECT auth.uid())
            AND membership.role IN ('seller', 'organization')
        )
      );
  END IF;
END
$$;
