-- Strictly separate AGRIVA Marketplace and Plant Market seller access and catalogues.
-- Existing public.profiles/auth.users remain the shared identity source.

CREATE TABLE IF NOT EXISTS public.marketplace_seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL CHECK (char_length(btrim(business_name)) BETWEEN 2 AND 160),
  business_type text NOT NULL CHECK (char_length(btrim(business_type)) BETWEEN 2 AND 80),
  contact_phone text NOT NULL CHECK (char_length(btrim(contact_phone)) BETWEEN 6 AND 30),
  business_address text NOT NULL CHECK (char_length(btrim(business_address)) BETWEEN 5 AND 500),
  trade_license text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketplace_seller_applications_user_idx
  ON public.marketplace_seller_applications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.plant_seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nursery_name text NOT NULL CHECK (char_length(btrim(nursery_name)) BETWEEN 2 AND 160),
  business_type text NOT NULL CHECK (char_length(btrim(business_type)) BETWEEN 2 AND 80),
  contact_phone text NOT NULL CHECK (char_length(btrim(contact_phone)) BETWEEN 6 AND 30),
  nursery_address text NOT NULL CHECK (char_length(btrim(nursery_address)) BETWEEN 5 AND 500),
  trade_license text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plant_seller_applications_user_idx
  ON public.plant_seller_applications(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_one_pending_application_per_user
  ON public.marketplace_seller_applications(user_id) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS plant_one_pending_application_per_user
  ON public.plant_seller_applications(user_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.marketplace_seller_permissions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'revoked' CHECK (status IN ('approved','revoked')),
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.plant_seller_permissions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'revoked' CHECK (status IN ('approved','revoked')),
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Preserve previously admin-granted legacy Marketplace sellers only. Self-selected
-- legacy memberships (granted_by IS NULL) do not become approved automatically.
INSERT INTO public.marketplace_seller_permissions(user_id,status,approved_by,approved_at)
SELECT m.user_id, 'approved', m.granted_by, m.created_at
FROM public.user_role_memberships m
WHERE m.role IN ('seller','organization') AND m.granted_by IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Existing live Marketplace listings are evidence of prior admin approval; preserve
-- their sellers when moving authorization to the explicit permission table.
INSERT INTO public.marketplace_seller_permissions(user_id,status,approved_by,approved_at)
SELECT p.farmer_id, 'approved', NULL, max(p.updated_at)
FROM public.products p
WHERE p.status = 'active'
GROUP BY p.farmer_id
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.user_role_memberships(user_id,role)
SELECT DISTINCT p.farmer_id, 'seller'
FROM public.products p
WHERE p.status = 'active'
ON CONFLICT (user_id,role) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.plant_market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  slug text NOT NULL UNIQUE,
  scientific_name text,
  category_slug text NOT NULL,
  category text NOT NULL,
  plant_size text,
  pot_size text,
  plant_age text,
  sunlight text,
  watering text,
  description text,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit text NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece','pot','pack','tray')),
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','rejected','suspended')),
  moderation_note text,
  moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plant_market_products_public_idx
  ON public.plant_market_products(status, category_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS plant_market_products_seller_idx
  ON public.plant_market_products(seller_id, created_at DESC);

ALTER TABLE public.marketplace_seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_seller_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_seller_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_market_products ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketplace_seller_applications, public.plant_seller_applications,
  public.marketplace_seller_permissions, public.plant_seller_permissions,
  public.plant_market_products FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.marketplace_seller_applications,
  public.plant_seller_applications TO authenticated;
GRANT SELECT, UPDATE ON public.marketplace_seller_permissions,
  public.plant_seller_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.plant_market_products TO authenticated;
GRANT SELECT ON public.plant_market_products TO anon;

DROP POLICY IF EXISTS marketplace_application_owner_read ON public.marketplace_seller_applications;
CREATE POLICY marketplace_application_owner_read ON public.marketplace_seller_applications
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS marketplace_application_owner_insert ON public.marketplace_seller_applications;
CREATE POLICY marketplace_application_owner_insert ON public.marketplace_seller_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending' AND reviewed_by IS NULL);
DROP POLICY IF EXISTS marketplace_application_admin_update ON public.marketplace_seller_applications;
CREATE POLICY marketplace_application_admin_update ON public.marketplace_seller_applications
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS plant_application_owner_read ON public.plant_seller_applications;
CREATE POLICY plant_application_owner_read ON public.plant_seller_applications
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS plant_application_owner_insert ON public.plant_seller_applications;
CREATE POLICY plant_application_owner_insert ON public.plant_seller_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending' AND reviewed_by IS NULL);
DROP POLICY IF EXISTS plant_application_admin_update ON public.plant_seller_applications;
CREATE POLICY plant_application_admin_update ON public.plant_seller_applications
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS marketplace_permission_owner_read ON public.marketplace_seller_permissions;
CREATE POLICY marketplace_permission_owner_read ON public.marketplace_seller_permissions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS marketplace_permission_admin_manage ON public.marketplace_seller_permissions;
CREATE POLICY marketplace_permission_admin_manage ON public.marketplace_seller_permissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS plant_permission_owner_read ON public.plant_seller_permissions;
CREATE POLICY plant_permission_owner_read ON public.plant_seller_permissions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS plant_permission_admin_manage ON public.plant_seller_permissions;
CREATE POLICY plant_permission_admin_manage ON public.plant_seller_permissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS plant_market_products_public_read ON public.plant_market_products;
CREATE POLICY plant_market_products_public_read ON public.plant_market_products
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR seller_id = (SELECT auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS plant_market_products_owner_insert ON public.plant_market_products;
CREATE POLICY plant_market_products_owner_insert ON public.plant_market_products
  FOR INSERT TO authenticated WITH CHECK (
    seller_id = (SELECT auth.uid()) AND status = 'draft'
    AND EXISTS (SELECT 1 FROM public.plant_seller_permissions p
      WHERE p.user_id = (SELECT auth.uid()) AND p.status = 'approved')
  );
DROP POLICY IF EXISTS plant_market_products_owner_update ON public.plant_market_products;
CREATE POLICY plant_market_products_owner_update ON public.plant_market_products
  FOR UPDATE TO authenticated USING (
    seller_id = (SELECT auth.uid()) OR public.is_admin()
  ) WITH CHECK (seller_id = (SELECT auth.uid()) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_marketplace_seller_permission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.marketplace_seller_permissions(user_id,status,approved_by,approved_at,updated_at)
    VALUES (NEW.user_id,'approved',NEW.reviewed_by,coalesce(NEW.reviewed_at,now()),now())
    ON CONFLICT (user_id) DO UPDATE SET status='approved',
      approved_by=EXCLUDED.approved_by, approved_at=EXCLUDED.approved_at, updated_at=now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_marketplace_seller_permission() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS marketplace_application_permission_sync ON public.marketplace_seller_applications;
CREATE TRIGGER marketplace_application_permission_sync
AFTER UPDATE OF status ON public.marketplace_seller_applications
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_marketplace_seller_permission();

CREATE OR REPLACE FUNCTION public.sync_plant_seller_permission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.plant_seller_permissions(user_id,status,approved_by,approved_at,updated_at)
    VALUES (NEW.user_id,'approved',NEW.reviewed_by,coalesce(NEW.reviewed_at,now()),now())
    ON CONFLICT (user_id) DO UPDATE SET status='approved',
      approved_by=EXCLUDED.approved_by, approved_at=EXCLUDED.approved_at, updated_at=now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_plant_seller_permission() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS plant_application_permission_sync ON public.plant_seller_applications;
CREATE TRIGGER plant_application_permission_sync
AFTER UPDATE OF status ON public.plant_seller_applications
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_plant_seller_permission();

-- Keep the existing role-based dashboard navigation in sync, without using
-- role membership as the authorization source for either marketplace.
ALTER TABLE public.user_role_memberships
  DROP CONSTRAINT IF EXISTS user_role_memberships_role_check;
ALTER TABLE public.user_role_memberships
  ADD CONSTRAINT user_role_memberships_role_check
  CHECK (role IN (
    'farmer','seller','plant_seller','reseller','buyer','job_seeker','worker',
    'employer','expert','educator','transport_provider','organization','admin',
    'transport','student','agriculturist','rooftop_gardener','super_admin'
  ));

CREATE OR REPLACE FUNCTION public.sync_marketplace_seller_role_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $marketplace_role_sync$
BEGIN
  IF NEW.status = 'approved' AND NEW.approved_by IS NOT NULL THEN
    INSERT INTO public.user_role_memberships(user_id,role,granted_by)
    VALUES (NEW.user_id,'seller',NEW.approved_by)
    ON CONFLICT (user_id,role) DO UPDATE SET granted_by=EXCLUDED.granted_by;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'revoked' AND OLD.status = 'approved' THEN
      UPDATE public.products SET status = 'paused'::public.product_status, updated_at = now()
      WHERE farmer_id = NEW.user_id AND status = 'active';
      DELETE FROM public.user_role_memberships
      WHERE user_id=NEW.user_id AND role='seller';
    END IF;
  END IF;
  RETURN NEW;
END $marketplace_role_sync$;
REVOKE ALL ON FUNCTION public.sync_marketplace_seller_role_membership() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS marketplace_permission_role_sync ON public.marketplace_seller_permissions;
CREATE TRIGGER marketplace_permission_role_sync
AFTER INSERT OR UPDATE OF status ON public.marketplace_seller_permissions
FOR EACH ROW EXECUTE FUNCTION public.sync_marketplace_seller_role_membership();

CREATE OR REPLACE FUNCTION public.sync_plant_seller_role_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $plant_role_sync$
BEGIN
  IF NEW.status = 'approved' AND NEW.approved_by IS NOT NULL THEN
    INSERT INTO public.user_role_memberships(user_id,role,granted_by)
    VALUES (NEW.user_id,'plant_seller',NEW.approved_by)
    ON CONFLICT (user_id,role) DO UPDATE SET granted_by=EXCLUDED.granted_by;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'revoked' AND OLD.status = 'approved' THEN
      UPDATE public.plant_market_products
      SET status = 'suspended', moderation_note = 'Seller permission revoked',
          moderated_by = auth.uid(), moderated_at = now(), updated_at = now()
      WHERE seller_id = NEW.user_id AND status = 'active';
      DELETE FROM public.user_role_memberships
      WHERE user_id=NEW.user_id AND role='plant_seller';
    END IF;
  END IF;
  RETURN NEW;
END $plant_role_sync$;
REVOKE ALL ON FUNCTION public.sync_plant_seller_role_membership() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS plant_permission_role_sync ON public.plant_seller_permissions;
CREATE TRIGGER plant_permission_role_sync
AFTER INSERT OR UPDATE OF status ON public.plant_seller_permissions
FOR EACH ROW EXECUTE FUNCTION public.sync_plant_seller_role_membership();

-- Do not let signup metadata or the self-service role picker grant seller roles.
-- Seller roles are mirrored only after the market-specific permission is approved.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_role public.user_role;
  v_selected_role text;
  v_roles jsonb;
  v_selected_roles text[];
BEGIN
  v_role := CASE
    WHEN (NEW.raw_user_meta_data ->> 'role') IN ('farmer', 'reseller')
      THEN (NEW.raw_user_meta_data ->> 'role')::public.user_role
    ELSE 'farmer'::public.user_role
  END;
  v_roles := CASE
    WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_roles') = 'array'
      THEN NEW.raw_user_meta_data -> 'selected_roles'
    ELSE '[]'::jsonb
  END;
  SELECT coalesce(array_agg(DISTINCT value), ARRAY['farmer']::text[])
    INTO v_selected_roles
  FROM jsonb_array_elements_text(v_roles) AS item(value)
  WHERE value IN (
    'farmer', 'buyer', 'transport', 'job_seeker',
    'employer', 'student', 'agriculturist', 'rooftop_gardener'
  );
  INSERT INTO public.profiles (id, full_name, phone, role, selected_roles)
  VALUES (
    NEW.id,
    coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), ''),
    nullif(btrim(NEW.raw_user_meta_data ->> 'phone'), ''),
    v_role,
    v_selected_roles
  )
  ON CONFLICT (id) DO NOTHING;
  FOR v_selected_role IN
    SELECT DISTINCT value
    FROM jsonb_array_elements_text(v_roles) AS item(value)
    WHERE value IN (
      'farmer', 'buyer', 'transport', 'job_seeker',
      'employer', 'student', 'agriculturist', 'rooftop_gardener'
    )
  LOOP
    INSERT INTO public.user_role_memberships (user_id, role)
    VALUES (NEW.id, v_selected_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM public.user_role_memberships WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_role_memberships (user_id, role)
    VALUES (NEW.id, 'farmer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_my_role_memberships(p_roles text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_allowed text[] := ARRAY[
    'farmer', 'buyer', 'transport', 'job_seeker',
    'employer', 'student', 'agriculturist', 'rooftop_gardener'
  ]::text[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_roles IS NULL OR cardinality(p_roles) < 1 OR cardinality(p_roles) > 9 THEN
    RAISE EXCEPTION 'Select between one and nine roles';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(p_roles) AS requested(role)
    WHERE NOT (requested.role = ANY(v_allowed))
  ) THEN
    RAISE EXCEPTION 'One or more roles are not allowed';
  END IF;

  DELETE FROM public.user_role_memberships
  WHERE user_id = v_user_id
    AND (
      role = ANY(v_allowed)
      OR (role = 'seller' AND NOT EXISTS (
        SELECT 1 FROM public.marketplace_seller_permissions p
        WHERE p.user_id = v_user_id AND p.status = 'approved'
      ))
      OR (role = 'plant_seller' AND NOT EXISTS (
        SELECT 1 FROM public.plant_seller_permissions p
        WHERE p.user_id = v_user_id AND p.status = 'approved'
      ))
    );

  UPDATE public.profiles
  SET selected_roles = ARRAY(SELECT DISTINCT requested.role FROM unnest(p_roles) AS requested(role))
  WHERE id = v_user_id;

  INSERT INTO public.user_role_memberships (user_id, role)
  SELECT v_user_id, requested.role
  FROM (SELECT DISTINCT role FROM unnest(p_roles) AS item(role)) AS requested
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_my_role_memberships(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_role_memberships(text[]) TO authenticated;

-- Seller status cannot be self-published. The existing marketplace products table
-- remains the Marketplace-only catalogue for backward compatibility with orders.
DROP POLICY IF EXISTS "products_seller_insert" ON public.products;
DROP POLICY IF EXISTS "products_farmer_delete" ON public.products;
CREATE POLICY "products_marketplace_seller_delete" ON public.products
  FOR DELETE TO authenticated USING (
    (farmer_id = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.marketplace_seller_permissions p
      WHERE p.user_id = (SELECT auth.uid()) AND p.status = 'approved'
    )) OR public.is_admin()
  );

CREATE POLICY "products_seller_insert" ON public.products
  FOR INSERT TO authenticated WITH CHECK (
    farmer_id = (SELECT auth.uid()) AND status = 'draft'
    AND EXISTS (SELECT 1 FROM public.marketplace_seller_permissions p
      WHERE p.user_id = (SELECT auth.uid()) AND p.status = 'approved')
  );

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
  v_is_marketplace_seller boolean := EXISTS (
    SELECT 1 FROM public.marketplace_seller_permissions p
    WHERE p.user_id = auth.uid() AND p.status = 'approved'
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- No actor, including an administrator, may publish a listing for a seller
  -- whose Marketplace-specific permission is inactive.
  IF NEW.status = 'active' AND NOT EXISTS (
    SELECT 1 FROM public.marketplace_seller_permissions p
    WHERE p.user_id = NEW.farmer_id AND p.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Active Marketplace listings require approved Marketplace Seller permission' USING ERRCODE = '42501';
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

  IF NOT v_is_marketplace_seller THEN
    RAISE EXCEPTION 'Approved Marketplace Seller permission required' USING ERRCODE = '42501';
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

CREATE OR REPLACE FUNCTION public.guard_plant_market_product_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_is_admin boolean := auth.uid() IS NOT NULL AND (
    public.has_platform_admin_access()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
    )
  );
  v_is_plant_seller boolean := EXISTS (
    SELECT 1 FROM public.plant_seller_permissions p
    WHERE p.user_id = auth.uid() AND p.status = 'approved'
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NEW.status = 'active' AND NOT EXISTS (
    SELECT 1 FROM public.plant_seller_permissions p
    WHERE p.user_id = NEW.seller_id AND p.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Active Plant Market listings require approved Plant Seller permission' USING ERRCODE = '42501';
  END IF;
  IF v_is_admin THEN RETURN NEW; END IF;
  IF NOT v_is_plant_seller THEN
    RAISE EXCEPTION 'Approved Plant Market Seller permission required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.seller_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Cannot create a Plant Market listing for another seller' USING ERRCODE = '42501';
    END IF;
    NEW.status := 'draft';
    RETURN NEW;
  END IF;
  IF OLD.seller_id IS DISTINCT FROM auth.uid() OR NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'Cannot modify another seller listing or transfer ownership' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note
    OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
    OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at THEN
    RAISE EXCEPTION 'Plant Market moderation fields are admin-controlled' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_plant_market_product_write() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS plant_market_products_guard_write ON public.plant_market_products;
CREATE TRIGGER plant_market_products_guard_write
BEFORE INSERT OR UPDATE ON public.plant_market_products
FOR EACH ROW EXECUTE FUNCTION public.guard_plant_market_product_write();

-- The existing Marketplace image bucket is permission-scoped; Plant Market uses
-- a physically separate bucket and user folder namespace.
DROP POLICY IF EXISTS "Sellers can upload own product images" ON storage.objects;
CREATE POLICY "Sellers can upload own product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.marketplace_seller_permissions p
      WHERE p.user_id = (SELECT auth.uid()) AND p.status = 'approved')
  );
INSERT INTO storage.buckets(id,name,public)
VALUES ('plant-product-images','plant-product-images',true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Plant sellers upload own plant images" ON storage.objects;
CREATE POLICY "Plant sellers upload own plant images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'plant-product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.plant_seller_permissions p
      WHERE p.user_id = (SELECT auth.uid()) AND p.status = 'approved')
  );
