-- Anti-spam and request idempotency guard for the Bulk RFQ form.
create schema if not exists bulk_private;
revoke all on schema bulk_private from public,anon,authenticated;
create or replace function bulk_private.limit_bulk_requests()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_recent int;
begin
 if new.buyer_id is distinct from auth.uid() then
   raise exception 'Request owner mismatch' using errcode='42501';
 end if;
 if exists(select 1 from public.bulk_requests where buyer_id=new.buyer_id and created_at>now()-interval '30 seconds') then
   raise exception 'Please wait before submitting another request' using errcode='22023';
 end if;
 select count(*) into v_recent from public.bulk_requests
 where buyer_id=new.buyer_id and created_at>now()-interval '24 hours';
 if v_recent>=20 then
   raise exception 'Daily request limit reached' using errcode='22023';
 end if;
 return new;
end $$;
revoke all on function bulk_private.limit_bulk_requests() from public,anon,authenticated;
create trigger bulk_request_submit_limit
before insert on public.bulk_requests for each row
execute function bulk_private.limit_bulk_requests();
