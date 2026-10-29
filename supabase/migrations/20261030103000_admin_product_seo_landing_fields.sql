-- Add editable search metadata and useful on-page content for admin-managed product landing pages.
-- All columns are additive and safe for existing products.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_content text,
  ADD COLUMN IF NOT EXISTS seo_faqs jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seo_faqs_is_array;
ALTER TABLE public.products
  ADD CONSTRAINT products_seo_faqs_is_array
  CHECK (jsonb_typeof(seo_faqs) = 'array');

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seo_title_length;
ALTER TABLE public.products
  ADD CONSTRAINT products_seo_title_length
  CHECK (seo_title IS NULL OR char_length(seo_title) <= 70);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seo_description_length;
ALTER TABLE public.products
  ADD CONSTRAINT products_seo_description_length
  CHECK (seo_description IS NULL OR char_length(seo_description) <= 160);
