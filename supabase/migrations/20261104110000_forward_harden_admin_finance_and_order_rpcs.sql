-- Forward-only Production hardening based on live RPC definition/ACL inspection.
-- No Production migration is applied by this change. Finance mutations remain disabled
-- until a dedicated server-side actor-verified service-role workflow is implemented.

-- Remove direct client execution of high-risk finance mutations. These legacy
-- SECURITY DEFINER functions only check the legacy admin role, not fine-grained
-- payments.reconcile / payouts.approve capabilities.
REVOKE ALL ON FUNCTION public.approve_reseller_commission(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.approve_reseller_commission(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.approve_commission_payout(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.approve_commission_payout(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.complete_commission_payout(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.complete_commission_payout(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.record_cod_collection(uuid, numeric, text) FROM PUBLIC, anon, authenticated, service_role;

-- Replace the weak legacy order transition implementation with a database
-- state machine. Refunds are deliberately excluded until a separate refund
-- workflow with explicit approval and payment-provider reconciliation exists.
CREATE OR REPLACE FUNCTION private.set_marketplace_order_status(
  p_order_id uuid,
  p_status text
)
RETURNS public.marketplace_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
  v_order public.marketplace_orders;
  v_old_status text;
  v_allowed boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_order_id IS NULL OR p_status IS NULL
     OR p_status NOT IN ('processing', 'shipped', 'delivered', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order id or status' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_uid AND p.role = 'admin'::public.user_role
  ) INTO v_is_admin;

  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  v_old_status := v_order.status;

  IF NOT v_is_admin THEN
    IF v_order.farmer_id IS DISTINCT FROM v_uid OR NOT EXISTS (
      SELECT 1 FROM public.organizations org
      WHERE org.owner_id = v_uid
        AND org.status = 'verified'
        AND public.has_module_access('marketplace', 'manage_orders', 'organization', org.id)
    ) THEN
      RAISE EXCEPTION 'Marketplace order-management permission required' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_old_status = p_status THEN
    RETURN v_order;
  END IF;

  IF v_is_admin THEN
    v_allowed :=
      (v_old_status = 'pending' AND p_status IN ('processing', 'cancelled')) OR
      (v_old_status = 'processing' AND p_status IN ('shipped', 'cancelled')) OR
      (v_old_status = 'shipped' AND p_status IN ('delivered', 'cancelled')) OR
      (v_old_status = 'delivered' AND p_status = 'completed');
  ELSE
    v_allowed :=
      (v_old_status = 'processing' AND p_status IN ('shipped', 'cancelled')) OR
      (v_old_status = 'shipped' AND p_status IN ('delivered', 'cancelled')) OR
      (v_old_status = 'delivered' AND p_status = 'completed');
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid order status transition: % -> %', v_old_status, p_status
      USING ERRCODE = '22023';
  END IF;

  -- Only pre-dispatch cancellation releases stock. Cancellation after shipment
  -- never creates inventory that has not physically returned.
  IF p_status = 'cancelled' AND v_old_status IN ('pending', 'processing') THEN
    UPDATE public.products
    SET stock = stock + v_order.quantity, updated_at = now()
    WHERE id = v_order.product_id;
  END IF;

  IF p_status = 'cancelled' THEN
    UPDATE public.reseller_commissions
    SET status = 'reversed', updated_at = now()
    WHERE order_id = v_order.id AND status IN ('pending', 'approved');
  ELSIF p_status IN ('delivered', 'completed') THEN
    UPDATE public.reseller_commissions
    SET status = 'approved', updated_at = now()
    WHERE order_id = v_order.id AND status = 'pending';
  END IF;

  UPDATE public.marketplace_orders
  SET status = p_status,
      updated_at = now(),
      shipped_at = CASE WHEN p_status = 'shipped' THEN coalesce(shipped_at, now()) ELSE shipped_at END,
      delivered_at = CASE WHEN p_status IN ('delivered', 'completed') THEN coalesce(delivered_at, now()) ELSE delivered_at END
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- Only the public wrapper remains callable by authenticated users; the private
-- implementation is owner-only so clients cannot bypass the wrapper's status allowlist.
REVOKE ALL ON FUNCTION private.set_marketplace_order_status(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.set_marketplace_order_status(
  p_order_id uuid,
  p_status text
)
RETURNS public.marketplace_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('processing', 'shipped', 'delivered', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Refunds and unsupported status changes require a separate workflow' USING ERRCODE = '22023';
  END IF;
  RETURN private.set_marketplace_order_status(p_order_id, p_status);
END;
$$;
REVOKE ALL ON FUNCTION public.set_marketplace_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_marketplace_order_status(uuid, text) TO authenticated, service_role;
