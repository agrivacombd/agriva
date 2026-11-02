-- Keep anonymous Plant Market catalogue reads public without exposing the
-- authenticated-only is_admin() helper to the anon database role.
DROP POLICY IF EXISTS plant_market_products_public_read ON public.plant_market_products;

CREATE POLICY plant_market_products_anon_read
  ON public.plant_market_products
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY plant_market_products_authenticated_read
  ON public.plant_market_products
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR seller_id = (SELECT auth.uid())
    OR public.is_admin()
  );
