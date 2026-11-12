-- Marketplace duplicate detection; independent seller URLs remain independent.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.find_marketplace_product_duplicates(
  p_name text, p_category_slug text, p_brand text DEFAULT NULL, p_description text DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid, product_name text, product_slug text, match_type text,
  title_similarity real, description_similarity real, is_same_seller boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  WITH incoming AS (
    SELECT
      lower(trim(regexp_replace(coalesce(p_name, ''), '[^[:alnum:]]+', ' ', 'g'))) AS normalized_name,
      lower(trim(regexp_replace(coalesce(p_description, ''), '<[^>]+>', ' ', 'g'))) AS normalized_description,
      lower(trim(coalesce(p_brand, ''))) AS normalized_brand
  ),
  candidates AS (
    SELECT p.id, p.name, p.slug, p.farmer_id = auth.uid() AS same_seller,
      extensions.similarity(lower(trim(regexp_replace(coalesce(p.name, ''), '[^[:alnum:]]+', ' ', 'g'))), i.normalized_name) AS title_score,
      extensions.similarity(
        lower(trim(regexp_replace(regexp_replace(coalesce(p.description, ''), '<[^>]+>', ' ', 'g'), '[^[:alnum:]]+', ' ', 'g'))),
        lower(trim(regexp_replace(i.normalized_description, '[^[:alnum:]]+', ' ', 'g')))
      ) AS description_score,
      lower(trim(coalesce(p.brand, ''))) = i.normalized_brand AND i.normalized_brand <> '' AS same_brand,
      lower(trim(regexp_replace(coalesce(p.name, ''), '[^[:alnum:]]+', ' ', 'g'))) = i.normalized_name AS exact_title
    FROM public.products p CROSS JOIN incoming i
    WHERE p.status = 'active' AND p.marketplace_channel = 'marketplace'
      AND p.category_slug = p_category_slug AND p.farmer_id IS NOT NULL
  )
  SELECT c.id, c.name, c.slug,
    CASE WHEN c.exact_title THEN 'exact_title'
      WHEN c.title_score >= 0.78 AND c.same_brand THEN 'similar_title_same_brand'
      WHEN c.title_score >= 0.78 THEN 'similar_title'
      WHEN c.description_score >= 0.78 THEN 'similar_description'
      ELSE 'possible_content_overlap' END,
    c.title_score, c.description_score, c.same_seller
  FROM candidates c
  WHERE c.exact_title OR c.title_score >= 0.78
     OR (c.description_score >= 0.78 AND c.same_brand)
  ORDER BY c.same_seller DESC, greatest(c.title_score, c.description_score) DESC
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.find_marketplace_product_duplicates(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_marketplace_product_duplicates(text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.find_marketplace_product_duplicates(text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.find_marketplace_product_duplicates(text, text, text, text)
IS 'Returns minimal duplicate signals. Cross-seller listings remain independent pages and must not be cross-canonicalized.';
