-- AGRIVA server-side checkout/order creation foundation with cash on delivery.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending_payment' check(status in ('pending_payment','paid','processing','fulfilled','cancelled','refunded')),
  payment_method text not null default 'cod' check(payment_method in ('cod','online')),
  payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded')),
  subtotal numeric(12,2) not null check(subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check(delivery_fee >= 0),
  total numeric(12,2) not null check(total >= 0),
  currency text not null default 'BDT',
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  quantity integer not null check(quantity > 0),
  unit_price numeric(12,2) not null check(unit_price >= 0),
  farmer_id uuid references public.profiles(id) on delete set null,
  reseller_id uuid references public.profiles(id) on delete set null,
  commission_rate numeric(5,2) not null default 0 check(commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric(12,2) not null default 0 check(commission_amount >= 0)
);
create index if not exists orders_buyer_idx on public.orders(buyer_id,created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy if not exists "orders_buyer_read" on public.orders for select using(auth.uid()=buyer_id or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy if not exists "order_items_buyer_read" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and (o.buyer_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin'))));

create or replace function public.create_order_from_cart(p_shipping_address jsonb,p_delivery_fee numeric default 0,p_payment_method text default 'cod')
returns public.orders
language plpgsql security definer set search_path=public
as $$
declare uid uuid; c public.carts; o public.orders; total_sub numeric(12,2); item record;
begin
 uid:=auth.uid(); if uid is null then raise exception 'Authentication required'; end if;
 if p_payment_method not in ('cod','online') then raise exception 'Unsupported payment method'; end if;
 if jsonb_typeof(p_shipping_address) <> 'object' then raise exception 'Invalid shipping address'; end if;
 select * into c from public.carts where user_id=uid and status='active' for update;
 if not found then raise exception 'Cart is empty'; end if;
 select coalesce(sum(quantity*unit_price),0) into total_sub from public.cart_items where cart_id=c.id;
 if total_sub <= 0 then raise exception 'Cart is empty'; end if;
 insert into public.orders(buyer_id,status,payment_method,payment_status,subtotal,delivery_fee,total,shipping_address)
 values(uid,case when p_payment_method='cod' then 'processing' else 'pending_payment' end,p_payment_method,'pending',total_sub,p_delivery_fee,total_sub+p_delivery_fee,p_shipping_address) returning * into o;
 for item in select * from public.cart_items where cart_id=c.id loop
   insert into public.order_items(order_id,product_id,quantity,unit_price) values(o.id,item.product_id,item.quantity,item.unit_price);
 end loop;
 update public.carts set status='converted',updated_at=now() where id=c.id;
 insert into public.order_events(order_id,event_type,event_key,metadata) values(o.id,'created','order-created-'||o.id::text,jsonb_build_object('subtotal',total_sub,'payment_method',p_payment_method)) on conflict(event_key) do nothing;
 return o;
end;$$;
grant execute on function public.create_order_from_cart(jsonb,numeric,text) to authenticated;
