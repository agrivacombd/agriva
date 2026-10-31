-- AGRIVA: keep the Marketplace product/order schema intact and move Plant Market
-- listings to an independent catalogue. Seller authorization reuses the existing
-- module_access_applications, user_module_grants and gardener_profiles system.
-- No production Marketplace rows are reclassified by this migration.

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.products
    WHERE marketplace_channel IS DISTINCT FROM 'marketplace'
  ) THEN
    RAISE EXCEPTION 'products contains non-Marketplace channel rows; audit and migrate them to plant_market_products before enforcing separation';
  END IF;
END;
$guard$;

DO $channel_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_marketplace_only_channel_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_marketplace_only_channel_check
      CHECK (marketplace_channel = 'marketplace') NOT VALID;
  END IF;
END;
$channel_constraint$;
ALTER TABLE public.products VALIDATE CONSTRAINT products_marketplace_only_channel_check;

-- Existing shared-table policies allowed both channels. Keep the Marketplace
-- module-grant contract, but prohibit Plant Market writes to public.products.
DROP POLICY IF EXISTS products_marketplace_seller_insert ON public.products;
DROP POLICY IF EXISTS products_marketplace_seller_update ON public.products;
DROP POLICY IF EXISTS products_marketplace_seller_delete ON public.products;
DROP POLICY IF EXISTS products_module_access_insert_guard ON public.products;
CREATE POLICY products_module_access_insert_guard ON public.products
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR (
      farmer_id = (SELECT auth.uid())
      AND marketplace_channel = 'marketplace'
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.owner_id = (SELECT auth.uid())
          AND o.status = 'verified'
          AND public.has_module_access('marketplace','create','organization',o.id)
      )
    )
  );
-- The permissive insert policy must also use the verified organization grant;
-- the legacy seller-role policy would block newly approved module applicants.
DROP POLICY IF EXISTS products_seller_insert ON public.products;
CREATE POLICY products_seller_insert ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR (
      farmer_id = (SELECT auth.uid())
      AND marketplace_channel = 'marketplace'
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.owner_id = (SELECT auth.uid())
          AND o.status = 'verified'
          AND public.has_module_access('marketplace','create','organization',o.id)
      )
    )
  );

DROP POLICY IF EXISTS products_module_access_update_guard ON public.products;
CREATE POLICY products_module_access_update_guard ON public.products
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR (
      farmer_id = (SELECT auth.uid())
      AND marketplace_channel = 'marketplace'
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.owner_id = (SELECT auth.uid())
          AND o.status = 'verified'
          AND public.has_module_access('marketplace','update','organization',o.id)
      )
    )
  )
  WITH CHECK (
    public.is_admin() OR (
      farmer_id = (SELECT auth.uid())
      AND marketplace_channel = 'marketplace'
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.owner_id = (SELECT auth.uid())
          AND o.status = 'verified'
          AND public.has_module_access('marketplace','create','organization',o.id)
      )
    )
  );

DROP POLICY IF EXISTS products_module_access_delete_guard ON public.products;
CREATE POLICY products_module_access_delete_guard ON public.products
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (
    public.is_admin() OR (
      farmer_id = (SELECT auth.uid())
      AND marketplace_channel = 'marketplace'
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.owner_id = (SELECT auth.uid())
          AND o.status = 'verified'
          AND public.has_module_access('marketplace','delete','organization',o.id)
      )
    )
  );

-- New physical catalogue: no Plant Market product is stored in public.products.
CREATE TABLE IF NOT EXISTS public.plant_market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  slug text NOT NULL UNIQUE,
  scientific_name text,
  category text NOT NULL,
  category_slug text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  stock numeric(12,2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit text NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece','pot','pack','tray')),
  plant_size text,
  pot_size text,
  plant_age text,
  sunlight text,
  watering text,
  flowering_season text,
  delivery_area text,
  image_url text,
  images text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','rejected','suspended')),
  moderation_note text,
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plant_market_products_public_idx
  ON public.plant_market_products(status, category_slug, created_at DESC);
DROP INDEX IF EXISTS public.plant_market_products_seller_idx;
CREATE INDEX plant_market_products_seller_idx
  ON public.plant_market_products(seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS plant_market_products_moderated_by_idx
  ON public.plant_market_products(moderated_by) WHERE moderated_by IS NOT NULL;
ALTER TABLE public.plant_market_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.plant_market_products FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.plant_market_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.plant_market_products TO authenticated;

DROP POLICY IF EXISTS plant_market_products_owner_insert ON public.plant_market_products;
DROP POLICY IF EXISTS plant_market_products_owner_update ON public.plant_market_products;
DROP POLICY IF EXISTS plant_market_products_public_read ON public.plant_market_products;
CREATE POLICY plant_market_products_public_read ON public.plant_market_products
  FOR SELECT TO anon, authenticated USING (
    status = 'active'
    OR seller_id = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS plant_market_products_seller_insert ON public.plant_market_products;
CREATE POLICY plant_market_products_seller_insert ON public.plant_market_products
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin() OR (
      seller_id = (SELECT auth.uid())
      AND status = 'draft'
      AND EXISTS (
        SELECT 1 FROM public.gardener_profiles gp
        WHERE gp.user_id = (SELECT auth.uid()) AND gp.verification_status = 'verified'
      )
      AND public.has_module_access('plant_market','create','global',NULL::uuid)
    )
  );
DROP POLICY IF EXISTS plant_market_products_seller_update ON public.plant_market_products;
CREATE POLICY plant_market_products_seller_update ON public.plant_market_products
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR (
      seller_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.gardener_profiles gp
        WHERE gp.user_id = (SELECT auth.uid()) AND gp.verification_status = 'verified'
      )
      AND public.has_module_access('plant_market','update','global',NULL::uuid)
    )
  )
  WITH CHECK (
    public.is_admin() OR (
      seller_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.gardener_profiles gp
        WHERE gp.user_id = (SELECT auth.uid()) AND gp.verification_status = 'verified'
      )
      AND public.has_module_access('plant_market','update','global',NULL::uuid)
    )
  );
DROP POLICY IF EXISTS plant_market_products_seller_delete ON public.plant_market_products;
CREATE POLICY plant_market_products_seller_delete ON public.plant_market_products
  FOR DELETE TO authenticated USING (
    public.is_admin() OR (
      seller_id = (SELECT auth.uid())
      AND public.has_module_access('plant_market','delete','global',NULL::uuid)
    )
  );

CREATE OR REPLACE FUNCTION public.guard_plant_market_product_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin boolean := auth.uid() IS NOT NULL AND public.is_admin();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'active' AND NOT EXISTS (
    SELECT 1
    FROM public.user_module_grants g
    JOIN public.gardener_profiles gp ON gp.user_id = g.user_id
    WHERE g.user_id = NEW.seller_id
      AND g.module = 'plant_market'
      AND g.permission = 'create'
      AND g.scope_type = 'global'
      AND g.scope_id IS NULL
      AND g.status = 'active'
      AND (g.expires_at IS NULL OR g.expires_at > now())
      AND gp.verification_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'Plant Market listing requires verified gardener identity and active Plant Market create grant'
      USING ERRCODE = '42501';
  END IF;

  IF v_admin THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.moderated_by := auth.uid();
      NEW.moderated_at := now();
      IF NEW.status = 'active' THEN
        NEW.moderation_note := NULL;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.seller_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot create a Plant Market listing for another seller' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.gardener_profiles gp
      WHERE gp.user_id = auth.uid() AND gp.verification_status = 'verified'
    ) OR NOT public.has_module_access('plant_market','create','global',NULL::uuid) THEN
      RAISE EXCEPTION 'Verified Plant Market seller access required' USING ERRCODE = '42501';
    END IF;
    NEW.status := 'draft';
    NEW.moderation_note := NULL;
    NEW.moderated_by := NULL;
    NEW.moderated_at := NULL;
    RETURN NEW;
  END IF;

  IF OLD.seller_id <> auth.uid() OR NEW.seller_id <> OLD.seller_id THEN
    RAISE EXCEPTION 'Cannot modify another seller listing or transfer ownership' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note
     OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
     OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at THEN
    RAISE EXCEPTION 'Plant Market moderation fields are platform-controlled' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_module_access('plant_market','update','global',NULL::uuid) THEN
    RAISE EXCEPTION 'Active Plant Market update grant required' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.guard_plant_market_product_write() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS plant_market_products_write_guard ON public.plant_market_products;
CREATE TRIGGER plant_market_products_write_guard
  BEFORE INSERT OR UPDATE ON public.plant_market_products
  FOR EACH ROW EXECUTE FUNCTION public.guard_plant_market_product_write();

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('plant-product-images','plant-product-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
SET public=true,file_size_limit=5242880,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];
DROP POLICY IF EXISTS plant_product_images_insert_own ON storage.objects;
CREATE POLICY plant_product_images_insert_own ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'plant-product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.gardener_profiles gp
      WHERE gp.user_id = (SELECT auth.uid()) AND gp.verification_status = 'verified'
    )
    AND public.has_module_access('plant_market','create','global',NULL::uuid)
  );
DROP POLICY IF EXISTS plant_product_images_update_own ON storage.objects;
CREATE POLICY plant_product_images_update_own ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'plant-product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND public.has_module_access('plant_market','update','global',NULL::uuid)
  ) WITH CHECK (
    bucket_id = 'plant-product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND public.has_module_access('plant_market','update','global',NULL::uuid)
  );
DROP POLICY IF EXISTS plant_product_images_delete_own ON storage.objects;
CREATE POLICY plant_product_images_delete_own ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'plant-product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND public.has_module_access('plant_market','delete','global',NULL::uuid)
  );

-- Revoking one module's create grant pauses only that module's active listings.
CREATE OR REPLACE FUNCTION public.pause_market_listings_on_module_grant_revocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'revoked'
     AND NEW.permission = 'create' AND NEW.module = 'marketplace'
     AND NOT EXISTS (
       SELECT 1 FROM public.user_module_grants g
       JOIN public.organizations o ON o.id = g.scope_id
       WHERE g.user_id = NEW.user_id AND g.module = 'marketplace'
         AND g.permission = 'create' AND g.scope_type = 'organization'
         AND g.status = 'active' AND (g.expires_at IS NULL OR g.expires_at > now())
         AND o.owner_id = NEW.user_id AND o.status = 'verified'
     ) THEN
    UPDATE public.products
    SET status = 'paused'::public.product_status, updated_at = now()
    WHERE farmer_id = NEW.user_id AND marketplace_channel = 'marketplace' AND status = 'active';
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'revoked'
     AND NEW.permission = 'create' AND NEW.module = 'plant_market'
     AND NOT EXISTS (
       SELECT 1 FROM public.user_module_grants g
       WHERE g.user_id = NEW.user_id AND g.module = 'plant_market'
         AND g.permission = 'create' AND g.scope_type = 'global'
         AND g.scope_id IS NULL AND g.status = 'active'
         AND (g.expires_at IS NULL OR g.expires_at > now())
     ) THEN
    UPDATE public.plant_market_products
    SET status = 'suspended', moderation_note = 'Plant Market access revoked',
        moderated_by = auth.uid(), moderated_at = now(), updated_at = now()
    WHERE seller_id = NEW.user_id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.pause_market_listings_on_module_grant_revocation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS user_module_grants_pause_market_listings ON public.user_module_grants;
CREATE TRIGGER user_module_grants_pause_market_listings
  AFTER UPDATE OF status ON public.user_module_grants
  FOR EACH ROW EXECUTE FUNCTION public.pause_market_listings_on_module_grant_revocation();

CREATE OR REPLACE FUNCTION public.admin_revoke_market_access(
  p_user_id uuid,
  p_module text,
  p_scope_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  IF p_module NOT IN ('marketplace','plant_market')
     OR (p_module = 'marketplace' AND p_scope_id IS NULL)
     OR (p_module = 'plant_market' AND p_scope_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Invalid module or scope' USING ERRCODE = '22023';
  END IF;
  UPDATE public.user_module_grants
  SET status = 'revoked', revoked_by = auth.uid(), revoked_at = now(),
      reason = 'Seller access revoked by administrator'
  WHERE user_id = p_user_id AND module = p_module AND status = 'active'
    AND (
      (p_module = 'marketplace' AND scope_type = 'organization' AND scope_id = p_scope_id)
      OR (p_module = 'plant_market' AND scope_type = 'global' AND scope_id IS NULL)
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_revoke_market_access(uuid,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_market_access(uuid,text,uuid) TO authenticated;
