-- Separate marketplace business listings from farmers' harvest listings.
-- Farmers use harvest_listings on /sell-harvest; marketplace catalogue products
-- are submitted by users with an explicit seller membership and remain drafts.
DROP POLICY IF EXISTS "products_farmer_insert" ON public.products;
DROP POLICY IF EXISTS "products_seller_insert" ON public.products;

CREATE POLICY "products_seller_insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = farmer_id
  AND status = 'draft'
  AND EXISTS (
    SELECT 1
    FROM public.user_role_memberships membership
    WHERE membership.user_id = (SELECT auth.uid())
      AND membership.role IN ('seller', 'organization')
  )
);

-- Replace the legacy farmer-only image upload policy with seller membership.
DROP POLICY IF EXISTS "Farmers can upload own product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can upload own product images" ON storage.objects;

CREATE POLICY "Sellers can upload own product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.user_role_memberships membership
    WHERE membership.user_id = (SELECT auth.uid())
      AND membership.role IN ('seller', 'organization')
  )
);


-- Keep the database moderation guard aligned with the approved seller roles.
-- Organizations are admin-approved memberships and must be able to submit drafts.
CREATE OR REPLACE FUNCTION public.enforce_seller_product_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_platform_admin boolean := auth.uid() IS NOT NULL AND (
    public.has_platform_admin_access()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
    )
  );
  v_can_moderate boolean := auth.uid() IS NOT NULL AND public.has_product_moderation_permission();
  v_is_seller boolean := EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid() AND m.role IN ('farmer', 'seller', 'organization')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'farmer'
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_is_platform_admin THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'active' THEN
        NEW.moderation_status := 'approved';
        NEW.moderation_reason := NULL;
        NEW.moderated_by := auth.uid();
        NEW.moderated_at := now();
      ELSIF NEW.status = 'draft' AND OLD.status = 'active'
         AND NEW.moderation_status IS NOT DISTINCT FROM OLD.moderation_status THEN
        NEW.moderation_status := 'pending';
        NEW.moderated_by := auth.uid();
        NEW.moderated_at := now();
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF v_can_moderate AND TG_OP = 'UPDATE' AND OLD.farmer_id <> auth.uid() THEN
    IF (to_jsonb(NEW) - ARRAY[
      'status', 'moderation_status', 'moderation_reason', 'moderated_by',
      'moderated_at', 'updated_at'
    ]) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY[
      'status', 'moderation_status', 'moderation_reason', 'moderated_by',
      'moderated_at', 'updated_at'
    ]) THEN
      RAISE EXCEPTION 'Product moderators may only change moderation fields' USING ERRCODE = '42501';
    END IF;

    IF NEW.moderated_by IS DISTINCT FROM auth.uid() OR NEW.moderated_at IS NULL THEN
      RAISE EXCEPTION 'Moderation attribution is required' USING ERRCODE = '42501';
    END IF;
    IF NEW.moderation_status = 'approved' THEN
      IF NEW.status <> 'active' OR NEW.moderation_reason IS NOT NULL THEN
        RAISE EXCEPTION 'Approved listings must be active and have no review reason' USING ERRCODE = '22023';
      END IF;
    ELSIF NEW.moderation_status IN ('rejected', 'changes_requested') THEN
      IF NEW.status <> 'draft' OR char_length(btrim(COALESCE(NEW.moderation_reason, ''))) < 3
         OR char_length(NEW.moderation_reason) > 1000 THEN
        RAISE EXCEPTION 'Rejected or returned listings require a draft state and a valid reason' USING ERRCODE = '22023';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid moderation transition' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'product.moderation.' || NEW.moderation_status,
      'product',
      NEW.id,
      jsonb_build_object('decision', NEW.moderation_status, 'reason', NEW.moderation_reason, 'seller_id', NEW.farmer_id)
    );
    RETURN NEW;
  END IF;

  IF NOT v_is_seller THEN
    RAISE EXCEPTION 'Seller or farmer role required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.farmer_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot create a listing for another seller' USING ERRCODE = '42501';
    END IF;
    NEW.status := 'draft'::public.product_status;
    NEW.reseller_commission_percent := 0;
    NEW.moderation_status := 'pending';
    NEW.moderation_reason := NULL;
    NEW.moderated_by := NULL;
    NEW.moderated_at := NULL;
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
  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
     OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
     OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at THEN
    RAISE EXCEPTION 'Moderation fields are platform-controlled' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;
