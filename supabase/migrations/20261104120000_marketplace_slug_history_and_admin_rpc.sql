-- Marketplace-only immutable slug history and audited Admin slug updates.
-- Plant Market uses its own namespace and is intentionally not touched here.
CREATE TABLE IF NOT EXISTS public.marketplace_product_slug_redirects (
  old_slug text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT marketplace_product_slug_redirects_slug_format
    CHECK (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(old_slug) BETWEEN 3 AND 80)
);

CREATE INDEX IF NOT EXISTS marketplace_product_slug_redirects_product_id_idx
  ON public.marketplace_product_slug_redirects(product_id);

ALTER TABLE public.marketplace_product_slug_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_product_slug_redirects_public_read
  ON public.marketplace_product_slug_redirects;
CREATE POLICY marketplace_product_slug_redirects_public_read
  ON public.marketplace_product_slug_redirects
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE ALL ON TABLE public.marketplace_product_slug_redirects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.marketplace_product_slug_redirects TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_product_slug(
  p_product_id uuid,
  p_new_slug text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_old_slug text;
  v_new_slug text := lower(btrim(p_new_slug));
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin permission required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR v_new_slug IS NULL
     OR length(v_new_slug) < 3 OR length(v_new_slug) > 80
     OR v_new_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR v_new_slug IN ('admin', 'api', 'new', 'search', 'category', 'categories') THEN
    RAISE EXCEPTION 'Invalid or reserved product slug' USING ERRCODE = '22023';
  END IF;

  SELECT slug INTO v_old_slug
  FROM public.products
  WHERE id = p_product_id AND marketplace_channel = 'marketplace'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marketplace product not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_old_slug IS NOT DISTINCT FROM v_new_slug THEN
    RETURN v_new_slug;
  END IF;

  IF EXISTS (SELECT 1 FROM public.products WHERE slug = v_new_slug AND id <> p_product_id)
     OR EXISTS (SELECT 1 FROM public.marketplace_product_slug_redirects WHERE old_slug = v_new_slug) THEN
    RAISE EXCEPTION 'Slug is already in use or reserved by redirect history' USING ERRCODE = '23505';
  END IF;

  IF v_old_slug IS NOT NULL THEN
    INSERT INTO public.marketplace_product_slug_redirects(old_slug, product_id, created_by)
    VALUES (v_old_slug, p_product_id, v_actor)
    ON CONFLICT (old_slug) DO NOTHING;
  END IF;

  UPDATE public.products
  SET slug = v_new_slug, updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'marketplace.product.slug_changed',
    'product',
    p_product_id,
    jsonb_build_object('old_slug', v_old_slug, 'new_slug', v_new_slug)
  );

  RETURN v_new_slug;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_product_slug(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product_slug(uuid, text) TO authenticated, service_role;
