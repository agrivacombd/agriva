-- Explicit API grants and hardened SECURITY DEFINER search paths.
-- Safe to apply in a disposable/local or Preview database first. No data changes.
--
-- Event-trigger functions are invoked by PostgreSQL's event trigger machinery;
-- browser/API roles must not be able to invoke them as RPCs.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Keep the built-in catalog ahead of application schemas and temporary objects
-- last. Only adjust functions whose current path puts public first.
DO $migration$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS setting
        WHERE setting LIKE 'search_path=public%'
           OR setting LIKE 'search_path=pg_temp%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path TO pg_catalog, public, pg_temp',
      fn.signature
    );
  END LOOP;
END
$migration$;

-- These three RPCs intentionally expose only public catalog/aggregate data.
-- Remove implicit PUBLIC grants and grant the intended API roles explicitly.
REVOKE ALL ON FUNCTION public.get_ranked_marketplace_products(integer, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranked_marketplace_products(integer, text, text)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_ranked_plant_market_products(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranked_plant_market_products(integer)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_green_impact_metrics()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_green_impact_metrics()
  TO anon, authenticated;

-- Internal ranking telemetry and idempotency/conversion registries are not
-- browser-facing APIs. Explicitly remove inherited/default API grants as well
-- as direct grants; RLS remains enabled as defense in depth.
REVOKE ALL PRIVILEGES ON TABLE
  public.buyer_demand_rfq_conversions,
  public.crop_health_feed_slug_registry,
  public.marketplace_order_idempotency,
  public.product_rank_daily_metrics,
  public.product_rank_events
FROM PUBLIC, anon, authenticated;
