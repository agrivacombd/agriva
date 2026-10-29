-- Keep the seller submission trigger compatible with the production schema shipped on main.
-- The richer moderation workflow is still a separate, unmerged feature. Do not reference
-- moderation_status columns or moderation-only helpers until that schema is released.
CREATE OR REPLACE FUNCTION public.enforce_seller_product_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_admin boolean := auth.uid() IS NOT NULL AND public.is_admin();
  v_is_seller boolean := EXISTS (
    SELECT 1
    FROM public.user_role_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.role IN ('seller', 'organization')
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  IF NOT v_is_seller THEN
    RAISE EXCEPTION 'Seller or approved organization role required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.farmer_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Cannot create a listing for another seller' USING ERRCODE = '42501';
    END IF;

    -- Seller submissions remain unpublished until a separate admin review.
    NEW.status := 'draft'::public.product_status;
    NEW.reseller_commission_percent := 0;
    RETURN NEW;
  END IF;

  IF OLD.farmer_id IS DISTINCT FROM auth.uid()
     OR NEW.farmer_id IS DISTINCT FROM OLD.farmer_id THEN
    RAISE EXCEPTION 'Cannot modify another seller listing or transfer ownership' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Listing status changes require platform administration' USING ERRCODE = '42501';
  END IF;

  IF NEW.reseller_commission_percent IS DISTINCT FROM OLD.reseller_commission_percent THEN
    RAISE EXCEPTION 'Commission changes require platform administration' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;
