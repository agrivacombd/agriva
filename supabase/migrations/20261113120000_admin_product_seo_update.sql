-- Dedicated admin-only SEO update with auditing and no publication status change.
CREATE OR REPLACE FUNCTION public.admin_update_product_seo(
  p_product_id uuid, p_seo_title text, p_seo_description text,
  p_focus_keyword text, p_seo_keywords text[], p_highlights text[], p_image_alt text
) RETURNS public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE result public.products;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL
    OR length(coalesce(p_seo_title,'')) > 70
    OR length(coalesce(p_seo_description,'')) > 200
    OR length(coalesce(p_focus_keyword,'')) > 100
    OR length(coalesce(p_image_alt,'')) > 180
    OR coalesce(array_length(p_seo_keywords,1),0) > 8
    OR coalesce(array_length(p_highlights,1),0) > 5
    OR EXISTS (SELECT 1 FROM unnest(coalesce(p_seo_keywords,'{}'::text[])) AS keyword(value) WHERE length(keyword.value) > 120)
    OR EXISTS (SELECT 1 FROM unnest(coalesce(p_highlights,'{}'::text[])) AS highlight(value) WHERE length(highlight.value) > 120)
  THEN RAISE EXCEPTION 'Invalid SEO fields'; END IF;
  UPDATE public.products SET
    seo_title = nullif(trim(coalesce(p_seo_title,'')),''),
    seo_description = nullif(trim(coalesce(p_seo_description,'')),''),
    focus_keyword = nullif(trim(coalesce(p_focus_keyword,'')),''),
    seo_keywords = coalesce(p_seo_keywords,'{}'::text[]),
    highlights = coalesce(p_highlights,'{}'::text[]),
    image_alt = nullif(trim(coalesce(p_image_alt,'')),''),
    updated_at = now()
  WHERE id = p_product_id AND deleted_at IS NULL RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
  INSERT INTO public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
  VALUES (auth.uid(),'product.seo_updated','product',result.id,
    jsonb_build_object('seo_title',result.seo_title,'focus_keyword',result.focus_keyword));
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_product_seo(uuid,text,text,text,text[],text[],text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product_seo(uuid,text,text,text,text[],text[],text) TO authenticated;
