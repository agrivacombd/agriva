-- CRITICAL: qualify outer references in RLS. Unqualified request_id was resolved inside invitation subquery.
drop policy if exists bulk_request_read on public.bulk_requests;
create policy bulk_request_read on public.bulk_requests for select to authenticated
using (buyer_id=auth.uid() or public.bulk_is_admin() or exists(
 select 1 from public.bulk_invitations i
 where i.request_id=bulk_requests.id and i.wholesaler_id=auth.uid()
 and i.revoked_at is null and i.expires_at>now()));
drop policy if exists bulk_quote_create on public.bulk_quotes;
create policy bulk_quote_create on public.bulk_quotes for insert to authenticated
with check(
 wholesaler_id=auth.uid() and status='pending' and expires_at>now()
 and exists(select 1 from public.bulk_requests r
  where r.id=bulk_quotes.request_id and r.status='open' and r.buyer_id<>auth.uid()
   and (r.quote_deadline is null or r.quote_deadline>now()))
 and exists(select 1 from public.bulk_invitations i
  where i.request_id=bulk_quotes.request_id and i.wholesaler_id=auth.uid()
   and i.revoked_at is null and i.expires_at>now())
 and exists(select 1 from public.bulk_wholesalers w
  where w.user_id=auth.uid() and w.status='verified')
);
-- Permission helper lives outside exposed API schema, preventing cross-RLS recursion.
create or replace function bulk_private.buyer_can_view_wholesaler(p_wholesaler uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(
  select 1 from public.bulk_quotes q join public.bulk_requests r on r.id=q.request_id
  where q.wholesaler_id=p_wholesaler and q.status='approved' and r.buyer_id=auth.uid()
 )
$$;
revoke execute on function bulk_private.buyer_can_view_wholesaler(uuid) from public,anon;
grant usage on schema bulk_private to authenticated;
grant execute on function bulk_private.buyer_can_view_wholesaler(uuid) to authenticated;
drop policy if exists bulk_wholesaler_read on public.bulk_wholesalers;
create policy bulk_wholesaler_read on public.bulk_wholesalers for select to authenticated
using (user_id=auth.uid() or public.bulk_is_admin() or
 (status='verified' and bulk_private.buyer_can_view_wholesaler(bulk_wholesalers.user_id)));
