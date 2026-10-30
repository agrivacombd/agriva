-- Product SEO Studio: additive, backward-compatible product metadata.
-- New records remain draft; this migration does not publish or alter existing products.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS origin_district text,
  ADD COLUMN IF NOT EXISTS unit_label text,
  ADD COLUMN IF NOT EXISTS composition text,
  ADD COLUMN IF NOT EXISTS usage_instructions text,
  ADD COLUMN IF NOT EXISTS safety_information text,
  ADD COLUMN IF NOT EXISTS packaging_details text,
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS image_alt_text text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS search_keywords text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS seo_faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS canonical_slug text,
  ADD COLUMN IF NOT EXISTS seo_review_status text NOT NULL DEFAULT 'needs_review';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seo_review_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_seo_review_status_check
  CHECK (seo_review_status IN ('needs_review','ready','blocked'));

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx
  ON public.products (sku)
  WHERE sku IS NOT NULL AND length(trim(sku)) > 0;
CREATE INDEX IF NOT EXISTS products_seo_review_status_idx
  ON public.products (seo_review_status, updated_at DESC);

COMMENT ON COLUMN public.products.seo_review_status IS
  'Internal editorial checklist state only; not a Google ranking or indexing guarantee.';

CREATE OR REPLACE FUNCTION public.admin_create_product_with_seo(p_product jsonb)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
  category_name text;
  subcategory_name text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  IF p_product IS NULL
    OR nullif(trim(p_product->>'name'), '') IS NULL
    OR length(trim(p_product->>'name')) > 160
    OR nullif(trim(p_product->>'slug'), '') IS NULL
    OR length(trim(p_product->>'slug')) > 120
    OR nullif(trim(p_product->>'description'), '') IS NULL
    OR length(trim(p_product->>'description')) < 30
    OR coalesce((p_product->>'price')::numeric, 0) <= 0
    OR coalesce((p_product->>'stock')::numeric, -1) < 0
  THEN
    RAISE EXCEPTION 'Invalid product SEO payload' USING ERRCODE = '22023';
  END IF;

  SELECT c.name, s.name INTO category_name, subcategory_name
  FROM public.product_categories c
  LEFT JOIN public.product_subcategories s
    ON s.category_slug = c.slug
   AND s.slug = nullif(trim(p_product->>'subcategory_slug'), '')
   AND s.is_active = true
  WHERE c.slug = trim(p_product->>'category_slug')
    AND c.is_active = true;

  IF category_name IS NULL OR
     (nullif(trim(p_product->>'subcategory_slug'), '') IS NOT NULL AND subcategory_name IS NULL) THEN
    RAISE EXCEPTION 'Category or subcategory is invalid' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.products (
    farmer_id, name, slug, description, price, stock,
    reseller_commission_percent, status, category, category_slug, subcategory_slug,
    brand_name, sku, short_description, origin_district, unit_label,
    composition, usage_instructions, safety_information, packaging_details,
    image_url, image_urls, image_alt_text, seo_title, meta_description,
    search_keywords, seo_faqs, canonical_slug, seo_review_status
  ) VALUES (
    auth.uid(), trim(p_product->>'name'), trim(p_product->>'slug'),
    trim(p_product->>'description'), (p_product->>'price')::numeric,
    (p_product->>'stock')::numeric,
    coalesce((p_product->>'commission')::numeric, 0), 'draft',
    category_name, trim(p_product->>'category_slug'),
    nullif(trim(p_product->>'subcategory_slug'), ''),
    nullif(trim(p_product->>'brand_name'), ''),
    nullif(trim(p_product->>'sku'), ''),
    nullif(trim(p_product->>'short_description'), ''),
    nullif(trim(p_product->>'origin_district'), ''),
    nullif(trim(p_product->>'unit_label'), ''),
    nullif(trim(p_product->>'composition'), ''),
    nullif(trim(p_product->>'usage_instructions'), ''),
    nullif(trim(p_product->>'safety_information'), ''),
    nullif(trim(p_product->>'packaging_details'), ''),
    nullif(p_product->'image_urls'->>0, ''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_product->'image_urls', '[]'::jsonb))),
    nullif(trim(p_product->>'image_alt_text'), ''),
    nullif(trim(p_product->>'seo_title'), ''),
    nullif(trim(p_product->>'meta_description'), ''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_product->'search_keywords', '[]'::jsonb))),
    coalesce(p_product->'seo_faqs', '[]'::jsonb),
    trim(p_product->>'slug'),
    CASE WHEN coalesce((p_product->>'seo_ready')::boolean, false) THEN 'ready' ELSE 'needs_review' END
  ) RETURNING * INTO result;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), 'product.created', 'product', result.id,
    jsonb_build_object('name', result.name, 'slug', result.slug, 'status', result.status,
      'seo_review_status', result.seo_review_status)
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_product_with_seo(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_product_with_seo(jsonb) TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_update_product_seo(
  p_product_id uuid,
  p_short_description text,
  p_seo_title text,
  p_meta_description text,
  p_image_alt_text text,
  p_image_urls text[],
  p_search_keywords text[],
  p_seo_faqs jsonb
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.products
  SET short_description = nullif(trim(coalesce(p_short_description, '')), ''),
      seo_title = nullif(trim(coalesce(p_seo_title, '')), ''),
      meta_description = nullif(trim(coalesce(p_meta_description, '')), ''),
      image_alt_text = nullif(trim(coalesce(p_image_alt_text, '')), ''),
      image_urls = coalesce(p_image_urls, ARRAY[]::text[]),
      image_url = coalesce(p_image_urls[1], image_url),
      search_keywords = coalesce(p_search_keywords, ARRAY[]::text[]),
      seo_faqs = coalesce(p_seo_faqs, '[]'::jsonb),
      seo_review_status = CASE
        WHEN length(trim(coalesce(p_seo_title, ''))) BETWEEN 1 AND 70
         AND length(trim(coalesce(p_meta_description, ''))) >= 70
         AND length(trim(coalesce(description, ''))) >= 80
         AND cardinality(coalesce(p_image_urls, ARRAY[]::text[])) > 0
         AND nullif(trim(coalesce(p_image_alt_text, '')), '') IS NOT NULL
        THEN 'ready'
        ELSE 'needs_review'
      END,
      updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO result;

  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'product.seo_updated', 'product', result.id,
    jsonb_build_object('slug', result.slug, 'seo_review_status', result.seo_review_status));

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_product_seo(uuid,text,text,text,text,text[],text[],jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product_seo(uuid,text,text,text,text,text[],text[],jsonb) TO authenticated;
