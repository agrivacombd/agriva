-- Enforce delegated financial capabilities inside the database settlement boundary.
-- Only explicitly assigned admin roles can approve commissions or payouts, or mark payouts paid.
CREATE OR REPLACE FUNCTION private.approve_reseller_commission(p_commission_id uuid)
RETURNS public.reseller_commissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  c public.reseller_commissions;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_admin_permission('commissions.approve') THEN
    RAISE EXCEPTION 'Commission approval permission required' USING ERRCODE = '42501';
  END IF;
  IF p_commission_id IS NULL THEN
    RAISE EXCEPTION 'Commission id is required' USING ERRCODE = '22023';
  END IF;
  UPDATE public.reseller_commissions
  SET status = 'approved', updated_at = now()
  WHERE id = p_commission_id AND status = 'pending'
  RETURNING * INTO c;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commission not found or already settled' USING ERRCODE = 'P0002';
  END IF;
  RETURN c;
END;
$$;

CREATE OR REPLACE FUNCTION private.approve_commission_payout(p_payout_id uuid)
RETURNS public.commission_payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  p public.commission_payouts;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_admin_permission('payouts.approve') THEN
    RAISE EXCEPTION 'Payout approval permission required' USING ERRCODE = '42501';
  END IF;
  IF p_payout_id IS NULL THEN
    RAISE EXCEPTION 'Payout id is required' USING ERRCODE = '22023';
  END IF;
  UPDATE public.commission_payouts
  SET status = 'approved', approved_at = now(), approved_by = auth.uid()
  WHERE id = p_payout_id AND status = 'requested'
  RETURNING * INTO p;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found or already processed' USING ERRCODE = 'P0002';
  END IF;
  RETURN p;
END;
$$;

CREATE OR REPLACE FUNCTION private.complete_commission_payout(p_payout_id uuid, p_payment_reference text)
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
  IF auth.uid() IS NULL OR NOT public.has_admin_permission('payouts.complete') THEN
    RAISE EXCEPTION 'Payout completion permission required' USING ERRCODE = '42501';
  END IF;
  IF p_payout_id IS NULL OR p_payment_reference IS NULL
     OR length(btrim(p_payment_reference)) = 0 OR length(btrim(p_payment_reference)) > 200 THEN
    RAISE EXCEPTION 'Payout id and payment reference are required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO p FROM public.commission_payouts WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND OR p.status <> 'approved' THEN
    RAISE EXCEPTION 'Payout must be separately approved before payment' USING ERRCODE = '55000';
  END IF;

  SELECT id INTO locked_profile FROM public.profiles WHERE id = p.reseller_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reseller profile not found' USING ERRCODE = '23503'; END IF;

  remaining := p.amount;
  FOR c IN
    SELECT id, amount, paid_amount
    FROM public.reseller_commissions
    WHERE reseller_id = p.reseller_id AND status = 'approved' AND paid_amount < amount
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
    RAISE EXCEPTION 'Insufficient approved commission balance for this payout' USING ERRCODE = '23514';
  END IF;

  UPDATE public.commission_payouts
  SET status = 'paid', paid_at = now(), payment_reference = btrim(p_payment_reference)
  WHERE id = p.id
  RETURNING * INTO p;
  RETURN p;
END;
$$;

-- Keep the existing public RPC signatures; their SQL wrappers call these private functions.
REVOKE ALL ON FUNCTION private.approve_reseller_commission(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.approve_commission_payout(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.complete_commission_payout(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.approve_reseller_commission(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.approve_commission_payout(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.complete_commission_payout(uuid, text) TO authenticated, service_role;

-- The existing production super_admin role gets explicit financial permissions.
-- These do not flow from profiles.role and remain revocable via admin_role_permissions.
INSERT INTO public.admin_role_permissions(role_id, capability)
SELECT id, capability
FROM public.admin_roles
CROSS JOIN (VALUES ('commissions.approve'), ('payouts.complete')) AS requested(capability)
WHERE role_key = 'super_admin'
ON CONFLICT (role_id, capability) DO NOTHING;
