-- Manual fulfillment lifecycle for selected RFQ orders (payment integration intentionally separate).
alter table public.bulk_selections
 add column if not exists fulfillment_status text not null default 'pending_confirmation'
 check (fulfillment_status in ('pending_confirmation','confirmed','processing','shipped','delivered','completed','cancelled'));
alter table public.bulk_selections
 add column if not exists updated_at timestamptz not null default now();
create or replace function public.bulk_transition_fulfillment(p_request uuid,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare old_status text;
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 select fulfillment_status into old_status from public.bulk_selections where request_id=p_request for update;
 if old_status is null then raise exception 'Selected quote not found'; end if;
 if not (
   (old_status='pending_confirmation' and p_status in ('confirmed','cancelled')) or
   (old_status='confirmed' and p_status in ('processing','cancelled')) or
   (old_status='processing' and p_status in ('shipped','cancelled')) or
   (old_status='shipped' and p_status='delivered') or
   (old_status='delivered' and p_status='completed')
 ) then raise exception 'Invalid fulfillment status transition'; end if;
 update public.bulk_selections set fulfillment_status=p_status,updated_at=now() where request_id=p_request;
end $$;
revoke execute on function public.bulk_transition_fulfillment(uuid,text) from public,anon;
grant execute on function public.bulk_transition_fulfillment(uuid,text) to authenticated;
