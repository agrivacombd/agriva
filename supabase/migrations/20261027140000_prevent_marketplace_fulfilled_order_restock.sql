-- Prevent invalid order status transitions and inventory inflation on refunds.
create or replace function public.set_marketplace_order_status(p_order_id uuid, p_status text)
returns public.marketplace_orders
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare
  uid uuid;
  o public.marketplace_orders;
  old_status text;
begin
  uid := auth.uid();
  if uid is null then raise exception 'Authentication required'; end if;

  select * into o from public.marketplace_orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if not (public.is_admin() or o.farmer_id = uid) then raise exception 'Not authorized'; end if;
  old_status := o.status;

  if p_status not in ('processing','shipped','delivered','completed','cancelled','refunded') then
    raise exception 'Invalid order status';
  end if;
  if old_status in ('cancelled','refunded') then raise exception 'Order is already closed'; end if;

  -- Cancellation is only allowed before dispatch. Never return fulfilled stock to inventory.
  if p_status = 'cancelled' and old_status not in ('pending','processing') then
    raise exception 'Only pending or processing orders can be cancelled';
  end if;
  -- Enforce forward-only fulfillment transitions to prevent status rollback and duplicate side effects.
  if p_status = 'processing' and old_status <> 'pending' then raise exception 'Invalid order status transition'; end if;
  if p_status = 'shipped' and old_status <> 'processing' then raise exception 'Invalid order status transition'; end if;
  if p_status = 'delivered' and old_status <> 'shipped' then raise exception 'Invalid order status transition'; end if;
  if p_status = 'completed' and old_status <> 'delivered' then raise exception 'Invalid order status transition'; end if;

  if p_status in ('cancelled','refunded') then
    -- Refunds after dispatch/fulfillment must not inflate stock; only pre-dispatch
    -- cancellations release the inventory reservation.
    if p_status = 'cancelled' and old_status in ('pending','processing') then
      update public.products set stock = stock + o.quantity, updated_at = now() where id = o.product_id;
    end if;
    update public.reseller_commissions set status = 'reversed', updated_at = now()
      where order_id = o.id and status in ('pending','approved');
  elsif p_status in ('delivered','completed') then
    update public.reseller_commissions set status = 'approved', updated_at = now()
      where order_id = o.id and status = 'pending';
  end if;

  update public.marketplace_orders
    set status = p_status,
        updated_at = now(),
        shipped_at = case when p_status = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
        delivered_at = case when p_status in ('delivered','completed') then coalesce(delivered_at, now()) else delivered_at end
    where id = o.id returning * into o;
  return o;
end;
$function$;
