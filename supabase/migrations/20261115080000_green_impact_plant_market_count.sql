-- Green Impact must count only verified active products in the physically
-- separate Plant Market catalogue, not Marketplace seed/product keywords.
-- Keep the existing output column for backwards compatibility with the UI.
begin;

create or replace function public.get_green_impact_metrics()
returns table (
  approved_exchange_listings bigint,
  active_marketplace_products bigint,
  completed_exchange_requests bigint
)
language sql
stable
security definer
set search_path = ''
as $green_impact$
  select
    (select count(*)
       from public.green_exchange_listings l
      where l.status = 'active'
        and l.moderation_status = 'approved'),
    (select count(*)
       from public.plant_market_products p
      where p.status = 'active'),
    (select count(*)
       from public.green_exchange_requests r
       join public.green_exchange_listings l on l.id = r.listing_id
      where r.status = 'completed'
        and l.moderation_status = 'approved');
$green_impact$;

revoke all on function public.get_green_impact_metrics() from public, anon, authenticated;
grant execute on function public.get_green_impact_metrics() to anon, authenticated, service_role;

comment on function public.get_green_impact_metrics() is
  'Public aggregate counts: approved Green Exchange listings, active plant_market_products, and completed approved exchange requests. No customer or private garden data returned.';

commit;
