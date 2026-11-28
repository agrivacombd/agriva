-- Catalog-level regression assertions for security hardening migration.
-- Run after migrations in disposable local Supabase. This file performs no writes.
DO $test$
DECLARE
  fn record;
  v_count integer := 0;
BEGIN
  IF has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'RLS event-trigger function is executable by an API role';
  END IF;

  IF NOT has_function_privilege('anon',
       'public.get_ranked_marketplace_products(integer,text,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated',
       'public.get_ranked_marketplace_products(integer,text,text)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Marketplace public ranking RPC lost intended API grants';
  END IF;

  IF NOT has_function_privilege('anon',
       'public.get_ranked_plant_market_products(integer)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated',
       'public.get_ranked_plant_market_products(integer)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Plant Market public ranking RPC lost intended API grants';
  END IF;

  IF NOT has_function_privilege('anon',
       'public.get_green_impact_metrics()', 'EXECUTE')
     OR NOT has_function_privilege('authenticated',
       'public.get_green_impact_metrics()', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Public aggregate metrics RPC lost intended API grants';
  END IF;

  FOR fn IN
    SELECT p.oid::regprocedure AS signature,
           coalesce(array_to_string(p.proconfig, ','), '') AS config
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS setting
        WHERE setting LIKE 'search_path=public%'
           OR setting LIKE 'search_path=pg_temp%'
      )
  LOOP
    IF fn.config NOT LIKE '%search_path=pg_catalog, public, pg_temp%' THEN
      RAISE EXCEPTION 'Unsafe SECURITY DEFINER search_path remains on %: %',
        fn.signature, fn.config;
    END IF;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Expected SECURITY DEFINER functions to be checked';
  END IF;

  -- These internal tables intentionally have RLS enabled and no browser grants.
  -- Do not add permissive policies merely to silence advisor warnings.
  IF NOT (
    SELECT bool_and(c.relrowsecurity)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'buyer_demand_rfq_conversions',
        'crop_health_feed_slug_registry',
        'marketplace_order_idempotency',
        'product_rank_daily_metrics',
        'product_rank_events'
      )
  ) THEN
    RAISE EXCEPTION 'An internal telemetry/idempotency table has RLS disabled';
  END IF;

  IF has_table_privilege('anon', 'public.product_rank_daily_metrics', 'SELECT')
     OR has_table_privilege('authenticated', 'public.product_rank_daily_metrics', 'SELECT')
     OR has_table_privilege('anon', 'public.product_rank_events', 'SELECT')
     OR has_table_privilege('authenticated', 'public.product_rank_events', 'SELECT')
  THEN
    RAISE EXCEPTION 'Internal product ranking telemetry is directly readable by API roles';
  END IF;
END
$test$;

-- Positive API-role execution: the three public RPCs remain callable.
SET LOCAL ROLE anon;
DO $positive_anon$
BEGIN
  PERFORM * FROM public.get_ranked_marketplace_products(1, NULL, NULL);
  PERFORM * FROM public.get_ranked_plant_market_products(1);
  PERFORM * FROM public.get_green_impact_metrics();
END
$positive_anon$;

-- Negative API-role execution: internal telemetry remains unreadable directly.
DO $negative_anon$
BEGIN
  BEGIN
    EXECUTE 'SELECT 1 FROM public.product_rank_daily_metrics LIMIT 1';
    RAISE EXCEPTION 'anon unexpectedly read internal product ranking metrics';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    EXECUTE 'SELECT 1 FROM public.product_rank_events LIMIT 1';
    RAISE EXCEPTION 'anon unexpectedly read internal product ranking events';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$negative_anon$;
RESET ROLE;

SET LOCAL ROLE authenticated;
DO $positive_authenticated$
BEGIN
  PERFORM * FROM public.get_ranked_marketplace_products(1, NULL, NULL);
  PERFORM * FROM public.get_ranked_plant_market_products(1);
  PERFORM * FROM public.get_green_impact_metrics();
END
$positive_authenticated$;

DO $negative_authenticated$
BEGIN
  BEGIN
    EXECUTE 'SELECT 1 FROM public.product_rank_daily_metrics LIMIT 1';
    RAISE EXCEPTION 'authenticated unexpectedly read internal product ranking metrics';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    EXECUTE 'SELECT 1 FROM public.product_rank_events LIMIT 1';
    RAISE EXCEPTION 'authenticated unexpectedly read internal product ranking events';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$negative_authenticated$;
RESET ROLE;

