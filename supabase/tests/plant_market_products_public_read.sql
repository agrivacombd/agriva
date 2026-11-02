-- Run after 20261102165837_fix_plant_market_public_read_policy.sql.
-- The anonymous policy must not invoke the authenticated-only admin helper.
DO $$
DECLARE
  anon_roles text[];
  anon_qual text;
  authenticated_roles text[];
  authenticated_qual text;
BEGIN
  IF has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not be granted EXECUTE on public.is_admin()';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must retain EXECUTE on public.is_admin()';
  END IF;

  SELECT roles::text[], qual INTO anon_roles, anon_qual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'plant_market_products'
    AND policyname = 'plant_market_products_anon_read';

  IF anon_roles IS DISTINCT FROM ARRAY['anon']::text[] THEN
    RAISE EXCEPTION 'anonymous read policy must target anon only';
  END IF;
  IF anon_qual NOT LIKE '%active%' OR anon_qual LIKE '%is_admin%' THEN
    RAISE EXCEPTION 'anonymous read policy must only expose active products and must not call is_admin()';
  END IF;

  SELECT roles::text[], qual INTO authenticated_roles, authenticated_qual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'plant_market_products'
    AND policyname = 'plant_market_products_authenticated_read';

  IF authenticated_roles IS DISTINCT FROM ARRAY['authenticated']::text[] THEN
    RAISE EXCEPTION 'authenticated read policy must target authenticated only';
  END IF;
  IF authenticated_qual NOT LIKE '%is_admin%' OR authenticated_qual NOT LIKE '%seller_id%' THEN
    RAISE EXCEPTION 'authenticated read policy must preserve seller and admin access';
  END IF;
END
$$;
