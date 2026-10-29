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

-- Keep SEO edits behind an audited SECURITY DEFINER RPC because admins have
-- catalogue read policies, not unrestricted direct UPDATE access.
CREATE OR REPLACE FUNCTION public.admin_update_product_seo(
  p_product_id uuid,
  p_seo_title text,
  p_seo_description text,
  p_seo_keywords text[],
  p_seo_content text,
  p_seo_faqs jsonb
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
  normalized_keywords text[] := coalesce(p_seo_keywords, '{}'::text[]);
  normalized_faqs jsonb := coalesce(p_seo_faqs, '[]'::jsonb);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING errcode = '42501';
  END IF;
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID is required';
  END IF;
  IF char_length(coalesce(p_seo_title, '')) > 70
    OR char_length(coalesce(p_seo_description, '')) > 160
    OR char_length(coalesce(p_seo_content, '')) > 10000 THEN
    RAISE EXCEPTION 'SEO title, description, or content exceeds the allowed length';
  END IF;
  IF cardinality(normalized_keywords) > 10
    OR EXISTS (SELECT 1 FROM unnest(normalized_keywords) keyword WHERE char_length(keyword) > 60 OR nullif(trim(keyword), '') IS NULL) THEN
    RAISE EXCEPTION 'Provide at most 10 non-empty SEO keywords, each 60 characters or less';
  END IF;
  IF jsonb_typeof(normalized_faqs) <> 'array' OR jsonb_array_length(normalized_faqs) > 8 THEN
    RAISE EXCEPTION 'SEO FAQs must be an array with at most 8 items';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(normalized_faqs) faq
    WHERE jsonb_typeof(faq) <> 'object'
      OR nullif(trim(faq->>'question'), '') IS NULL
      OR nullif(trim(faq->>'answer'), '') IS NULL
      OR char_length(faq->>'question') > 160
      OR char_length(faq->>'answer') > 500
  ) THEN
    RAISE EXCEPTION 'Each FAQ needs a question (max 160 chars) and answer (max 500 chars)';
  END IF;

  UPDATE public.products
  SET seo_title = nullif(trim(coalesce(p_seo_title, '')), ''),
      seo_description = nullif(trim(coalesce(p_seo_description, '')), ''),
      seo_keywords = normalized_keywords,
      seo_content = nullif(trim(coalesce(p_seo_content, '')), ''),
      seo_faqs = normalized_faqs,
      updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'product.seo_updated', 'product', result.id,
    jsonb_build_object(
      'seo_title_set', result.seo_title IS NOT NULL,
      'seo_description_set', result.seo_description IS NOT NULL,
      'keyword_count', cardinality(result.seo_keywords),
      'content_length', char_length(coalesce(result.seo_content, '')),
      'faq_count', jsonb_array_length(result.seo_faqs)
    ));

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_product_seo(uuid,text,text,text[],text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product_seo(uuid,text,text,text[],text,jsonb) TO authenticated;
