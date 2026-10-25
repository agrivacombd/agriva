-- Restrict the admin predicate RPC to authenticated callers.
-- Policies that need it are scoped to authenticated; public category reads
-- remain available without exposing the helper itself to anonymous callers.

ALTER POLICY attribution_owner_read
  ON public.attribution_sessions TO authenticated;

ALTER POLICY marketplace_orders_parties_read
  ON public.marketplace_orders TO authenticated;

DROP POLICY product_categories_public_read ON public.product_categories;

CREATE POLICY product_categories_public_read
  ON public.product_categories
  FOR SELECT
  TO anon
  USING (is_active);

CREATE POLICY product_categories_authenticated_read
  ON public.product_categories
  FOR SELECT
  TO authenticated
  USING (is_active OR public.is_admin());

ALTER POLICY products_admin_read
  ON public.products TO authenticated;

ALTER POLICY profiles_admin_read
  ON public.profiles TO authenticated;

ALTER POLICY reseller_commissions_owner_read
  ON public.reseller_commissions TO authenticated;

ALTER POLICY reseller_links_owner_read
  ON public.reseller_links TO authenticated;

ALTER POLICY site_settings_admin_read
  ON public.site_settings TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
