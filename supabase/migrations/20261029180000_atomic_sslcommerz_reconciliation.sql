-- Atomic, idempotent SSLCommerz payment reconciliation.
-- Provider validation happens in the server route; this RPC is callable only by service_role.
CREATE OR REPLACE FUNCTION public.reconcile_sslcommerz_payment(
  p_order_id uuid,
  p_tran_id text,
  p_val_id text,
  p_amount numeric,
  p_currency text,
  p_gateway_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_order public.marketplace_orders;
  v_result jsonb;
  v_idempotency_key text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Trusted payment reconciliation caller required'
      USING ERRCODE = '42501';
  END IF;

  IF p_order_id IS NULL
     OR p_tran_id IS NULL
     OR p_val_id IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0
     OR upper(COALESCE(p_currency, '')) <> 'BDT'
     OR upper(COALESCE(p_gateway_status, '')) NOT IN ('VALID', 'VALIDATED')
     OR p_tran_id !~* '^AGRIVA-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     OR length(p_val_id) > 200 THEN
    RAISE EXCEPTION 'Invalid validated payment payload'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  IF substring(p_tran_id FROM 8) <> v_order.id::text THEN
    RAISE EXCEPTION 'Transaction does not match order'
      USING ERRCODE = '22023';
  END IF;

  IF round(p_amount, 2) <> round(v_order.total_amount, 2) THEN
    RAISE EXCEPTION 'Payment amount mismatch'
      USING ERRCODE = '22023';
  END IF;

  IF v_order.payment_status = 'paid' AND v_order.payment_reference = p_tran_id THEN
    RETURN jsonb_build_object('ok', true, 'status', 'paid', 'duplicate', true, 'order_id', v_order.id);
  END IF;

  IF v_order.payment_method <> 'online'
     OR v_order.payment_status <> 'pending'
     OR v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not payable'
      USING ERRCODE = '55000';
  END IF;

  UPDATE public.marketplace_orders
  SET payment_status = 'paid',
      paid_at = COALESCE(paid_at, now()),
      payment_reference = p_tran_id,
      updated_at = now()
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  v_idempotency_key := 'sslcommerz:paid:' || p_tran_id;

  INSERT INTO public.payment_transactions(
    order_id, provider, provider_transaction_id, amount, currency,
    status, idempotency_key, metadata, updated_at
  )
  VALUES (
    v_order.id, 'sslcommerz', p_val_id, p_amount, 'BDT',
    'paid', v_idempotency_key,
    jsonb_build_object('tran_id', p_tran_id, 'val_id', p_val_id, 'gateway_status', upper(p_gateway_status)),
    now()
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  INSERT INTO public.order_events(order_id, event_type, event_key, metadata)
  VALUES (
    v_order.id, 'payment_paid', v_idempotency_key,
    jsonb_build_object('provider', 'sslcommerz', 'tran_id', p_tran_id, 'val_id', p_val_id, 'amount', p_amount, 'currency', 'BDT')
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'status', 'paid', 'duplicate', false, 'order_id', v_order.id);
END;
$function$;

REVOKE ALL ON FUNCTION public.reconcile_sslcommerz_payment(uuid, text, text, numeric, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_sslcommerz_payment(uuid, text, text, numeric, text, text)
  TO service_role;
