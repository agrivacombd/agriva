-- Disposable local Supabase fixture for SECURITY DEFINER permission tests.
-- Earlier migration fixtures may have installed a database-wide event trigger
-- that auto-creates RLS tables. Remove only triggers bound to this synthetic
-- event-trigger function before replacing it, so fixture setup is repeatable.
DO $cleanup$
DECLARE
  trigger_name text;
BEGIN
  FOR trigger_name IN
    SELECT evtname
    FROM pg_event_trigger
    WHERE evtfoid = to_regprocedure('public.rls_auto_enable()')
  LOOP
    EXECUTE format('DROP EVENT TRIGGER %I', trigger_name);
  END LOOP;
END
$cleanup$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog AS $fixture$
BEGIN NULL; END;
$fixture$;

CREATE TABLE IF NOT EXISTS public.buyer_demand_rfq_conversions (id bigint primary key);
CREATE TABLE IF NOT EXISTS public.crop_health_feed_slug_registry (id bigint primary key);
CREATE TABLE IF NOT EXISTS public.marketplace_order_idempotency (id bigint primary key);
CREATE TABLE IF NOT EXISTS public.product_rank_daily_metrics (id bigint primary key);
CREATE TABLE IF NOT EXISTS public.product_rank_events (id bigint primary key);
ALTER TABLE public.buyer_demand_rfq_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_health_feed_slug_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rank_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rank_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_ranked_marketplace_products(
 p_limit integer DEFAULT 500, p_category_slug text DEFAULT NULL, p_subcategory_slug text DEFAULT NULL
) RETURNS TABLE(id integer) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO public, pg_temp AS $fixture$
 SELECT 1::integer LIMIT least(1, greatest(1, coalesce(p_limit, 1)));
$fixture$;

CREATE OR REPLACE FUNCTION public.get_ranked_plant_market_products(p_limit integer DEFAULT 500)
RETURNS TABLE(id integer) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO public, pg_temp AS $fixture$
 SELECT 2::integer LIMIT least(1, greatest(1, coalesce(p_limit, 1)));
$fixture$;

CREATE OR REPLACE FUNCTION public.get_green_impact_metrics()
RETURNS TABLE(approved_exchange_listings bigint, active_marketplace_products bigint, completed_exchange_requests bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $fixture$ SELECT 0::bigint, 0::bigint, 0::bigint; $fixture$;
