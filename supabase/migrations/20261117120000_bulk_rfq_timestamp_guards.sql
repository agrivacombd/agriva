-- Enforce server-owned request timestamps and bounded quote expiry.
create or replace function bulk_private.limit_bulk_requests()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_recent int;
begin
 if new.buyer_id is distinct from auth.uid() then
   raise exception 'Request owner mismatch' using errcode='42501';
 end if;
 new.created_at := now(); -- never trust a user-supplied timestamp for anti-spam decisions
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
drop policy if exists bulk_quote_create on public.bulk_quotes;
create policy bulk_quote_create on public.bulk_quotes for insert to authenticated
with check(
 wholesaler_id=auth.uid() and status='pending'
 and expires_at>now() and expires_at<=now()+interval '30 days'
 and exists(select 1 from public.bulk_requests r where r.id=bulk_quotes.request_id
  and r.status='open' and r.buyer_id<>auth.uid() and (r.quote_deadline is null or r.quote_deadline>now()))
 and exists(select 1 from public.bulk_invitations i where i.request_id=bulk_quotes.request_id
  and i.wholesaler_id=auth.uid() and i.revoked_at is null and i.expires_at>now())
 and exists(select 1 from public.bulk_wholesalers w where w.user_id=auth.uid() and w.status='verified')
);
