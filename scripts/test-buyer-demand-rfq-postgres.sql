\set ON_ERROR_STOP on

-- Buyer phone privilege hardening: column allowlist, no table-wide SELECT.
do $$
begin
  if has_table_privilege('anon','public.buyer_demands','select') then
    raise exception 'anon still has table-wide SELECT';
  end if;
  if not has_column_privilege('anon','public.buyer_demands','crop_name','select') then
    raise exception 'anon lost approved public crop column';
  end if;
  if has_column_privilege('anon','public.buyer_demands','contact_phone','select') then
    raise exception 'anon can read private contact_phone';
  end if;
  if has_column_privilege('authenticated','public.buyer_demands','contact_phone','select') then
    raise exception 'authenticated can read private contact_phone';
  end if;
end $$;

-- Conversion RPC must be unavailable to anon and available only to authenticated.
do $$
begin
  if has_function_privilege('anon',
    'public.convert_buyer_demand_to_bulk_rfq(uuid,text,text,timestamp with time zone)','execute') then
    raise exception 'anon can execute RFQ conversion';
  end if;
  if not has_function_privilege('authenticated',
    'public.convert_buyer_demand_to_bulk_rfq(uuid,text,text,timestamp with time zone)','execute') then
    raise exception 'authenticated cannot execute RFQ conversion';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.buyer_demand_rfq_conversions'::regclass) then
    raise exception 'conversion mapping table RLS is not enabled';
  end if;
  if has_table_privilege('authenticated','public.buyer_demand_rfq_conversions','select') then
    raise exception 'authenticated can directly read conversion mapping table';
  end if;
end $$;

-- Authenticated owner creates a conversion and retry is idempotent.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
declare first_id uuid; second_id uuid;
begin
  first_id := public.convert_buyer_demand_to_bulk_rfq(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','individual','private',now() + interval '7 days');
  second_id := public.convert_buyer_demand_to_bulk_rfq(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','individual','private',now() + interval '7 days');
  if first_id is null or first_id <> second_id then
    raise exception 'conversion retry did not return the original RFQ id';
  end if;
end $$;

-- A different authenticated buyer cannot convert someone else's demand.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
  begin
    perform public.convert_buyer_demand_to_bulk_rfq(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','individual','private',now() + interval '7 days');
    raise exception 'foreign owner conversion unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- Expired and inactive demands must fail.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
begin
  begin
    perform public.convert_buyer_demand_to_bulk_rfq(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','individual','private',now() + interval '7 days');
    raise exception 'expired demand conversion unexpectedly succeeded';
  exception when invalid_parameter_value then
    null;
  end;
  begin
    perform public.convert_buyer_demand_to_bulk_rfq(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc','individual','private',now() + interval '7 days');
    raise exception 'inactive demand conversion unexpectedly succeeded';
  exception when invalid_parameter_value then
    null;
  end;
  begin
    perform public.convert_buyer_demand_to_bulk_rfq(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',null,'private',now() + interval '7 days');
    raise exception 'null buyer type unexpectedly accepted';
  exception when invalid_parameter_value then
    null;
  end;
  begin
    perform public.convert_buyer_demand_to_bulk_rfq(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','individual','public',now() - interval '1 day');
    raise exception 'past quote deadline unexpectedly accepted';
  exception when invalid_parameter_value then
    null;
  end;
end $$;
reset role;

-- Confirm only reviewed fields are copied; sensitive source values remain absent.
do $$
declare r public.bulk_requests%rowtype;
begin
  select br.* into r
  from public.buyer_demand_rfq_conversions c
  join public.bulk_requests br on br.id=c.request_id
  where c.demand_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if not found then raise exception 'RFQ was not created'; end if;
  if r.status <> 'pending_review' or r.visibility <> 'private' then
    raise exception 'RFQ status/visibility mismatch';
  end if;
  if r.product_name <> 'ধান' or r.quantity <> 120 or r.unit <> 'kg'
     or r.district <> 'Dinajpur' or r.upazila <> 'Birampur' then
    raise exception 'approved source fields were not mapped correctly';
  end if;
  if r.desired_date <> current_date + 12 then
    raise exception 'specific date was not mapped';
  end if;
  if (select status from public.buyer_demands where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 'active' then
    raise exception 'source demand status was changed';
  end if;
  if r.specification <> '' then raise exception 'free-text notes may have been copied'; end if;
end $$;

-- Conversion link records cannot be edited or removed.
do $$
begin
  begin
    update public.buyer_demand_rfq_conversions
      set created_at=now()
      where demand_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'conversion link update unexpectedly succeeded';
  exception when sqlstate '55000' then
    null;
  end;
  begin
    delete from public.buyer_demand_rfq_conversions
      where demand_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'conversion link delete unexpectedly succeeded';
  exception when sqlstate '55000' then
    null;
  end;
end $$;

select 'Buyer Demand RFQ PostgreSQL integration tests passed' as result;
