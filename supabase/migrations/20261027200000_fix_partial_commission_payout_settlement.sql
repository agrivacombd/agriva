-- Support partial commission allocations while preserving an auditable commission ledger.
-- PR/staging only. Do not apply to Production before staging validation.
ALTER TABLE public.reseller_commissions
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reseller_commissions'::regclass
      AND conname = 'reseller_commissions_paid_amount_bounds'
  ) THEN
    ALTER TABLE public.reseller_commissions
      ADD CONSTRAINT reseller_commissions_paid_amount_bounds
      CHECK (paid_amount >= 0 AND paid_amount <= amount);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_commission_payout(p_amount numeric, p_method text)
RETURNS public.commission_payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  p public.commission_payouts;
  uid uuid := auth.uid();
  locked_profile uuid;
  available numeric;
  reserved numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'Invalid payout amount' USING ERRCODE = '22023';
  END IF;
  IF p_method IS NULL OR length(btrim(p_method)) = 0 OR length(p_method) > 100 THEN
    RAISE EXCEPTION 'Invalid payout method' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO locked_profile FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT coalesce(sum(rc.amount - rc.paid_amount), 0)
    INTO available
  FROM public.reseller_commissions rc
  WHERE rc.reseller_id = uid AND rc.status = 'approved';

  SELECT coalesce(sum(cp.amount), 0)
    INTO reserved
  FROM public.commission_payouts cp
  WHERE cp.reseller_id = uid AND cp.status IN ('requested', 'approved');

  IF p_amount > available - reserved THEN
    RAISE EXCEPTION 'Requested amount exceeds unreserved approved commission balance';
  END IF;

  INSERT INTO public.commission_payouts(reseller_id, amount, payment_method)
  VALUES (uid, p_amount, btrim(p_method))
  RETURNING * INTO p;
  RETURN p;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_commission_payout(p_payout_id uuid, p_payment_reference text)
RETURNS public.commission_payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  p public.commission_payouts;
  locked_profile uuid;
  remaining numeric;
  allocation numeric;
  c record;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_payout_id IS NULL OR p_payment_reference IS NULL
     OR length(btrim(p_payment_reference)) = 0 OR length(p_payment_reference) > 200 THEN
    RAISE EXCEPTION 'Payout id and payment reference are required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO p FROM public.commission_payouts WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND OR p.status <> 'approved' THEN
    RAISE EXCEPTION 'Payout must be separately approved before payment';
  END IF;

  -- Serialize all settlements for this reseller and prevent concurrent double allocation.
  SELECT id INTO locked_profile FROM public.profiles WHERE id = p.reseller_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reseller profile not found'; END IF;

  remaining := p.amount;
  FOR c IN
    SELECT id, amount, paid_amount
    FROM public.reseller_commissions
    WHERE reseller_id = p.reseller_id
      AND status = 'approved'
      AND paid_amount < amount
    ORDER BY created_at ASC, id ASC
    FOR UPDATE
  LOOP
    EXIT WHEN remaining <= 0;
    allocation := least(c.amount - c.paid_amount, remaining);
    UPDATE public.reseller_commissions
    SET paid_amount = paid_amount + allocation,
        status = CASE WHEN paid_amount + allocation >= amount THEN 'paid' ELSE 'approved' END,
        updated_at = now()
    WHERE id = c.id;
    remaining := remaining - allocation;
  END LOOP;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient approved commission balance for this payout';
  END IF;

  UPDATE public.commission_payouts
  SET status = 'paid', paid_at = now(), payment_reference = btrim(p_payment_reference)
  WHERE id = p.id
  RETURNING * INTO p;
  RETURN p;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.request_commission_payout(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_commission_payout(numeric, text) TO authenticated, service_role;
REVOKE ALL PRIVILEGES ON FUNCTION public.complete_commission_payout(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_commission_payout(uuid, text) TO authenticated, service_role;
