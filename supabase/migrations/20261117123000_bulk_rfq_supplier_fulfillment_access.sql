-- Selected supplier may follow assigned order after the initial invitation has expired.
create or replace function bulk_private.is_selected_supplier(p_request uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(
  select 1 from public.bulk_selections s join public.bulk_quotes q on q.id=s.quote_id
  where s.request_id=p_request and q.wholesaler_id=auth.uid()
 )
$$;
revoke execute on function bulk_private.is_selected_supplier(uuid) from public,anon;
grant usage on schema bulk_private to authenticated;
grant execute on function bulk_private.is_selected_supplier(uuid) to authenticated;
drop policy if exists bulk_request_read on public.bulk_requests;
create policy bulk_request_read on public.bulk_requests for select to authenticated
using (
 buyer_id=auth.uid() or public.bulk_is_admin()
 or exists(select 1 from public.bulk_invitations i
   where i.request_id=bulk_requests.id and i.wholesaler_id=auth.uid()
   and i.revoked_at is null and i.expires_at>now())
 or bulk_private.is_selected_supplier(bulk_requests.id)
);
