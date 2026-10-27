-- Avoid exposing the full attribution_sessions row from an anon-callable RPC.
-- The referral redirect only needs success/failure; no caller consumes the inserted row.
drop function if exists public.record_attribution_session(text, text, uuid, integer);

create function public.record_attribution_session(
  p_code text,
  p_visitor_token text,
  p_product_id uuid,
  p_days integer default 15
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  r public.reseller_links;
begin
  if p_days < 1 or p_days > 30 then
    raise exception 'Invalid attribution window';
  end if;

  if p_visitor_token is null
     or length(p_visitor_token) < 16
     or length(p_visitor_token) > 128 then
    raise exception 'Invalid visitor token';
  end if;

  select *
  into r
  from public.reseller_links
  where code = p_code
    and product_id = p_product_id
    and expires_at > now();

  if not found then
    raise exception 'Referral link is invalid or expired';
  end if;

  insert into public.attribution_sessions(
    reseller_id, product_id, code, visitor_token, expires_at
  )
  values (
    r.reseller_id,
    r.product_id,
    r.code,
    p_visitor_token,
    least(r.expires_at, now() + make_interval(days => p_days))
  )
  on conflict (code, visitor_token, product_id)
  do update
    set expires_at = greatest(
      public.attribution_sessions.expires_at,
      excluded.expires_at
    );
end;
$$;

-- Explicitly restrict execution to the roles used by the referral redirect.
revoke all on function public.record_attribution_session(text, text, uuid, integer) from public;
grant execute on function public.record_attribution_session(text, text, uuid, integer) to anon, authenticated;
