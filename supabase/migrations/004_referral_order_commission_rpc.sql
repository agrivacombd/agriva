-- AGRIVA trusted referral/order/commission workflow.
-- Execute after 001_agriva_core.sql.

create or replace function public.create_referral(p_product_id uuid, p_days integer default 15)
returns public.referrals
language plpgsql
security definer
set search_path = public
as $$
declare r public.referrals;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_days < 1 or p_days > 30 then raise exception 'Invalid attribution window'; end if;
  if not exists (select 1 from public.profiles where id=auth.uid() and role='reseller') then raise exception 'Reseller role required'; end if;
  if not exists (select 1 from public.products where id=p_product_id and status='active') then raise exception 'Product is not active'; end if;
  insert into public.referrals(reseller_id,product_id,code,expires_at)
  values(auth.uid(),p_product_id,'AGRIVA-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),now() + make_interval(days=>p_days))
  returning * into r;
  return r;
end;
$$;

create or replace function public.place_referral_order(p_referral_code text, p_quantity numeric)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare r public.referrals; p public.products; o public.orders; rate numeric; amount numeric; commission_value numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity <= 0 then raise exception 'Invalid quantity'; end if;
  select * into r from public.referrals where code=p_referral_code and expires_at > now();
  if not found then raise exception 'Referral expired or invalid'; end if;
  select * into p from public.products where id=r.product_id and status='active' for update;
  if not found then raise exception 'Product unavailable'; end if;
  if p.stock < p_quantity then raise exception 'Insufficient stock'; end if;
  if r.reseller_id = auth.uid() then raise exception 'Self-referral is not eligible'; end if;
  amount := round(p.price * p_quantity,2);
  rate := p.reseller_commission_percent;
  commission_value := round(amount * rate / 100,2);
  insert into public.orders(customer_id,reseller_id,product_id,referral_id,quantity,subtotal,status)
  values(auth.uid(),r.reseller_id,p.id,r.id,p_quantity,amount,'confirmed') returning * into o;
  update public.products set stock=stock-p_quantity, updated_at=now() where id=p.id;
  insert into public.commissions(order_id,reseller_id,product_id,rate_percent,eligible_amount,commission_amount,status)
  values(o.id,r.reseller_id,p.id,rate,amount,commission_value,'pending');
  return o;
end;
$$;

create or replace function public.set_order_status(p_order_id uuid,p_status public.order_status)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare o public.orders;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin role required'; end if;
  update public.orders set status=p_status where id=p_order_id returning * into o;
  if not found then raise exception 'Order not found'; end if;
  if p_status in ('cancelled','refunded') then
    update public.commissions set status='reversed' where order_id=p_order_id and status in ('pending','approved');
  end if;
  return o;
end;
$$;

grant execute on function public.create_referral(uuid,integer) to authenticated;
grant execute on function public.place_referral_order(text,numeric) to authenticated;
grant execute on function public.set_order_status(uuid,public.order_status) to authenticated;

comment on function public.create_referral is 'Creates a server-controlled referral with a bounded attribution window (AGRIVA default: 15 days).';
comment on function public.place_referral_order is 'Validates referral, expiry, stock and self-referral, then atomically creates order and pending commission.';
comment on function public.set_order_status is 'Admin-only order status transition; cancellation/refund reverses unpaid commission.';
