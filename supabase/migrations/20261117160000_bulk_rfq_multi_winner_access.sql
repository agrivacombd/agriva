-- Winning supplier retains visibility of awarded items after invitation expires.
create or replace function bulk_private.is_selected_supplier(p_request uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists (
  select 1 from public.bulk_selections s join public.bulk_quotes q on q.id=s.quote_id
  where s.request_id=p_request and q.wholesaler_id=auth.uid()
 ) or exists (
  select 1 from public.bulk_item_awards a
  join public.bulk_item_offers o on o.id=a.offer_id
  join public.bulk_quotes q on q.id=o.quote_id
  where a.request_id=p_request and q.wholesaler_id=auth.uid()
 )
$$;
revoke execute on function bulk_private.is_selected_supplier(uuid) from public,anon;
grant usage on schema bulk_private to authenticated;
grant execute on function bulk_private.is_selected_supplier(uuid) to authenticated;
