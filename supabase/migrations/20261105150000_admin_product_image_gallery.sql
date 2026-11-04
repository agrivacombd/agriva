-- Let authenticated admins manage the Marketplace product image gallery.
CREATE OR REPLACE FUNCTION public.admin_update_product_images(
  p_product_id uuid,
  p_image_urls text[]
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
  urls text[] := coalesce(p_image_urls, ARRAY[]::text[]);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR cardinality(urls) > 4 OR array_position(urls, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'A product can have at most four valid image URLs';
  END IF;
  UPDATE public.products
  SET image_urls = urls,
      image_url = urls[1],
      updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO result;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'product.images_updated', 'product', result.id,
    jsonb_build_object('image_count', cardinality(urls)));
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_product_images(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product_images(uuid, text[]) TO authenticated;
