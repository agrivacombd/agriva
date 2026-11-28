-- Real delegated-permission positive/negative integration coverage for COD.
-- Runs only against the disposable local Supabase fixture.
BEGIN;

DO $test$
DECLARE
  v_admin uuid;
  v_role uuid;
  v_checkout uuid := 'a1100000-0000-4000-8000-000000000002';
  v_scope uuid := 'a1100000-0000-4000-8000-000000000004';
  v_allowed boolean;
BEGIN
  SELECT id INTO v_admin
  FROM public.profiles
  WHERE role = 'admin'
  ORDER BY id
  LIMIT 1;

  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Synthetic legacy admin is required for delegated COD permission tests';
  END IF;

  INSERT INTO public.admin_roles(role_key)
  VALUES ('ci_cod_reconcile')
  ON CONFLICT (role_key) DO NOTHING;
  SELECT id INTO v_role FROM public.admin_roles WHERE role_key = 'ci_cod_reconcile';
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Synthetic delegated COD role could not be created';
  END IF;

  DELETE FROM public.admin_user_roles WHERE user_id = v_admin AND role_id = v_role;
  DELETE FROM public.admin_role_permissions WHERE role_id = v_role;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);

  SELECT public.has_admin_permission('payments.reconcile') INTO v_allowed;
  IF v_allowed THEN
    RAISE EXCEPTION 'Legacy admin unexpectedly has COD permission without a delegated role grant';
  END IF;

  INSERT INTO public.marketplace_checkouts(id, payment_method, payment_status, total_amount)
  VALUES (v_checkout, 'cod', 'pending', 75.00)
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    PERFORM public.record_cod_collection(v_checkout, 25.00, 'must be denied before delegated grant');
    RAISE EXCEPTION 'COD RPC unexpectedly allowed a legacy admin without payments.reconcile';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  INSERT INTO public.admin_role_permissions(role_id, capability)
  VALUES (v_role, 'payments.reconcile');
  INSERT INTO public.admin_user_roles(user_id, role_id, scope_type, scope_id, granted_by)
  VALUES (v_admin, v_role, 'organization', v_scope, v_admin);

  SELECT public.has_admin_permission('payments.reconcile') INTO v_allowed;
  IF v_allowed THEN
    RAISE EXCEPTION 'Organization-scoped grant unexpectedly authorized a global COD action';
  END IF;

  UPDATE public.admin_user_roles
  SET scope_type = 'global', scope_id = NULL, expires_at = now() - interval '1 minute'
  WHERE user_id = v_admin AND role_id = v_role;
  SELECT public.has_admin_permission('payments.reconcile') INTO v_allowed;
  IF v_allowed THEN
    RAISE EXCEPTION 'Expired delegated grant unexpectedly authorized COD reconciliation';
  END IF;

  UPDATE public.admin_user_roles
  SET expires_at = NULL
  WHERE user_id = v_admin AND role_id = v_role;
  SELECT public.has_admin_permission('payments.reconcile') INTO v_allowed;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Active global payments.reconcile grant was not recognized';
  END IF;

  PERFORM public.record_cod_collection(v_checkout, 25.00, 'allowed after delegated grant');

  IF NOT EXISTS (
    SELECT 1 FROM public.cod_collection_events
    WHERE checkout_id = v_checkout AND collected_amount = 25.00 AND collected_by = v_admin
  ) THEN
    RAISE EXCEPTION 'Authorized COD collection did not create its collection event';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE admin_id = v_admin
      AND action = 'cod_collection.recorded'
      AND entity_id = v_checkout
  ) THEN
    RAISE EXCEPTION 'Authorized COD collection did not create its transactional audit event';
  END IF;
END;
$test$;

DO $search_path_test$
DECLARE
  v_function text;
  v_config text[];
BEGIN
  FOREACH v_function IN ARRAY ARRAY[
    'public.bulk_select_item_offer(uuid)',
    'public.bulk_select_quote(uuid)',
    'public.bulk_submit_multi_quote(uuid,jsonb,integer,text)'
  ] LOOP
    SELECT p.proconfig INTO v_config
    FROM pg_proc p
    WHERE p.oid = v_function::regprocedure;
    IF NOT ('search_path=pg_catalog, public, pg_temp' = ANY(coalesce(v_config, ARRAY[]::text[]))) THEN
      RAISE EXCEPTION 'SECURITY DEFINER search_path was not hardened for %: %', v_function, v_config;
    END IF;
  END LOOP;
END;
$search_path_test$;


DO $api_grants_test$
DECLARE
  v_function text;
BEGIN
  FOREACH v_function IN ARRAY ARRAY[
    'public.bulk_select_item_offer(uuid)',
    'public.bulk_select_quote(uuid)',
    'public.bulk_submit_multi_quote(uuid,jsonb,integer,text)'
  ] LOOP
    IF has_function_privilege('anon', v_function, 'EXECUTE') THEN
      RAISE EXCEPTION 'Anonymous role must not execute %', v_function;
    END IF;
    IF NOT has_function_privilege('authenticated', v_function, 'EXECUTE') THEN
      RAISE EXCEPTION 'Authenticated role must retain EXECUTE on %', v_function;
    END IF;
  END LOOP;
END;
$api_grants_test$;

ROLLBACK;
