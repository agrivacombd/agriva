-- Admin-editable image alt text and missing-attribute suggestions from the SEO assistant.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_image_alt_texts text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_attribute_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seo_attribute_suggestions_is_array;
ALTER TABLE public.products
  ADD CONSTRAINT products_seo_attribute_suggestions_is_array
  CHECK (CASE WHEN jsonb_typeof(seo_attribute_suggestions) = 'array' THEN jsonb_array_length(seo_attribute_suggestions) <= 24 ELSE false END);

CREATE OR REPLACE FUNCTION public.admin_update_product_seo_assistant_details(
  p_product_id uuid,
  p_seo_image_alt_texts text[],
  p_seo_attribute_suggestions jsonb
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
  normalized_alts text[] := coalesce(p_seo_image_alt_texts, '{}'::text[]);
  normalized_suggestions jsonb := coalesce(p_seo_attribute_suggestions, '[]'::jsonb);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING errcode = '42501';
  END IF;
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID is required';
  END IF;
  IF cardinality(normalized_alts) > 4
    OR EXISTS (SELECT 1 FROM unnest(normalized_alts) alt WHERE nullif(trim(alt), '') IS NULL OR char_length(alt) > 250) THEN
    RAISE EXCEPTION 'Provide at most four non-empty image alt texts, each 250 characters or less';
  END IF;
  IF jsonb_typeof(normalized_suggestions) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Attribute suggestions must be a JSON array';
  END IF;
  IF jsonb_array_length(normalized_suggestions) > 24 THEN
    RAISE EXCEPTION 'Provide at most 24 attribute suggestions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(normalized_suggestions) suggestion
    WHERE jsonb_typeof(suggestion) <> 'object'
      OR nullif(trim(suggestion->>'key'), '') IS NULL
      OR nullif(trim(suggestion->>'label'), '') IS NULL
      OR nullif(trim(suggestion->>'reason'), '') IS NULL
      OR char_length(suggestion->>'key') > 80
      OR char_length(suggestion->>'label') > 120
      OR char_length(suggestion->>'reason') > 300
  ) THEN
    RAISE EXCEPTION 'Each attribute suggestion needs a key, label and reason within the allowed lengths';
  END IF;

  UPDATE public.products
  SET seo_image_alt_texts = normalized_alts,
      seo_attribute_suggestions = normalized_suggestions,
      updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'product.seo_assistant_details_updated', 'product', result.id,
    jsonb_build_object('image_alt_count', cardinality(result.seo_image_alt_texts),
      'attribute_suggestion_count', jsonb_array_length(result.seo_attribute_suggestions)));

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_product_seo_assistant_details(uuid,text[],jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product_seo_assistant_details(uuid,text[],jsonb) TO authenticated;
