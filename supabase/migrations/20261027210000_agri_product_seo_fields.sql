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
