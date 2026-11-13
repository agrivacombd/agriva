-- Behavioural ranking for AGRIVA Marketplace and Plant Market.
-- Additive: historical orders remain the source of truth for completed sales.
-- No AI calls. Raw IP addresses, user agents and user IDs are never stored.

begin;

create table if not exists public.product_rank_events (
  market text not null check (market in ('marketplace', 'plant-market')),
  product_id uuid not null,
  event_type text not null check (event_type in ('impression', 'click')),
  viewer_hash text not null check (viewer_hash ~ '^[a-f0-9]{64}$'),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (market, product_id, event_type, viewer_hash, occurred_on)
);
create index if not exists product_rank_events_window_idx
  on public.product_rank_events (market, occurred_on desc, product_id, event_type);

alter table public.product_rank_events enable row level security;
revoke all on public.product_rank_events from public, anon, authenticated;
-- service_role is the only writer; no public RLS policies expose individual events.
grant select, insert, delete on public.product_rank_events to service_role;

-- Called exclusively by the server with service-role credentials. A single
-- viewport report is batched into one RPC and deduplicated per viewer/day.
create or replace function public.record_product_rank_events(
  p_market text, p_events jsonb, p_viewer_hash text
) returns integer
language plpgsql security invoker
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_inserted integer := 0;
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
  select p_market, event.product_id, event.event_type, p_viewer_hash
  from (
    select distinct product_id, event_type
    from jsonb_to_recordset(p_events) as incoming(product_id uuid, event_type text)
    where event_type in ('impression', 'click')
  ) event
  where (p_market = 'marketplace' and exists (
      select 1 from public.products p
      where p.id = event.product_id and p.status = 'active'
        and p.marketplace_channel = 'marketplace' and p.deleted_at is null
    ))
    or (p_market = 'plant-market' and exists (
      select 1 from public.plant_market_products p
      where p.id = event.product_id and p.status = 'active'
    ))
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;
revoke all on function public.record_product_rank_events(text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.record_product_rank_events(text, jsonb, text) to service_role;

create index if not exists marketplace_orders_rank_sales_idx
  on public.marketplace_orders (created_at desc, product_id)
  include (quantity)
  where status in ('delivered', 'completed')
    and payment_status not in ('failed', 'refunded');
create index if not exists plant_market_orders_rank_sales_idx
  on public.plant_market_orders (created_at desc, id)
  where status in ('delivered', 'completed')
    and payment_status not in ('failed', 'refunded');

-- Return strictly public fields, NOT SETOF products (which would reveal
-- seller-only fields through this SECURITY DEFINER RPC).
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
as $$
  with engagement as (
    select product_id,
      count(*) filter (where event_type = 'impression') as impressions,
      count(*) filter (where event_type = 'click') as clicks
    from public.product_rank_events
    where market = 'marketplace' and occurred_on >= current_date - 29
    group by product_id
  ), sales as (
    select product_id, sum(quantity) as units
    from public.marketplace_orders
    where created_at >= now() - interval '30 days'
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
    (42 * ln((1 + coalesce(s.units, 0))::numeric)
      + 12 * least(1::numeric, coalesce(e.clicks, 0)::numeric / greatest(coalesce(e.impressions, 0), 15))
      + 5 * ln((1 + coalesce(e.clicks, 0))::numeric)
      + 2 * ln((1 + coalesce(e.impressions, 0))::numeric)
      + greatest(0::numeric, least(8::numeric,
          8 - extract(epoch from (now() - p.created_at))::numeric / 151200))
    ) desc,
    p.created_at desc, p.id
  limit least(1000, greatest(1, coalesce(p_limit, 500)));
$$;
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
as $$
  with engagement as (
    select product_id,
      count(*) filter (where event_type = 'impression') as impressions,
      count(*) filter (where event_type = 'click') as clicks
    from public.product_rank_events
    where market = 'plant-market' and occurred_on >= current_date - 29
    group by product_id
  ), sales as (
    select oi.product_id, sum(oi.quantity) as units
    from public.plant_market_orders o
    join public.plant_market_order_items oi on oi.order_id = o.id
    where o.created_at >= now() - interval '30 days'
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
  order by (case when p.stock > 0 then 1 else 0 end) desc,
    (42 * ln((1 + coalesce(s.units, 0))::numeric)
      + 12 * least(1::numeric, coalesce(e.clicks, 0)::numeric / greatest(coalesce(e.impressions, 0), 15))
      + 5 * ln((1 + coalesce(e.clicks, 0))::numeric)
      + 2 * ln((1 + coalesce(e.impressions, 0))::numeric)
      + greatest(0::numeric, least(8::numeric,
          8 - extract(epoch from (now() - p.created_at))::numeric / 151200))
    ) desc,
    p.created_at desc, p.id
  limit least(1000, greatest(1, coalesce(p_limit, 500)));
$$;
revoke all on function public.get_ranked_plant_market_products(integer)
  from public, anon, authenticated;
grant execute on function public.get_ranked_plant_market_products(integer)
  to anon, authenticated;

-- Optional daily retention maintenance, run through Supabase Cron or SQL editor.
create or replace function public.prune_product_rank_events()
returns bigint language plpgsql security invoker
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare v_rows bigint;
begin
  if current_user <> 'service_role' and current_user <> 'postgres' then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  delete from public.product_rank_events where occurred_on < current_date - 35;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;
revoke all on function public.prune_product_rank_events() from public, anon, authenticated;
grant execute on function public.prune_product_rank_events() to service_role;

commit;
