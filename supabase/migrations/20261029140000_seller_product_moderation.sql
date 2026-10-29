-- Secure seller-owned listings and make moderation state database-enforced.
-- Sellers may create/update their own listings, but cannot publish them or set commission.
-- Admin RPCs retain the ability to moderate and configure products.

DROP POLICY IF EXISTS products_farmer_insert ON public.products;
CREATE POLICY products_farmer_insert
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  farmer_id = (SELECT auth.uid())
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = (SELECT auth.uid()) AND m.role IN ('farmer', 'seller')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'farmer'
    )
  )
);

DROP POLICY IF EXISTS products_farmer_update ON public.products;
CREATE POLICY products_farmer_update
ON public.products FOR UPDATE
TO authenticated
USING (
  farmer_id = (SELECT auth.uid())
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = (SELECT auth.uid()) AND m.role IN ('farmer', 'seller')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'farmer'
    )
  )
)
WITH CHECK (
  farmer_id = (SELECT auth.uid())
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = (SELECT auth.uid()) AND m.role IN ('farmer', 'seller')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'farmer'
    )
  )
);

DROP POLICY IF EXISTS products_farmer_delete ON public.products;
CREATE POLICY products_farmer_delete
ON public.products FOR DELETE
TO authenticated
USING (
  farmer_id = (SELECT auth.uid())
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = (SELECT auth.uid()) AND m.role IN ('farmer', 'seller')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'farmer'
    )
  )
);

CREATE OR REPLACE FUNCTION public.enforce_seller_product_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_admin boolean := auth.uid() IS NOT NULL AND public.is_admin();
  v_is_seller boolean := EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid() AND m.role IN ('farmer', 'seller')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'farmer'
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  IF NOT v_is_seller THEN
    RAISE EXCEPTION 'Seller or farmer role required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.farmer_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot create a listing for another seller' USING ERRCODE = '42501';
    END IF;
    -- New seller listings are always drafts and cannot set platform commission.
    NEW.status := 'draft'::public.product_status;
    NEW.reseller_commission_percent := 0;
    RETURN NEW;
  END IF;

  IF OLD.farmer_id <> auth.uid() OR NEW.farmer_id <> OLD.farmer_id THEN
    RAISE EXCEPTION 'Cannot modify another seller listing or transfer ownership' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Listing status changes require moderation' USING ERRCODE = '42501';
  END IF;
  IF NEW.reseller_commission_percent IS DISTINCT FROM OLD.reseller_commission_percent THEN
    RAISE EXCEPTION 'Commission changes require platform administration' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_seller_product_moderation ON public.products;
CREATE TRIGGER enforce_seller_product_moderation
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.enforce_seller_product_moderation();

REVOKE ALL ON FUNCTION public.enforce_seller_product_moderation() FROM PUBLIC, anon, authenticated;
