-- Reserve approved commission balance for requested/approved payouts.
-- Forward-only correction; do not apply to Production until migration history is reconciled.
create or replace function public.request_commission_payout(p_amount numeric, p_method text)
returns public.commission_payouts
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  p public.commission_payouts;
  uid uuid;
  locked_profile uuid;
  available numeric;
  reserved numeric;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Invalid payout amount';
  end if;
  if p_method is null or length(btrim(p_method)) = 0 or length(p_method) > 100 then
    raise exception 'Invalid payout method';
  end if;

  -- Serialize requests for this reseller before calculating available balance.
  select id into locked_profile
  from public.profiles
  where id = uid
  for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  select coalesce(sum(rc.amount), 0)
  into available
  from public.reseller_commissions rc
  where rc.reseller_id = uid
    and rc.status = 'approved';

  select coalesce(sum(cp.amount), 0)
  into reserved
  from public.commission_payouts cp
  where cp.reseller_id = uid
    and cp.status in ('requested', 'approved');

  available := available - reserved;
  if p_amount > available then
    raise exception 'Requested amount exceeds unreserved approved commission balance';
  end if;

  insert into public.commission_payouts(reseller_id, amount, payment_method)
  values (uid, p_amount, btrim(p_method))
  returning * into p;

  return p;
end;
$$;

revoke all privileges on function public.request_commission_payout(numeric, text) from public;
revoke all privileges on function public.request_commission_payout(numeric, text) from anon;
grant execute on function public.request_commission_payout(numeric, text) to authenticated, service_role;
