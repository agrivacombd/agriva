-- Enforce a conservative marketplace order state machine in the database.
-- PR/staging only. Review the business rules and test against staging before release.
CREATE OR REPLACE FUNCTION public.set_marketplace_order_status(
  p_order_id uuid,
  p_status text
)
RETURNS public.marketplace_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_order public.marketplace_orders;
  v_old_status text;
  v_allowed boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_order_id IS NULL OR p_status IS NULL THEN
    RAISE EXCEPTION 'Order id and status are required' USING ERRCODE = '22023';
  END IF;
  IF p_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid order status' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.role = 'admin'::public.user_role
  ) INTO v_is_admin;

  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  v_old_status := v_order.status;

  -- Idempotent retries do not repeat inventory or commission side effects.
  IF v_old_status = p_status THEN
    IF NOT v_is_admin AND v_order.farmer_id <> v_uid AND v_order.buyer_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    RETURN v_order;
  END IF;

  IF v_is_admin THEN
    v_allowed :=
      (v_old_status = 'pending' AND p_status IN ('processing', 'cancelled')) OR
      (v_old_status = 'processing' AND p_status IN ('shipped', 'cancelled')) OR
      (v_old_status = 'shipped' AND p_status IN ('delivered', 'cancelled')) OR
      (v_old_status = 'delivered' AND p_status IN ('completed', 'refunded')) OR
      (v_old_status = 'completed' AND p_status = 'refunded');
  ELSIF v_order.farmer_id = v_uid THEN
    v_allowed :=
      (v_old_status = 'pending' AND p_status = 'processing') OR
      (v_old_status = 'processing' AND p_status = 'shipped') OR
      (v_old_status = 'shipped' AND p_status = 'delivered') OR
      (v_old_status = 'delivered' AND p_status = 'completed');
  ELSIF v_order.buyer_id = v_uid THEN
    v_allowed := v_old_status IN ('pending', 'processing') AND p_status = 'cancelled';
  ELSE
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid order status transition: % -> %', v_old_status, p_status
      USING ERRCODE = '22023';
  END IF;

  -- Return inventory only for cancellation before shipment. A refund does not
  -- imply that physical goods were returned, so it must not restock inventory.
  IF p_status = 'cancelled' AND v_old_status IN ('pending', 'processing') THEN
    UPDATE public.products
    SET stock = stock + v_order.quantity, updated_at = now()
    WHERE id = v_order.product_id;
  END IF;

  IF p_status IN ('cancelled', 'refunded') THEN
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

REVOKE ALL ON FUNCTION public.set_marketplace_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_marketplace_order_status(uuid, text) TO authenticated, service_role;
