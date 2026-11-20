-- Correct Marketplace inventory restoration and order-state transition rules.
-- Cancellation may release stock only before dispatch; refunds never restock automatically.
begin;

create or replace function public.set_marketplace_order_status(p_order_id uuid,p_status text)
returns public.marketplace_orders
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  o public.marketplace_orders;
  v_admin boolean;
  v_allowed boolean := false;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_order_id is null or p_status is null
     or p_status not in ('pending','processing','shipped','delivered','completed','cancelled','refunded') then
    raise exception 'Invalid order status' using errcode='22023';
  end if;

  v_admin := public.is_admin();
  select * into o from public.marketplace_orders where id=p_order_id for update;
  if not found then raise exception 'Order not found' using errcode='P0002'; end if;

  if not v_admin then
    if o.farmer_id is distinct from uid or not exists (
      select 1 from public.organizations org
      where org.owner_id=uid and org.status='verified'
        and public.has_module_access('marketplace','manage_orders','organization',org.id)
    ) then
      raise exception 'Marketplace order-management permission required' using errcode='42501';
    end if;
    v_allowed :=
      (o.status='processing' and p_status in ('shipped','cancelled')) or
      (o.status='shipped' and p_status in ('delivered','cancelled')) or
      (o.status='delivered' and p_status='completed');
  else
    v_allowed :=
      (o.status='pending' and p_status in ('processing','cancelled')) or
      (o.status='processing' and p_status in ('shipped','cancelled')) or
      (o.status='shipped' and p_status in ('delivered','cancelled')) or
      (o.status='delivered' and p_status in ('completed','refunded')) or
      (o.status='completed' and p_status='refunded');
  end if;

  -- Same-state retries are harmless and do not repeat stock/commission side effects.
  if o.status=p_status then return o; end if;
  if not v_allowed then
    raise exception 'Invalid order status transition: % -> %',o.status,p_status using errcode='22023';
  end if;

  -- Inventory is released only for pre-dispatch cancellations. A refund is
  -- financial; shipped/fulfilled goods must not be automatically returned to stock.
  if p_status='cancelled' and o.status in ('pending','processing') then
    update public.products set stock=stock+o.quantity,updated_at=now()
      where id=o.product_id;
  end if;

  if p_status in ('cancelled','refunded') then
    update public.reseller_commissions set status='reversed',updated_at=now()
      where order_id=o.id and status in ('pending','approved');
  elsif p_status in ('delivered','completed') then
    update public.reseller_commissions set status='approved',updated_at=now()
      where order_id=o.id and status='pending';
  end if;

  update public.marketplace_orders
    set status=p_status,updated_at=now(),
      shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,
      delivered_at=case when p_status in ('delivered','completed') then coalesce(delivered_at,now()) else delivered_at end
    where id=o.id returning * into o;
  return o;
end;
$$;

revoke all on function public.set_marketplace_order_status(uuid,text) from public,anon;
grant execute on function public.set_marketplace_order_status(uuid,text) to authenticated;

commit;
