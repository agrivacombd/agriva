-- Product moderation workflow: explicit review state, decision reason, and audited transitions.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_moderation_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'changes_requested'));

-- Preserve currently published listings as approved; new drafts stay pending.
UPDATE public.products
SET moderation_status = CASE WHEN status = 'active' THEN 'approved' ELSE moderation_status END,
    moderated_at = CASE WHEN status = 'active' THEN COALESCE(moderated_at, updated_at, now()) ELSE moderated_at END
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS products_moderation_queue_idx
  ON public.products (moderation_status, updated_at DESC);

-- Staff role assignments are never self-service; this only expands the database
-- vocabulary so trusted provisioning can assign scoped staff memberships.
ALTER TABLE public.user_role_memberships
  DROP CONSTRAINT IF EXISTS user_role_memberships_role_check;
ALTER TABLE public.user_role_memberships
  ADD CONSTRAINT user_role_memberships_role_check
  CHECK (role IN (
    'farmer', 'seller', 'reseller', 'buyer', 'job_seeker', 'worker',
    'employer', 'expert', 'educator', 'transport_provider', 'organization',
    'admin', 'transport', 'student', 'agriculturist', 'rooftop_gardener',
    'super_admin', 'operations', 'product_moderator', 'content_seo_manager',
    'marketing_manager', 'finance_manager', 'support_agent'
  ));

CREATE OR REPLACE FUNCTION public.has_product_moderation_permission()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'super_admin', 'product_moderator')
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.has_product_moderation_permission() FROM PUBLIC, anon, authenticated;

-- Defense in depth: public reads require both publication state and approval.
DROP POLICY IF EXISTS products_public_active ON public.products;
CREATE POLICY products_public_active
ON public.products FOR SELECT
TO anon, authenticated
USING (
  (status = 'active'::public.product_status AND moderation_status = 'approved')
  OR (SELECT auth.uid()) = farmer_id
);

-- Extend the existing seller guard to protect the new moderation fields and
-- keep the public active state synchronized with a privileged admin decision.
CREATE OR REPLACE FUNCTION public.enforce_seller_product_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_admin boolean := auth.uid() IS NOT NULL AND public.has_product_moderation_permission();
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

CREATE OR REPLACE FUNCTION public.admin_moderate_marketplace_product(
  p_product_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  result public.products;
  next_status public.product_status;
  next_moderation_status text;
  clean_reason text := NULLIF(btrim(COALESCE(p_reason, '')), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_product_moderation_permission() THEN
    RAISE EXCEPTION 'Product moderation permission required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve', 'reject', 'request_changes') THEN
    RAISE EXCEPTION 'Invalid moderation decision' USING ERRCODE = '22023';
  END IF;
  IF p_decision IN ('reject', 'request_changes') AND (clean_reason IS NULL OR char_length(clean_reason) < 3 OR char_length(clean_reason) > 1000) THEN
    RAISE EXCEPTION 'A reason between 3 and 1000 characters is required' USING ERRCODE = '22023';
  END IF;

  next_status := CASE WHEN p_decision = 'approve' THEN 'active'::public.product_status ELSE 'draft'::public.product_status END;
  next_moderation_status := CASE p_decision
    WHEN 'approve' THEN 'approved'
    WHEN 'reject' THEN 'rejected'
    ELSE 'changes_requested'
  END;

  UPDATE public.products
  SET status = next_status,
      moderation_status = next_moderation_status,
      moderation_reason = CASE WHEN p_decision = 'approve' THEN NULL ELSE clean_reason END,
      moderated_by = auth.uid(),
      moderated_at = now(),
      updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'product.moderation.' || next_moderation_status,
    'product',
    result.id,
    jsonb_build_object('decision', p_decision, 'reason', clean_reason, 'seller_id', result.farmer_id)
  );

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_moderate_marketplace_product(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_marketplace_product(uuid, text, text) TO authenticated;
