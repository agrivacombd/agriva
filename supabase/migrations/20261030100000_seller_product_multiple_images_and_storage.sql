-- Allow up to four seller product photos and remove the app-specific/bucket-specific size cap.
-- The Supabase project-wide plan limit still applies.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, NULL, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = NULL,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Sellers can upload own product images'
  ) THEN
    CREATE POLICY "Sellers can upload own product images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND EXISTS (
          SELECT 1
          FROM public.user_role_memberships membership
          WHERE membership.user_id = (SELECT auth.uid())
            AND membership.role IN ('seller', 'organization')
        )
      );
  END IF;
END
$$;
