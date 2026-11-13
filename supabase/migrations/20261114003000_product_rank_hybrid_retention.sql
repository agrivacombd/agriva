-- AGRIVA hybrid ranking retention. Raw viewer-level events stay for 35 UTC
-- calendar dates; aggregated product/day counts stay for 365 dates.
-- Deploy the accompanying cron migration only after verifying this migration.
begin;

alter table public.product_rank_events
  drop constraint if exists product_rank_events_event_type_check;
alter table public.product_rank_events
  add constraint product_rank_events_event_type_check
  check (event_type in ('impression', 'click', 'listing_click'));

create table if not exists public.product_rank_daily_metrics (
  market text not null check (market in ('marketplace', 'plant-market')),
  product_id uuid not null,
  metric_date date not null,
  impressions bigint not null default 0 check (impressions >= 0),
  listing_clicks bigint not null default 0 check (listing_clicks >= 0),
  detail_views bigint not null default 0 check (detail_views >= 0),
  updated_at timestamptz not null default now(),
  primary key (market, product_id, metric_date)
);
create index if not exists product_rank_daily_metrics_window_idx
  on public.product_rank_daily_metrics (market, metric_date desc, product_id);
alter table public.product_rank_daily_metrics enable row level security;
revoke all on public.product_rank_daily_metrics from public, anon, authenticated;
grant select on public.product_rank_daily_metrics to service_role;

-- Preserve the established RPC signature; add listing_click to the allowlist.
create or replace function public.record_product_rank_events(
  p_market text, p_events jsonb, p_viewer_hash text
) returns integer
language plpgsql security invoker
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $fn$
declare v_inserted integer := 0;
begin
  if current_user <> 'service_role' then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_market not in ('marketplace', 'plant-market')
    or p_events is null or jsonb_typeof(p_events) <> 'array'
    or jsonb_array_length(p_events) not between 1 and 32
    or p_viewer_hash is null or p_viewer_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid event batch' using errcode = '22023';
  end if;
  insert into public.product_rank_events (market, product_id, event_type, viewer_hash)
  select p_market, v.product_id, v.event_type, p_viewer_hash
  from (
    select distinct product_id, event_type
    from jsonb_to_recordset(p_events) as incoming(product_id uuid, event_type text)
    where event_type in ('impression', 'click', 'listing_click')
  ) v
  where (p_market = 'marketplace' and exists (
      select 1 from public.products p
      where p.id = v.product_id and p.status = 'active'
        and p.marketplace_channel = 'marketplace' and p.deleted_at is null
    )) or (p_market = 'plant-market' and exists (
      select 1 from public.plant_market_products p
      where p.id = v.product_id and p.status = 'active'
    ))
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$fn$;
revoke all on function public.record_product_rank_events(text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.record_product_rank_events(text, jsonb, text)
  to service_role;

-- Idempotent: first rewrite all still-available completed UTC dates, then
-- prune. If aggregation fails, the whole transaction rolls back: no raw loss.
create or replace function public.maintain_product_rank_history()
returns jsonb
language plpgsql security invoker
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $fn$
declare
  v_aggregated bigint := 0;
  v_raw_removed bigint := 0;
  v_aggregates_removed bigint := 0;
begin
  if current_user not in ('postgres', 'service_role') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  with refreshed as (
    insert into public.product_rank_daily_metrics (
      market, product_id, metric_date, impressions, listing_clicks, detail_views
    )
    select market, product_id, occurred_on,
      count(*) filter (where event_type = 'impression')::bigint,
      count(*) filter (where event_type = 'listing_click')::bigint,
      count(*) filter (where event_type = 'click')::bigint
    from public.product_rank_events
    where occurred_on < current_date
    group by market, product_id, occurred_on
    on conflict (market, product_id, metric_date) do update
    set impressions = excluded.impressions,
        listing_clicks = excluded.listing_clicks,
        detail_views = excluded.detail_views,
        updated_at = now()
    returning 1
  )
  select count(*) into v_aggregated from refreshed;

  -- Includes today and the preceding 34 UTC dates = exactly 35 dates.
  delete from public.product_rank_events
  where occurred_on < current_date - 34;
  get diagnostics v_raw_removed = row_count;

  -- Includes today and the preceding 364 UTC dates = 365 dates.
  delete from public.product_rank_daily_metrics
  where metric_date < current_date - 364;
  get diagnostics v_aggregates_removed = row_count;

  return jsonb_build_object(
    'aggregated_product_days', v_aggregated,
    'raw_events_removed', v_raw_removed,
    'daily_metrics_removed', v_aggregates_removed,
    'completed_at_utc', now()
  );
end;
$fn$;
revoke all on function public.maintain_product_rank_history()
  from public, anon, authenticated;
grant execute on function public.maintain_product_rank_history()
  to service_role;

-- Read 29 complete days from daily aggregates and today's live events.
-- Old direct detail visits ('click') no longer inflate listing CTR.
create or replace function public.get_ranked_marketplace_products(
  p_limit integer default 500,
  p_category_slug text default null,
  p_subcategory_slug text default null
) returns table (
  id uuid, name text, slug text, category text, category_slug text,
  subcategory_slug text, description text, price numeric,
  stock numeric, unit text, image_url text, created_at timestamptz
)
language sql stable security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $fn$
  with events_by_product as (
    select product_id, impressions, listing_clicks, detail_views
    from public.product_rank_daily_metrics
    where market = 'marketplace'
      and metric_date >= current_date - 29
      and metric_date < current_date
    union all
    select product_id,
      count(*) filter (where event_type = 'impression')::bigint,
      count(*) filter (where event_type = 'listing_click')::bigint,
      count(*) filter (where event_type = 'click')::bigint
    from public.product_rank_events
    where market = 'marketplace' and occurred_on = current_date
    group by product_id
  ), engagement as (
    select product_id,
      sum(impressions) as impressions, sum(listing_clicks) as listing_clicks,
      sum(detail_views) as detail_views
    from events_by_product group by product_id
  ), sales as (
    select product_id, sum(quantity) as units
    from public.marketplace_orders
    where coalesce(delivered_at, updated_at, created_at) >= now() - interval '30 days'
      and status in ('delivered', 'completed')
      and payment_status not in ('failed', 'refunded')
    group by product_id
  )
  select p.id, p.name::text, p.slug::text, p.category::text,
         p.category_slug::text, p.subcategory_slug::text,
         p.description::text, p.price::numeric, p.stock::numeric,
         p.unit::text, p.image_url::text, p.created_at
  from public.products p
  left join engagement e on e.product_id = p.id
  left join sales s on s.product_id = p.id
  where p.status = 'active' and p.marketplace_channel = 'marketplace'
    and p.deleted_at is null
    and (p_category_slug is null or p.category_slug = p_category_slug
         or p.category_slug is null)
    and (p_subcategory_slug is null or p.subcategory_slug = p_subcategory_slug
         or p.subcategory_slug is null)
  order by (case when coalesce(p.stock, 0) > 0 then 1 else 0 end) desc,
    (42 * ln((1 + greatest(0, coalesce(s.units, 0)))::numeric)
      + 12 * least(1::numeric,
          coalesce(e.listing_clicks, 0)::numeric /
          greatest(coalesce(e.impressions, 0), 20))
      + 2 * ln((1 + coalesce(e.listing_clicks, 0))::numeric)
      + 1 * ln((1 + coalesce(e.detail_views, 0))::numeric)
      + greatest(0::numeric, least(8::numeric,
          8 - extract(epoch from (now() - p.created_at))::numeric / 151200))
    ) desc, p.created_at desc, p.id
  limit least(1000, greatest(1, coalesce(p_limit, 500)));
$fn$;
revoke all on function public.get_ranked_marketplace_products(integer, text, text)
  from public, anon, authenticated;
grant execute on function public.get_ranked_marketplace_products(integer, text, text)
  to anon, authenticated;

create or replace function public.get_ranked_plant_market_products(
  p_limit integer default 500
) returns table (
  id uuid, name text, slug text, category text, category_slug text,
  subcategory_slug text, description text, price numeric,
  stock numeric, unit text, image_url text, created_at timestamptz
)
language sql stable security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $fn$
  with events_by_product as (
    select product_id, impressions, listing_clicks, detail_views
    from public.product_rank_daily_metrics
    where market = 'plant-market'
      and metric_date >= current_date - 29
      and metric_date < current_date
    union all
    select product_id,
      count(*) filter (where event_type = 'impression')::bigint,
      count(*) filter (where event_type = 'listing_click')::bigint,
      count(*) filter (where event_type = 'click')::bigint
    from public.product_rank_events
    where market = 'plant-market' and occurred_on = current_date
    group by product_id
  ), engagement as (
    select product_id,
      sum(impressions) as impressions, sum(listing_clicks) as listing_clicks,
      sum(detail_views) as detail_views
    from events_by_product group by product_id
  ), sales as (
    select oi.product_id, sum(oi.quantity) as units
    from public.plant_market_orders o
    join public.plant_market_order_items oi on oi.order_id = o.id
    where coalesce(o.updated_at, o.created_at) >= now() - interval '30 days'
      and o.status in ('delivered', 'completed')
      and o.payment_status not in ('failed', 'refunded')
    group by oi.product_id
  )
  select p.id, p.name::text, p.slug::text, p.category::text,
         p.category_slug::text, null::text, p.description::text,
         p.price::numeric, p.stock::numeric, p.unit::text,
         p.image_url::text, p.created_at
  from public.plant_market_products p
  left join engagement e on e.product_id = p.id
  left join sales s on s.product_id = p.id
  where p.status = 'active'
  order by (case when coalesce(p.stock, 0) > 0 then 1 else 0 end) desc,
    (42 * ln((1 + greatest(0, coalesce(s.units, 0)))::numeric)
      + 12 * least(1::numeric,
          coalesce(e.listing_clicks, 0)::numeric /
          greatest(coalesce(e.impressions, 0), 20))
      + 2 * ln((1 + coalesce(e.listing_clicks, 0))::numeric)
      + 1 * ln((1 + coalesce(e.detail_views, 0))::numeric)
      + greatest(0::numeric, least(8::numeric,
          8 - extract(epoch from (now() - p.created_at))::numeric / 151200))
    ) desc, p.created_at desc, p.id
  limit least(1000, greatest(1, coalesce(p_limit, 500)));
$fn$;
revoke all on function public.get_ranked_plant_market_products(integer)
  from public, anon, authenticated;
grant execute on function public.get_ranked_plant_market_products(integer)
  to anon, authenticated;

-- Initial backfill, before ranked RPC serves past-day aggregates.
select public.maintain_product_rank_history();

commit;
