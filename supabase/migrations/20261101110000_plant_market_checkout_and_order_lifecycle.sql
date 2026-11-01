-- Plant Market owns an independent cart, checkout, order and seller fulfilment lifecycle.
begin;

create table if not exists public.plant_market_carts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active','checked_out','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists plant_market_one_active_cart_per_buyer
  on public.plant_market_carts(buyer_id) where status='active';

create table if not exists public.plant_market_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.plant_market_carts(id) on delete cascade,
  product_id uuid not null references public.plant_market_products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id,product_id)
);
create index if not exists plant_market_cart_items_cart_idx on public.plant_market_cart_items(cart_id);

create table if not exists public.plant_market_checkouts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null,
  total_amount numeric(12,2) not null check(total_amount >= 0),
  payment_method text not null default 'cod' check(payment_method='cod'),
  payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded')),
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  unique(buyer_id,idempotency_key)
);

create table if not exists public.plant_market_orders (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.plant_market_checkouts(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  total_amount numeric(12,2) not null check(total_amount >= 0),
  status text not null default 'processing' check(status in ('processing','shipped','delivered','completed','cancelled')),
  payment_method text not null default 'cod' check(payment_method='cod'),
  payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded')),
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plant_market_orders_seller_idx on public.plant_market_orders(seller_id,created_at desc);
create index if not exists plant_market_orders_buyer_idx on public.plant_market_orders(buyer_id,created_at desc);
create index if not exists plant_market_orders_checkout_idx on public.plant_market_orders(checkout_id);

create table if not exists public.plant_market_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.plant_market_orders(id) on delete restrict,
  product_id uuid not null references public.plant_market_products(id) on delete restrict,
  product_name text not null,
  quantity integer not null check(quantity between 1 and 100),
  unit_price numeric(12,2) not null check(unit_price > 0),
  line_total numeric(12,2) not null check(line_total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists plant_market_order_items_order_idx on public.plant_market_order_items(order_id);

alter table public.plant_market_carts enable row level security;
alter table public.plant_market_cart_items enable row level security;
alter table public.plant_market_checkouts enable row level security;
alter table public.plant_market_orders enable row level security;
alter table public.plant_market_order_items enable row level security;

revoke all on public.plant_market_carts,public.plant_market_cart_items,public.plant_market_checkouts,public.plant_market_orders,public.plant_market_order_items from public,anon,authenticated;
grant select on public.plant_market_carts,public.plant_market_cart_items,public.plant_market_checkouts,public.plant_market_orders,public.plant_market_order_items to authenticated;

drop policy if exists plant_market_cart_owner_read on public.plant_market_carts;
create policy plant_market_cart_owner_read on public.plant_market_carts for select to authenticated using(buyer_id=(select auth.uid()));
drop policy if exists plant_market_cart_item_owner_read on public.plant_market_cart_items;
create policy plant_market_cart_item_owner_read on public.plant_market_cart_items for select to authenticated using(exists(select 1 from public.plant_market_carts c where c.id=cart_id and c.buyer_id=(select auth.uid())));
drop policy if exists plant_market_checkout_party_read on public.plant_market_checkouts;
create policy plant_market_checkout_party_read on public.plant_market_checkouts for select to authenticated using(buyer_id=(select auth.uid()) or public.is_admin());
drop policy if exists plant_market_order_party_read on public.plant_market_orders;
create policy plant_market_order_party_read on public.plant_market_orders for select to authenticated using(buyer_id=(select auth.uid()) or seller_id=(select auth.uid()) or public.is_admin());
drop policy if exists plant_market_order_item_party_read on public.plant_market_order_items;
create policy plant_market_order_item_party_read on public.plant_market_order_items for select to authenticated using(exists(select 1 from public.plant_market_orders o where o.id=order_id and (o.buyer_id=(select auth.uid()) or o.seller_id=(select auth.uid()) or public.is_admin())));

create or replace function public.plant_market_add_to_cart(p_product_id uuid,p_quantity integer default 1)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,pg_temp as $$
declare uid uuid:=auth.uid(); c public.plant_market_carts; p public.plant_market_products; existing_qty integer; next_qty integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_quantity is null or p_quantity<1 or p_quantity>100 then raise exception 'Quantity must be between 1 and 100'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,42));
 select * into c from public.plant_market_carts where buyer_id=uid and status='active' for update;
 if not found then insert into public.plant_market_carts(buyer_id) values(uid) returning * into c; end if;
 select * into p from public.plant_market_products where id=p_product_id and status='active' for update;
 if not found then raise exception 'Plant Market product unavailable'; end if;
 if p.stock<1 then raise exception 'Insufficient stock'; end if;
 select quantity into existing_qty from public.plant_market_cart_items where cart_id=c.id and product_id=p.id for update;
 next_qty:=coalesce(existing_qty,0)+p_quantity;
 if next_qty>least(p.stock,100) then raise exception 'Insufficient stock or maximum quantity exceeded'; end if;
 insert into public.plant_market_cart_items(cart_id,product_id,quantity) values(c.id,p.id,next_qty)
 on conflict(cart_id,product_id) do update set quantity=excluded.quantity,updated_at=now();
 update public.plant_market_carts set updated_at=now() where id=c.id;
 return jsonb_build_object('cartId',c.id,'quantity',next_qty);
end $$;
revoke all on function public.plant_market_add_to_cart(uuid,integer) from public,anon;
grant execute on function public.plant_market_add_to_cart(uuid,integer) to authenticated;

create or replace function public.plant_market_finalize_checkout(p_shipping_address jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,pg_temp as $$
declare
 uid uuid:=auth.uid(); c public.plant_market_carts; existing_checkout public.plant_market_checkouts;
 p record; o public.plant_market_orders; checkout_row public.plant_market_checkouts;
 total numeric(12,2):=0; seller_total numeric(12,2); order_ids uuid[]:='{}'; item_count integer:=0;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,100}$' then raise exception 'Invalid checkout key'; end if;
 if p_shipping_address is null or jsonb_typeof(p_shipping_address)<>'object'
  or coalesce(trim(p_shipping_address->>'fullName'),'')='' or coalesce(trim(p_shipping_address->>'phone'),'')=''
  or coalesce(trim(p_shipping_address->>'division'),'')='' or coalesce(trim(p_shipping_address->>'district'),'')=''
  or coalesce(trim(p_shipping_address->>'upazila'),'')='' or coalesce(trim(p_shipping_address->>'unionOrArea'),'')=''
  or coalesce(trim(p_shipping_address->>'villageRoadHouse'),'')='' then
  raise exception 'Complete Plant Market delivery details are required';
 end if;
 if p_shipping_address->>'phone' !~ '^\+8801[3-9][0-9]{8}$' then raise exception 'Invalid Bangladesh phone'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,42));
 select * into existing_checkout from public.plant_market_checkouts where buyer_id=uid and idempotency_key=p_idempotency_key;
 if found then
  select coalesce(array_agg(id),array[]::uuid[]) into order_ids from public.plant_market_orders where checkout_id=existing_checkout.id;
  return jsonb_build_object('checkoutId',existing_checkout.id,'orderIds',order_ids,'total',existing_checkout.total_amount,'replayed',true);
 end if;
 select * into c from public.plant_market_carts where buyer_id=uid and status='active' for update;
 if not found then raise exception 'Plant Market cart is empty'; end if;
 if not exists(select 1 from public.plant_market_cart_items where cart_id=c.id) then raise exception 'Plant Market cart is empty'; end if;
 -- Lock and validate every line before any persistent checkout/order/stock writes.
 for p in
  select ci.product_id,ci.quantity,pm.seller_id,pm.name,pm.price,pm.stock,pm.status
  from public.plant_market_cart_items ci join public.plant_market_products pm on pm.id=ci.product_id
  where ci.cart_id=c.id order by ci.product_id for update of pm
 loop
  if p.status is distinct from 'active' then raise exception 'Plant Market product unavailable'; end if;
  if p.stock<p.quantity then raise exception 'Insufficient stock for %',p.name; end if;
  total:=total+(p.price*p.quantity); item_count:=item_count+1;
 end loop;
 if item_count=0 then raise exception 'Plant Market cart is empty'; end if;
 insert into public.plant_market_checkouts(buyer_id,idempotency_key,total_amount,shipping_address)
 values(uid,p_idempotency_key,total,p_shipping_address) returning * into checkout_row;
 for p in
  select pm.seller_id,sum(pm.price*ci.quantity)::numeric(12,2) as seller_total
  from public.plant_market_cart_items ci join public.plant_market_products pm on pm.id=ci.product_id
  where ci.cart_id=c.id group by pm.seller_id order by pm.seller_id
 loop
  insert into public.plant_market_orders(checkout_id,buyer_id,seller_id,total_amount,shipping_address)
  values(checkout_row.id,uid,p.seller_id,p.seller_total,p_shipping_address) returning * into o;
  order_ids:=array_append(order_ids,o.id);
  insert into public.plant_market_order_items(order_id,product_id,product_name,quantity,unit_price,line_total)
  select o.id,pm.id,pm.name,ci.quantity,pm.price,pm.price*ci.quantity
  from public.plant_market_cart_items ci join public.plant_market_products pm on pm.id=ci.product_id
  where ci.cart_id=c.id and pm.seller_id=p.seller_id;
 end loop;
 update public.plant_market_products pm set stock=pm.stock-ci.quantity,updated_at=now()
 from public.plant_market_cart_items ci where ci.cart_id=c.id and ci.product_id=pm.id;
 update public.plant_market_carts set status='checked_out',updated_at=now() where id=c.id;
 return jsonb_build_object('checkoutId',checkout_row.id,'orderIds',order_ids,'total',total,'replayed',false);
end $$;
revoke all on function public.plant_market_finalize_checkout(jsonb,text) from public,anon;
grant execute on function public.plant_market_finalize_checkout(jsonb,text) to authenticated;

create or replace function public.plant_market_set_order_status(p_order_id uuid,p_status text)
returns void language plpgsql security definer
set search_path=pg_catalog,public,pg_temp as $$
declare o public.plant_market_orders;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into o from public.plant_market_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if o.seller_id<>(select auth.uid()) then raise exception 'Seller access denied'; end if;
 if (o.status='processing' and p_status not in ('shipped','cancelled'))
  or (o.status='shipped' and p_status<>'delivered')
  or (o.status='delivered' and p_status<>'completed') then raise exception 'Invalid order status transition'; end if;
 if p_status='cancelled' then
  update public.plant_market_products pm set stock=pm.stock+oi.quantity,updated_at=now()
  from public.plant_market_order_items oi where oi.order_id=o.id and oi.product_id=pm.id;
 end if;
 update public.plant_market_orders set status=p_status,updated_at=now() where id=o.id;
end $$;
revoke all on function public.plant_market_set_order_status(uuid,text) from public,anon;
grant execute on function public.plant_market_set_order_status(uuid,text) to authenticated;

commit;
