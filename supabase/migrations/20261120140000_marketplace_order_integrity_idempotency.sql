-- Marketplace order lifecycle restock safety and Buy Now idempotency.
begin;

create or replace function public.set_marketplace_order_status(p_order_id uuid,p_status text)
returns public.marketplace_orders
language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  o public.marketplace_orders;
  v_admin boolean;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  v_admin := public.is_admin();
  select * into o from public.marketplace_orders where id=p_order_id for update;
  if not found then raise exception 'Order not found' using errcode='P0002'; end if;

  if not v_admin then
    if o.farmer_id<>uid or not exists (
      select 1 from public.organizations org
      where org.owner_id=uid and org.status='verified'
        and public.has_module_access('marketplace','manage_orders','organization',org.id)
    ) then
      raise exception 'Marketplace order-management permission required' using errcode='42501';
    end if;
    if not (
      (o.status='processing' and p_status in ('shipped','cancelled'))
      or (o.status='shipped' and p_status='delivered')
      or (o.status='delivered' and p_status='completed')
    ) then
      raise exception 'Invalid seller order status transition' using errcode='22023';
    end if;
  else
    if p_status not in ('processing','shipped','delivered','completed','cancelled','refunded') then
      raise exception 'Invalid order status' using errcode='22023';
    end if;
    if o.status in ('cancelled','refunded') then
      raise exception 'Order is already closed' using errcode='22023';
    end if;
  end if;

  -- Only a pre-shipment cancellation returns stock. A refund is financial,
  -- not proof that goods were physically returned and made saleable again.
  if p_status='cancelled' and o.status in ('pending','processing') and o.shipped_at is null then
    update public.products set stock=stock+o.quantity,updated_at=now() where id=o.product_id;
  end if;

  if p_status in ('cancelled','refunded') then
    update public.reseller_commissions set status='reversed',updated_at=now()
      where order_id=o.id and status in ('pending','approved');
  end if;

  update public.marketplace_orders set status=p_status,updated_at=now(),
    shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,
    delivered_at=case when p_status in ('delivered','completed') then coalesce(delivered_at,now()) else delivered_at end
  where id=o.id returning * into o;
  return o;
end;
$$;
revoke all on function public.set_marketplace_order_status(uuid,text) from public,anon;
grant execute on function public.set_marketplace_order_status(uuid,text) to authenticated;

create table if not exists public.marketplace_order_idempotency (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 100),
  shipping_address jsonb not null,
  order_id uuid not null unique references public.marketplace_orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (buyer_id,idempotency_key)
);
alter table public.marketplace_order_idempotency enable row level security;
revoke all on public.marketplace_order_idempotency from public,anon,authenticated;

create or replace function public.finalize_marketplace_cod_order_idempotent(
  p_product_id uuid,
  p_quantity integer,
  p_shipping_address jsonb,
  p_idempotency_key text,
  p_attribution_code text default null,
  p_visitor_token text default null
) returns public.marketplace_orders
language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  prior public.marketplace_order_idempotency%rowtype;
  result_order public.marketplace_orders;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,100}$' then
    raise exception 'Invalid checkout request key' using errcode='22023';
  end if;
  if p_product_id is null or p_quantity is null or p_quantity < 1 or p_quantity > 100 then
    raise exception 'Invalid product or quantity' using errcode='22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_idempotency_key,0));
  select * into prior from public.marketplace_order_idempotency
    where buyer_id=uid and idempotency_key=p_idempotency_key for update;
  if found then
    if prior.product_id is distinct from p_product_id
      or prior.quantity is distinct from p_quantity
      or prior.shipping_address is distinct from p_shipping_address then
      raise exception 'Idempotency key was already used for a different order request' using errcode='22023';
    end if;
    select * into result_order from public.marketplace_orders where id=prior.order_id;
    if not found then raise exception 'Previous order record is unavailable' using errcode='P0002'; end if;
    return result_order;
  end if;

  select * into result_order from public.finalize_marketplace_cod_order_safe(
    p_product_id,p_quantity,p_shipping_address,p_attribution_code,p_visitor_token
  );
  if not found then raise exception 'Order could not be created'; end if;

  insert into public.marketplace_order_idempotency(
    buyer_id,idempotency_key,product_id,quantity,shipping_address,order_id
  ) values (uid,p_idempotency_key,p_product_id,p_quantity,p_shipping_address,result_order.id);
  return result_order;
end;
$$;
revoke all on function public.finalize_marketplace_cod_order_idempotent(uuid,integer,jsonb,text,text,text) from public,anon;
grant execute on function public.finalize_marketplace_cod_order_idempotent(uuid,integer,jsonb,text,text,text) to authenticated;

commit;
