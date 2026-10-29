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
      AND membership.role = 'seller'
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
      AND membership.role = 'seller'
  )
);
