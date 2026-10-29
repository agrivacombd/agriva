-- Restore public reads for active subcategories while keeping inactive rows admin-only.
-- Mutations remain RPC-owned; no direct write policy is added.
DROP POLICY IF EXISTS product_subcategories_public_read ON public.product_subcategories;
CREATE POLICY product_subcategories_public_read
ON public.product_subcategories
FOR SELECT TO anon, authenticated
USING (is_active OR public.has_platform_admin_access());
