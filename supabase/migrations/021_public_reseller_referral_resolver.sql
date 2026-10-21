-- Public, minimal lookup for reseller referral redirects.
-- Never expose reseller profile data from this public resolver.
create or replace function public.resolve_reseller_link(p_code text)
returns table(product_id uuid, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select rl.product_id, rl.expires_at
  from public.reseller_links rl
  join public.products p on p.id = rl.product_id
  where rl.code = p_code
    and rl.expires_at > now()
    and p.status = 'active'
    and p.stock > 0
  limit 1;
$$;
grant execute on function public.resolve_reseller_link(text) to anon, authenticated;

-- Make referral visits idempotent for the same browser/product/code.
create or replace function public.record_attribution_session(
  p_code text,
  p_visitor_token text,
  p_product_id uuid,
  p_days integer default 15
)
returns public.attribution_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.attribution_sessions;
  r public.reseller_links;
begin
  if p_days < 1 or p_days > 30 then
    raise exception 'Invalid attribution window';
  end if;
  if p_visitor_token is null or length(p_visitor_token) < 16 or length(p_visitor_token) > 128 then
    raise exception 'Invalid visitor token';
  end if;

  select * into r
  from public.reseller_links
  where code = p_code
    and product_id = p_product_id
    and expires_at > now();

  if not found then
    raise exception 'Referral link is invalid or expired';
  end if;

  insert into public.attribution_sessions(reseller_id, product_id, code, visitor_token, expires_at)
  values (r.reseller_id, r.product_id, r.code, p_visitor_token, least(r.expires_at, now() + make_interval(days => p_days)))
  on conflict (code, visitor_token, product_id)
  do update set expires_at = greatest(public.attribution_sessions.expires_at, excluded.expires_at)
  returning * into a;

  return a;
end;
$$;
grant execute on function public.record_attribution_session(text, text, uuid, integer) to anon, authenticated;
