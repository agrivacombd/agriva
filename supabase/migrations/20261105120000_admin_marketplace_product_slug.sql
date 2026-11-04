-- Admin-managed marketplace product slugs.
CREATE OR REPLACE FUNCTION public.admin_create_marketplace_product(
  p_name text, p_slug text, p_description text, p_price numeric, p_stock numeric,
  p_commission_percent numeric, p_category_slug text, p_subcategory_slug text
)
RETURNS public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
  category_name text;
  subcategory_name text;
  normalized_slug text := lower(trim(p_slug));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(p_name), '') IS NULL OR length(trim(p_name)) > 160 THEN
    RAISE EXCEPTION 'Product name is required';
  END IF;
  IF normalized_slug IS NULL OR normalized_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(normalized_slug) > 100 THEN
    RAISE EXCEPTION 'Product slug must be lowercase kebab-case';
  END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE slug = normalized_slug) THEN
    RAISE EXCEPTION 'Product slug already exists' USING ERRCODE = '23505';
  END IF;
  IF p_price IS NULL OR p_price <= 0 OR p_stock IS NULL OR p_stock < 0 THEN
    RAISE EXCEPTION 'Price must be positive and stock must be non-negative';
  END IF;
  IF p_commission_percent IS NULL OR p_commission_percent < 0 OR p_commission_percent > 100 THEN
    RAISE EXCEPTION 'Commission must be between 0 and 100';
  END IF;
  SELECT c.name, s.name INTO category_name, subcategory_name
  FROM public.product_categories c
  JOIN public.product_subcategories s ON s.category_slug = c.slug
  WHERE c.slug = trim(p_category_slug) AND c.is_active = true
    AND s.slug = trim(p_subcategory_slug) AND s.is_active = true;
  IF category_name IS NULL OR subcategory_name IS NULL THEN
    RAISE EXCEPTION 'Category or subcategory does not exist or is inactive';
  END IF;
  INSERT INTO public.products (
    farmer_id, name, slug, description, price, stock,
    reseller_commission_percent, status, category, category_slug, subcategory_slug
  ) VALUES (
    auth.uid(), trim(p_name), normalized_slug, nullif(trim(coalesce(p_description, '')), ''),
    p_price, p_stock, p_commission_percent, 'draft', subcategory_name,
    trim(p_category_slug), trim(p_subcategory_slug)
  ) RETURNING * INTO result;
  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES(auth.uid(), 'product.created', 'product', result.id,
    jsonb_build_object('name', result.name, 'slug', result.slug,
      'category_slug', result.category_slug, 'subcategory_slug', result.subcategory_slug,
      'status', result.status));
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_marketplace_product(text,text,text,numeric,numeric,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_marketplace_product(text,text,text,numeric,numeric,numeric,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_product(
  p_product_id uuid, p_name text, p_slug text, p_description text, p_price numeric,
  p_stock numeric, p_commission_percent numeric, p_status public.product_status
)
RETURNS public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result public.products;
  normalized_slug text := lower(trim(p_slug));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR nullif(trim(p_name), '') IS NULL OR length(trim(p_name)) > 160 THEN
    RAISE EXCEPTION 'Product ID and name are required';
  END IF;
  IF normalized_slug IS NULL OR normalized_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(normalized_slug) > 100 THEN
    RAISE EXCEPTION 'Product slug must be lowercase kebab-case';
  END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE slug = normalized_slug AND id <> p_product_id) THEN
    RAISE EXCEPTION 'Product slug already exists' USING ERRCODE = '23505';
  END IF;
  IF p_price IS NULL OR p_price < 0 OR p_stock IS NULL OR p_stock < 0 THEN
    RAISE EXCEPTION 'Price and stock must be non-negative';
  END IF;
  IF p_commission_percent IS NULL OR p_commission_percent < 0 OR p_commission_percent > 100 THEN
    RAISE EXCEPTION 'Commission must be between 0 and 100';
  END IF;
  UPDATE public.products
  SET name = trim(p_name), slug = normalized_slug,
      description = nullif(trim(coalesce(p_description, '')), ''),
      price = p_price, stock = p_stock, reseller_commission_percent = p_commission_percent,
      status = p_status, updated_at = now()
  WHERE id = p_product_id RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES(auth.uid(), 'product.updated', 'product', result.id,
    jsonb_build_object('name', result.name, 'slug', result.slug,
      'price', result.price, 'stock', result.stock, 'status', result.status));
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_product(uuid,text,text,text,numeric,numeric,numeric,public.product_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product(uuid,text,text,text,numeric,numeric,numeric,public.product_status) TO authenticated;
