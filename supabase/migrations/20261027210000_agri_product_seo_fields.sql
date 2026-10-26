-- Draft migration: do not apply to production until explicitly approved.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS unit_label text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS crop_suitability text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS composition text,
  ADD COLUMN IF NOT EXISTS usage_instructions text,
  ADD COLUMN IF NOT EXISTS safety_information text,
  ADD COLUMN IF NOT EXISTS origin_district text,
  ADD COLUMN IF NOT EXISTS packaging_details text,
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS search_keywords text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS canonical_slug text,
  ADD COLUMN IF NOT EXISTS seo_review_status text NOT NULL DEFAULT 'needs_review'
    CHECK (seo_review_status IN ('needs_review','ready','blocked'));

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique
  ON public.products (sku) WHERE sku IS NOT NULL AND length(trim(sku)) > 0;
CREATE INDEX IF NOT EXISTS products_seo_review_status_idx
  ON public.products (seo_review_status, updated_at DESC);


-- SECURITY DEFINER is used only to perform the insert after verifying the caller's admin role.
CREATE OR REPLACE FUNCTION public.admin_create_agri_product(p_product jsonb)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result public.products;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_product IS NULL
    OR nullif(trim(p_product->>'name'), '') IS NULL
    OR nullif(trim(p_product->>'slug'), '') IS NULL
    OR nullif(trim(p_product->>'description'), '') IS NULL
    OR coalesce((p_product->>'price')::numeric, 0) <= 0
    OR coalesce((p_product->>'stock')::numeric, -1) < 0
    OR coalesce((p_product->>'reseller_commission_percent')::numeric, -1) < 0
    OR coalesce((p_product->>'reseller_commission_percent')::numeric, 101) > 100
  THEN
    RAISE EXCEPTION 'Invalid agricultural product fields' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.products (
    farmer_id, name, slug, description, price, stock, reseller_commission_percent, status,
    category, category_slug, subcategory_slug, brand_name, sku, unit_label, product_type,
    crop_suitability, composition, usage_instructions, safety_information, origin_district,
    packaging_details, image_urls, seo_title, meta_description, search_keywords, hashtags,
    canonical_slug, seo_review_status, moderation_status
  ) VALUES (
    auth.uid(), trim(p_product->>'name'), trim(p_product->>'slug'), trim(p_product->>'description'),
    (p_product->>'price')::numeric, (p_product->>'stock')::numeric,
    (p_product->>'reseller_commission_percent')::numeric,
    (p_product->>'status')::public.product_status,
    p_product->>'category', p_product->>'category_slug', nullif(p_product->>'subcategory_slug',''),
    nullif(p_product->>'brand_name',''), nullif(p_product->>'sku',''), nullif(p_product->>'unit_label',''),
    nullif(p_product->>'product_type',''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_product->'crop_suitability','[]'::jsonb))),
    nullif(p_product->>'composition',''), nullif(p_product->>'usage_instructions',''),
    nullif(p_product->>'safety_information',''), nullif(p_product->>'origin_district',''),
    nullif(p_product->>'packaging_details',''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_product->'image_urls','[]'::jsonb))),
    nullif(p_product->>'seo_title',''), nullif(p_product->>'meta_description',''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_product->'search_keywords','[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_product->'hashtags','[]'::jsonb))),
    nullif(p_product->>'canonical_slug',''), coalesce(p_product->>'seo_review_status','needs_review'),
    'pending'
  ) RETURNING * INTO result;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'product.created', 'product', result.id,
    jsonb_build_object('name', result.name, 'slug', result.slug, 'status', result.status,
      'seo_review_status', result.seo_review_status));

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_agri_product(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_agri_product(jsonb) TO authenticated;
