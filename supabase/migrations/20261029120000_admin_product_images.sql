-- Product catalogue images are public assets; writes are limited to admins in their own storage folder.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.is_admin()
);

CREATE OR REPLACE FUNCTION public.admin_create_marketplace_product_with_image(
  p_name text,
  p_description text,
  p_price numeric,
  p_stock numeric,
  p_commission_percent numeric,
  p_category_slug text,
  p_subcategory_slug text,
  p_image_url text
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  result public.products;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  IF p_image_url IS NOT NULL
     AND p_image_url !~ ('^https://[^/]+/storage/v1/object/public/product-images/' || auth.uid()::text || '/[A-Za-z0-9._-]+$') THEN
    RAISE EXCEPTION 'Product image must be uploaded to the admin product-images folder' USING ERRCODE = '22023';
  END IF;

  result := public.admin_create_marketplace_product(
    p_name,
    p_description,
    p_price,
    p_stock,
    p_commission_percent,
    p_category_slug,
    p_subcategory_slug
  );

  IF p_image_url IS NOT NULL THEN
    UPDATE public.products
    SET image_url = p_image_url
    WHERE id = result.id
    RETURNING * INTO result;

    INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'product.image_uploaded',
      'product',
      result.id,
      jsonb_build_object('image_attached', true, 'status', result.status)
    );
  END IF;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_create_marketplace_product_with_image(text,text,numeric,numeric,numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_marketplace_product_with_image(text,text,numeric,numeric,numeric,text,text,text) TO authenticated;
