-- Keep admin moderation, order, and reseller payout mutations aligned with the controlled platform-admin
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
        'complete_commission_payout',
        'admin_update_marketplace_product',
        'admin_moderate_harvest_listing',
        'admin_moderate_job_post'
      ])
      AND p.prokind = 'f'
  LOOP
    v_definition := pg_catalog.pg_get_functiondef(v_function.oid);
    v_updated_definition := replace(v_definition, 'public.is_admin()', 'public.has_platform_admin_access()');
    v_updated_definition := replace(v_updated_definition, 'is_admin()', 'public.has_platform_admin_access()');

    -- Some legacy RPCs inline the profiles.role check instead of calling is_admin().
    v_updated_definition := replace(
      v_updated_definition,
      'SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=v_uid AND p.role=''admin''::public.user_role) INTO v_is_admin;',
      'SELECT public.has_platform_admin_access() INTO v_is_admin;'
    );
    v_updated_definition := replace(
      v_updated_definition,
      'IF v_admin IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_admin AND p.role = ''admin''::public.user_role) THEN',
      'IF v_admin IS NULL OR NOT public.has_platform_admin_access() THEN'
    );
    v_updated_definition := replace(
      v_updated_definition,
      'if v_admin is null or not exists(select 1 from public.profiles p where p.id=v_admin and p.role=''admin'') then',
      'if v_admin is null or not public.has_platform_admin_access() then'
    );

    -- Fail the migration rather than silently leaving a known RPC on a legacy admin guard.
    IF v_updated_definition ~* 'public[.]is_admin[[:space:]]*[(][[:space:]]*[)]'
       OR v_updated_definition ~* '(^|[^[:alnum:]_])is_admin[[:space:]]*[(][[:space:]]*[)]'
       OR v_updated_definition LIKE '%p.role = ''admin''::public.user_role%'
       OR v_updated_definition LIKE '%p.role=''admin''::public.user_role%'
       OR v_updated_definition LIKE '%p.role=''admin''%'
    THEN
      RAISE EXCEPTION 'Could not fully align admin guard for RPC %', v_function.oid::regprocedure;
    END IF;

    IF v_updated_definition IS DISTINCT FROM v_definition THEN
      EXECUTE v_updated_definition;
    END IF;
  END LOOP;
END;
$migration$;
