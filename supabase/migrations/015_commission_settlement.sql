-- AGRIVA commission settlement rules.
create or replace function public.set_marketplace_order_status(p_order_id uuid,p_status text)
returns public.marketplace_orders language plpgsql security definer set search_path=public as $$
declare uid uuid; o public.marketplace_orders; old_status text;
begin
 uid:=auth.uid(); if uid is null then raise exception 'Authentication required'; end if;
 select * into o from public.marketplace_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if not (public.is_admin() or o.farmer_id=uid) then raise exception 'Not authorized'; end if;
 old_status:=o.status;
 if p_status not in ('processing','shipped','delivered','completed','cancelled','refunded') then raise exception 'Invalid order status'; end if;
 if old_status in ('cancelled','refunded') then raise exception 'Order is already closed'; end if;
 if p_status in ('cancelled','refunded') then
   if old_status not in ('cancelled','refunded') then update public.products set stock=stock+o.quantity,updated_at=now() where id=o.product_id; end if;
   update public.reseller_commissions set status='reversed',updated_at=now() where order_id=o.id and status in ('pending','approved');
 elsif p_status in ('delivered','completed') then
   update public.reseller_commissions set status='approved',updated_at=now() where order_id=o.id and status='pending';
 end if;
 update public.marketplace_orders set status=p_status,updated_at=now(),shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,delivered_at=case when p_status in ('delivered','completed') then coalesce(delivered_at,now()) else delivered_at end where id=o.id returning * into o;
 return o;
end;$$;
grant execute on function public.set_marketplace_order_status(uuid,text) to authenticated;

create or replace function public.approve_reseller_commission(p_commission_id uuid)
returns public.reseller_commissions language plpgsql security definer set search_path=public as $$
declare c public.reseller_commissions;
begin
 if not public.is_admin() then raise exception 'Admin role required'; end if;
 update public.reseller_commissions set status='approved',updated_at=now() where id=p_commission_id and status='pending' returning * into c;
 if not found then raise exception 'Commission not found or already settled'; end if;
 return c;
end;$$;
grant execute on function public.approve_reseller_commission(uuid) to authenticated;
