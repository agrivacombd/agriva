-- Publish only approved product count (no additional private fields).
alter table public.bulk_public_listings
 add column if not exists item_count integer not null default 1 check(item_count between 1 and 20);
update public.bulk_public_listings l set item_count=greatest(1,
 (select count(*)::int from public.bulk_request_items i where i.request_id=l.id));
create or replace function public.bulk_moderate_request(p_request uuid,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bulk_requests%rowtype; v_items integer;
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status not in ('open','closed','cancelled') then raise exception 'Invalid status'; end if;
 update public.bulk_requests set status=p_status
 where id=p_request and status in ('pending_review','open','closed')
 returning * into r;
 if not found then raise exception 'Request not found or status transition forbidden'; end if;
 if p_status='open' and r.visibility='public' then
  select greatest(1,count(*)::int) into v_items from public.bulk_request_items where request_id=p_request;
  insert into public.bulk_public_listings(id,product_name,quantity,unit,district,upazila,desired_date,quote_deadline,created_at,item_count)
  values(r.id,r.product_name,r.quantity,r.unit,r.district,r.upazila,r.desired_date,r.quote_deadline,r.created_at,v_items)
  on conflict(id) do update set product_name=excluded.product_name,quantity=excluded.quantity,
   unit=excluded.unit,district=excluded.district,upazila=excluded.upazila,desired_date=excluded.desired_date,
   quote_deadline=excluded.quote_deadline,created_at=excluded.created_at,item_count=excluded.item_count;
 else
  delete from public.bulk_public_listings where id=p_request;
 end if;
end $$;
revoke execute on function public.bulk_moderate_request(uuid,text) from public,anon;
grant execute on function public.bulk_moderate_request(uuid,text) to authenticated;
