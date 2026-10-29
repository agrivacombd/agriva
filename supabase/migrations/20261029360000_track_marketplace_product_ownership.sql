-- Distinguish AGRIVA-owned catalogue listings from seller-owned listings.
-- Existing rows default to seller because historical ownership cannot be inferred safely.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS listing_source text NOT NULL DEFAULT 'seller';

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_listing_source_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_listing_source_check
      CHECK (listing_source IN ('platform', 'seller'));
  END IF;
END;
$constraint$;

-- Keep the existing audited product-creation path, but explicitly mark new
-- Super Admin-created catalogue items as AGRIVA Official.
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
  IF auth.uid() IS NULL OR NOT public.has_platform_admin_access() THEN
    RAISE EXCEPTION 'Platform admin role required' USING ERRCODE = '42501';
  END IF;

  IF p_image_url IS NULL OR p_image_url !~ (
    '^https://[^/]+/storage/v1/object/public/product-images/' ||
    auth.uid()::text || '/[A-Za-z0-9._-]+$'
  ) THEN
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

  UPDATE public.products
  SET image_url = p_image_url,
      listing_source = 'platform'
  WHERE id = result.id
  RETURNING * INTO result;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'product.image_uploaded',
    'product',
    result.id,
    jsonb_build_object('image_attached', true, 'listing_source', 'platform', 'status', result.status)
  );

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_create_marketplace_product_with_image(text,text,numeric,numeric,numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_marketplace_product_with_image(text,text,numeric,numeric,numeric,text,text,text) TO authenticated;
