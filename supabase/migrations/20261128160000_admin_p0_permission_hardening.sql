-- AGRIVA Admin P0 hardening.
-- Repository migration only: do not apply to the production project during this phase.
-- Adds delegated permission checks for COD reconciliation and seller access revocation,
-- and writes immutable central audit events in the same database transaction.

CREATE OR REPLACE FUNCTION public.record_cod_collection(
  p_checkout_id uuid,
  p_collected_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  checkout_row public.marketplace_checkouts;
  prior_collected numeric(12,2);
  next_collected numeric(12,2);
  next_status text;
  next_payment_status text;
BEGIN
  IF v_actor IS NULL OR NOT public.has_admin_permission('payments.reconcile') THEN
    RAISE EXCEPTION 'COD reconciliation permission required' USING ERRCODE = '42501';
  END IF;

  IF p_checkout_id IS NULL THEN
    RAISE EXCEPTION 'Checkout id is required' USING ERRCODE = '22023';
  END IF;
  IF p_collected_amount IS NULL
     OR p_collected_amount::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_collected_amount < 0
     OR p_collected_amount > 9999999999.99
     OR p_collected_amount <> round(p_collected_amount, 2) THEN
    RAISE EXCEPTION 'Collected amount must be a valid non-negative amount with at most two decimal places' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO checkout_row
  FROM public.marketplace_checkouts
  WHERE id = p_checkout_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Checkout not found' USING ERRCODE = 'P0002'; END IF;
  IF checkout_row.payment_method <> 'cod' THEN RAISE EXCEPTION 'Checkout is not COD' USING ERRCODE = '22023'; END IF;
  IF checkout_row.payment_status = 'paid' THEN RAISE EXCEPTION 'COD checkout is already fully collected' USING ERRCODE = '55000'; END IF;

  SELECT coalesce(sum(collected_amount), 0)
  INTO prior_collected
  FROM public.cod_collection_events
  WHERE checkout_id = p_checkout_id;

  next_collected := prior_collected + p_collected_amount;
  next_status := CASE
    WHEN next_collected = checkout_row.total_amount THEN 'collected'
    WHEN next_collected < checkout_row.total_amount AND next_collected > 0 THEN 'partial'
    WHEN next_collected > checkout_row.total_amount THEN 'over_collected'
    ELSE 'pending'
  END;
  next_payment_status := CASE WHEN next_collected >= checkout_row.total_amount THEN 'paid' ELSE 'pending' END;

  INSERT INTO public.cod_collection_events (
    checkout_id, expected_amount, collected_amount, cumulative_collected,
    discrepancy_amount, note, collected_by
  ) VALUES (
    checkout_row.id, checkout_row.total_amount, p_collected_amount, next_collected,
    next_collected - checkout_row.total_amount,
    nullif(left(trim(coalesce(p_note, '')), 500), ''),
    v_actor
  );

  UPDATE public.marketplace_checkouts
  SET collection_status = next_status,
      payment_status = next_payment_status,
      updated_at = now()
  WHERE id = checkout_row.id;

  IF next_payment_status = 'paid' THEN
    UPDATE public.marketplace_orders
    SET payment_status = 'paid',
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
    WHERE checkout_id = checkout_row.id;
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'cod_collection.recorded',
    'marketplace_checkout',
    checkout_row.id,
    jsonb_build_object(
      'expected_amount', checkout_row.total_amount,
      'collected_this_time', p_collected_amount,
      'cumulative_collected', next_collected,
      'discrepancy_amount', next_collected - checkout_row.total_amount,
      'collection_status', next_status,
      'payment_status', next_payment_status
    )
  );

  RETURN jsonb_build_object(
    'checkoutId', checkout_row.id,
    'expectedAmount', checkout_row.total_amount,
    'collectedThisTime', p_collected_amount,
    'cumulativeCollected', next_collected,
    'discrepancy', next_collected - checkout_row.total_amount,
    'collectionStatus', next_status,
    'paymentStatus', next_payment_status
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.record_cod_collection(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_cod_collection(uuid, numeric, text) TO authenticated, service_role;

-- Replace the old three-argument implementation so delegated seller-access
-- admins can be authorized by the database as well as the legacy admin role.
DROP FUNCTION IF EXISTS public.admin_revoke_market_access(uuid, text, uuid);

CREATE FUNCTION public.admin_revoke_market_access(
  p_user_id uuid,
  p_module text,
  p_scope_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_count integer;
  v_application_count integer;
  v_reason text := coalesce(nullif(btrim(p_reason), ''), 'Seller access revoked by administrator');
BEGIN
  IF v_actor IS NULL OR (
    NOT public.is_admin()
    AND NOT public.has_admin_permission('seller_access.revoke')
  ) THEN
    RAISE EXCEPTION 'Seller access revoke permission required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL
     OR p_module IS NULL
     OR p_module NOT IN ('marketplace', 'plant_market')
     OR (p_module = 'marketplace' AND p_scope_id IS NULL)
     OR (p_module = 'plant_market' AND p_scope_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Invalid user, module or scope' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NOT NULL AND (char_length(btrim(p_reason)) < 10 OR char_length(btrim(p_reason)) > 500) THEN
    RAISE EXCEPTION 'Revocation reason must be between 10 and 500 characters' USING ERRCODE = '22023';
  END IF;

  UPDATE public.user_module_grants
  SET status = 'revoked',
      revoked_by = v_actor,
      revoked_at = now(),
      reason = v_reason
  WHERE user_id = p_user_id
    AND module = p_module
    AND status = 'active'
    AND (
      (p_module = 'marketplace' AND scope_type = 'organization' AND scope_id = p_scope_id)
      OR (p_module = 'plant_market' AND scope_type = 'global' AND scope_id IS NULL)
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count < 1 THEN
    RAISE EXCEPTION 'No active seller grant exists in the requested scope' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.module_access_applications
  SET status = 'withdrawn',
      review_note = v_reason,
      reviewed_by = v_actor,
      reviewed_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id
    AND module = p_module
    AND status = 'approved'
    AND (
      (p_module = 'marketplace' AND organization_id = p_scope_id)
      OR (p_module = 'plant_market' AND organization_id IS NULL)
    );
  GET DIAGNOSTICS v_application_count = ROW_COUNT;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'seller_access.revoked',
    'user_module_grant',
    p_user_id,
    jsonb_build_object(
      'module', p_module,
      'scope_id', p_scope_id,
      'revoked_grants', v_count,
      'withdrawn_applications', v_application_count,
      'reason', v_reason
    )
  );

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_revoke_market_access(uuid, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_market_access(uuid, text, uuid, text) TO authenticated, service_role;

-- The super_admin role is the only role seeded with these new delegated grants.
INSERT INTO public.admin_role_permissions (role_id, capability)
SELECT id, capability
FROM public.admin_roles
CROSS JOIN (VALUES ('seller_access.read'), ('seller_access.revoke')) AS requested(capability)
WHERE role_key = 'super_admin'
ON CONFLICT (role_id, capability) DO NOTHING;
