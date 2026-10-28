-- Keep order and reseller payout mutations aligned with the controlled platform-admin
-- membership model. Preserve each RPC's existing validation and audit behavior.
-- Only legacy public.is_admin() guards are rewritten; finance/staff capabilities are
-- not implicitly elevated by this migration.
DO $migration$
DECLARE
  v_function record;
  v_definition text;
  v_updated_definition text;
BEGIN
  FOR v_function IN
    SELECT p.oid
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'set_marketplace_order_status',
        'approve_reseller_commission',
        'approve_commission_payout',
        'complete_commission_payout'
      ])
      AND p.prokind = 'f'
  LOOP
    v_definition := pg_catalog.pg_get_functiondef(v_function.oid);
    v_updated_definition := replace(v_definition, 'public.is_admin()', 'public.has_platform_admin_access()');
    v_updated_definition := replace(v_updated_definition, 'is_admin()', 'public.has_platform_admin_access()');

    IF v_updated_definition IS DISTINCT FROM v_definition THEN
      EXECUTE v_updated_definition;
    END IF;
  END LOOP;
END;
$migration$;
