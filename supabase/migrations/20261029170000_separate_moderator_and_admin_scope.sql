-- Separate platform governance from product-moderation capability.
-- A product moderator must not inherit broad product-write powers from the trigger.
CREATE OR REPLACE FUNCTION public.enforce_seller_product_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_platform_admin boolean := auth.uid() IS NOT NULL AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
    )
  );
  v_can_moderate boolean := auth.uid() IS NOT NULL AND public.has_product_moderation_permission();
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

  -- Platform administrators may perform broader catalog operations. Moderators
  -- are deliberately excluded from this branch even if they also hold seller roles.
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
        NEW.moderation_by := auth.uid();
        NEW.moderated_at := now();
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- A moderator can only change review/publication fields on another seller's
  -- listing. This guard also protects against direct table writes if a policy
  -- is accidentally widened; the supported UI uses the audited moderation RPC.
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

-- Avoid duplicate audit entries: the trigger records scoped moderator writes;
-- the RPC records platform-admin decisions.
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
  v_is_platform_admin boolean := public.is_admin() OR EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
  );
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_product_moderation_permission() THEN
    RAISE EXCEPTION 'Product moderation permission required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve', 'reject', 'request_changes') THEN
    RAISE EXCEPTION 'Invalid moderation decision' USING ERRCODE = '22023';
  END IF;
  IF p_decision IN ('reject', 'request_changes')
     AND (clean_reason IS NULL OR char_length(clean_reason) < 3 OR char_length(clean_reason) > 1000) THEN
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
    AND (v_is_platform_admin OR farmer_id <> auth.uid())
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or self-moderation is not allowed' USING ERRCODE = '42501';
  END IF;

  IF v_is_platform_admin THEN
    INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'product.moderation.' || next_moderation_status,
      'product',
      result.id,
      jsonb_build_object('decision', p_decision, 'reason', clean_reason, 'seller_id', result.farmer_id)
    );
  END IF;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_seller_product_moderation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_moderate_marketplace_product(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_marketplace_product(uuid, text, text) TO authenticated;
