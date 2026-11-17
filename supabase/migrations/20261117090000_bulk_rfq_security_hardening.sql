-- Security hardening: replace security-definer public view with sanitized, RLS-protected listing table.
drop view if exists public.bulk_public_listings;
create table public.bulk_public_listings (
 id uuid primary key references public.bulk_requests(id) on delete cascade,
 product_name text not null,
 quantity numeric(15,3) not null,
 unit text not null,
 district text not null,
 upazila text not null,
 desired_date date,
 quote_deadline timestamptz,
 created_at timestamptz not null
);
alter table public.bulk_public_listings enable row level security;
revoke all on public.bulk_public_listings from public,anon,authenticated;
grant select on public.bulk_public_listings to anon,authenticated;
create policy bulk_public_read on public.bulk_public_listings for select to anon,authenticated using (true);
insert into public.bulk_public_listings(id,product_name,quantity,unit,district,upazila,desired_date,quote_deadline,created_at)
select id,product_name,quantity,unit,district,upazila,desired_date,quote_deadline,created_at
from public.bulk_requests where status='open' and visibility='public';
-- Populate the sanitized table only after admin-reviewed transitions.
create or replace function public.bulk_moderate_request(p_request uuid, p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bulk_requests%rowtype;
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status not in ('open','closed','cancelled') then raise exception 'Invalid status'; end if;
 update public.bulk_requests set status=p_status where id=p_request and status in ('pending_review','open','closed')
 returning * into r;
 if not found then raise exception 'Request not found or status transition forbidden'; end if;
 if p_status='open' and r.visibility='public' then
   insert into public.bulk_public_listings(id,product_name,quantity,unit,district,upazila,desired_date,quote_deadline,created_at)
   values(r.id,r.product_name,r.quantity,r.unit,r.district,r.upazila,r.desired_date,r.quote_deadline,r.created_at)
   on conflict(id) do update set product_name=excluded.product_name,quantity=excluded.quantity,
   unit=excluded.unit,district=excluded.district,upazila=excluded.upazila,desired_date=excluded.desired_date,
   quote_deadline=excluded.quote_deadline,created_at=excluded.created_at;
 else
   delete from public.bulk_public_listings where id=p_request;
 end if;
end $$;
-- On selection, remove any public listing within the same transaction.
create or replace function public.bulk_select_quote(p_quote uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_request uuid; v_buyer uuid;
begin
 select r.id,r.buyer_id into v_request,v_buyer
 from public.bulk_requests r join public.bulk_quotes q on q.request_id=r.id
 where q.id=p_quote for update of r;
 if v_request is null or v_buyer is distinct from auth.uid() then raise exception 'Not permitted' using errcode='42501'; end if;
 if not exists(select 1 from public.bulk_quotes q
   join public.bulk_wholesalers w on w.user_id=q.wholesaler_id and w.status='verified'
   where q.id=p_quote and q.status='approved' and q.expires_at>now())
 or not exists(select 1 from public.bulk_requests r where r.id=v_request and r.status='open')
 then raise exception 'Quote not available'; end if;
 insert into public.bulk_selections(request_id,quote_id,buyer_id) values(v_request,p_quote,auth.uid());
 update public.bulk_requests set status='selected' where id=v_request;
 delete from public.bulk_public_listings where id=v_request;
 return v_request;
exception when unique_violation then raise exception 'Request already selected';
end $$;
-- Supabase projects can have explicit default EXECUTE grants for anon, not just PUBLIC.
revoke execute on function public.bulk_is_admin() from anon;
revoke execute on function public.bulk_verify_wholesaler(uuid,text) from anon;
revoke execute on function public.bulk_moderate_request(uuid,text) from anon;
revoke execute on function public.bulk_moderate_quote(uuid,text) from anon;
revoke execute on function public.bulk_select_quote(uuid) from anon;
-- Never allow direct writes to public projection.
revoke insert,update,delete on public.bulk_public_listings from anon,authenticated;
