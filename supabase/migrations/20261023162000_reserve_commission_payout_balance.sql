-- Prevent duplicate/overlapping reseller payout requests from exceeding earned commission.
-- Lock the reseller profile row so concurrent requests for the same user serialize.
create or replace function public.request_commission_payout(p_amount numeric, p_method text)
returns public.commission_payouts
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  p public.commission_payouts;
  uid uuid;
  earned numeric;
  reserved numeric;
  available numeric;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payout amount must be greater than zero' using errcode = '22023';
  end if;

  if p_method is null or length(trim(p_method)) = 0 or length(trim(p_method)) > 100 then
    raise exception 'A valid payout method is required' using errcode = '22023';
  end if;

  perform 1
  from public.profiles
  where id = uid and role = 'reseller'
  for update;

  if not found then
    raise exception 'Reseller account required' using errcode = '42501';
  end if;

  select coalesce(sum(rc.amount), 0)
    into earned
  from public.reseller_commissions rc
  where rc.reseller_id = uid
    and rc.status = 'approved';

  -- Requested/approved/paid payouts all reserve earned commissions.
  -- Rejected payouts release the reservation.
  select coalesce(sum(cp.amount), 0)
    into reserved
  from public.commission_payouts cp
  where cp.reseller_id = uid
    and cp.status in ('requested', 'approved', 'paid');

  available := earned - reserved;

  if available < 0 then
    available := 0;
  end if;

  if p_amount > available then
    raise exception 'Requested amount exceeds available commission balance' using errcode = '22023';
  end if;

  insert into public.commission_payouts(reseller_id, amount, payment_method)
  values (uid, p_amount, trim(p_method))
  returning * into p;

  return p;
end;
$function$;

revoke all on function public.request_commission_payout(numeric, text) from public, anon;
grant execute on function public.request_commission_payout(numeric, text) to authenticated, service_role;
