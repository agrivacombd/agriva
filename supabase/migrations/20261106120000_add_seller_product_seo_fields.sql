-- Seller-authored product SEO and structured detail fields.
-- Ensure the Marketplace SEO columns exist on a clean replay as well as on
-- deployed schemas that may already have received them through another path.
-- Plant Market has an independent table and receives equivalent SEO fields.
-- Additive only: no existing product data or publication status is changed.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS usage_instructions text,
  ADD COLUMN IF NOT EXISTS image_alt text;

ALTER TABLE public.plant_market_products
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS usage_instructions text,
  ADD COLUMN IF NOT EXISTS image_alt text;

COMMENT ON COLUMN public.products.seo_title IS 'Seller-supplied search title; rendered only for active Marketplace products.';
COMMENT ON COLUMN public.products.seo_description IS 'Seller-supplied search description; rendered only for active Marketplace products.';
COMMENT ON COLUMN public.plant_market_products.seo_title IS 'Seller-supplied search title; rendered only for active Plant Market products.';
COMMENT ON COLUMN public.plant_market_products.seo_description IS 'Seller-supplied search description; rendered only for active Plant Market products.';
