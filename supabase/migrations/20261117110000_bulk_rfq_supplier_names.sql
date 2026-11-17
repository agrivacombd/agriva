-- Verified seller business name, visible only to buyers with their approved quotations.
alter table public.bulk_wholesalers add column if not exists display_name text not null default ''
 check(length(display_name)<=120);
drop policy if exists bulk_wholesaler_read on public.bulk_wholesalers;
create policy bulk_wholesaler_read on public.bulk_wholesalers for select to authenticated using (
 user_id=auth.uid() or public.bulk_is_admin() or
 (status='verified' and exists (
   select 1 from public.bulk_quotes q join public.bulk_requests r on r.id=q.request_id
   where q.wholesaler_id=bulk_wholesalers.user_id and q.status='approved' and r.buyer_id=auth.uid()
 ))
);
create or replace function public.bulk_verify_named_wholesaler(p_user uuid,p_status text,p_display_name text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status not in ('verified','suspended') then raise exception 'Invalid status'; end if;
 if p_status='verified' and (length(trim(coalesce(p_display_name,'')))<2 or length(p_display_name)>120)
 then raise exception 'Verified business name required'; end if;
 insert into public.bulk_wholesalers(user_id,status,display_name,verified_at)
 values(p_user,p_status,coalesce(trim(p_display_name),''),case when p_status='verified' then now() else null end)
 on conflict(user_id) do update set status=excluded.status,
 display_name=case when excluded.display_name<>'' then excluded.display_name else bulk_wholesalers.display_name end,
 verified_at=excluded.verified_at;
end $$;
revoke execute on function public.bulk_verify_named_wholesaler(uuid,text,text) from public,anon;
grant execute on function public.bulk_verify_named_wholesaler(uuid,text,text) to authenticated;
