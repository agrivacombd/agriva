-- Keep anonymous catalogue reads independent from authenticated seller/admin access.
-- The previous combined policy evaluated public.is_admin() for anon requests,
-- but EXECUTE is intentionally not granted to anon.
DROP POLICY IF EXISTS plant_market_products_public_read ON public.plant_market_products;

CREATE POLICY plant_market_products_anon_public_read
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
