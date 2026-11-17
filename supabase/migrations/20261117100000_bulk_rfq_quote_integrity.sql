-- Refuse unverified supplier offers and hide expired public listings.
drop policy if exists bulk_public_read on public.bulk_public_listings;
create policy bulk_public_read on public.bulk_public_listings for select to anon,authenticated
using (quote_deadline is null or quote_deadline>now());
create or replace function public.bulk_moderate_quote(p_quote uuid,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status not in ('approved','rejected') then raise exception 'Invalid status'; end if;
 update public.bulk_quotes q set status=p_status
 from public.bulk_requests r
 where q.id=p_quote and q.request_id=r.id and q.status in ('pending','approved') and r.status='open'
 and (p_status='rejected' or (
  q.expires_at>now()
  and exists (select 1 from public.bulk_wholesalers w where w.user_id=q.wholesaler_id and w.status='verified')
  and exists (select 1 from public.bulk_invitations i
   where i.request_id=q.request_id and i.wholesaler_id=q.wholesaler_id and i.revoked_at is null)
 ));
 if not found then raise exception 'Quote not eligible'; end if;
end $$;
revoke execute on function public.bulk_moderate_quote(uuid,text) from public,anon;
grant execute on function public.bulk_moderate_quote(uuid,text) to authenticated;
