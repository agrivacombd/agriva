-- One customer-facing checkout order with seller/product fulfilment rows underneath.
begin;

create table if not exists public.marketplace_checkouts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null default 'cod' check (payment_method in ('cod','online')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status text not null default 'processing' check (status in ('pending','processing','completed','cancelled','refunded')),
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_orders
  add column if not exists checkout_id uuid references public.marketplace_checkouts(id) on delete set null;

create index if not exists marketplace_orders_checkout_idx
  on public.marketplace_orders(checkout_id);

alter table public.marketplace_checkouts enable row level security;
drop policy if exists marketplace_checkouts_buyer_read on public.marketplace_checkouts;
create policy marketplace_checkouts_buyer_read
  on public.marketplace_checkouts
  for select to authenticated
  using (buyer_id = (select auth.uid()) or public.is_admin());

create or replace function public.finalize_marketplace_cart_checkout(
  p_shipping_address jsonb,
  p_attribution_code text default null,
  p_visitor_token text default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid;
  cart_row public.carts;
  cart_item public.cart_items;
  product_row public.products;
  checkout_row public.marketplace_checkouts;
  order_row public.marketplace_orders;
  attribution_reseller_id uuid;
  attribution_expires_at timestamptz;
  total numeric(12,2) := 0;
  created_order_ids uuid[] := '{}';
begin
  uid := auth.uid();
  if uid is null then raise exception 'Authentication required'; end if;
  if p_shipping_address is null
     or jsonb_typeof(p_shipping_address) <> 'object'
     or coalesce(trim(p_shipping_address->>'fullName'), '') = ''
     or coalesce(trim(p_shipping_address->>'phone'), '') = ''
     or coalesce(trim(p_shipping_address->>'district'), '') = ''
     or coalesce(trim(p_shipping_address->>'address'), '') = '' then
    raise exception 'Complete shipping details are required';
  end if;

  select * into cart_row
  from public.carts
  where user_id = uid and status = 'active'
  for update;
  if not found then raise exception 'Active cart not found'; end if;

  if not exists (select 1 from public.cart_items where cart_id = cart_row.id) then
    raise exception 'Cart is empty';
  end if;

  -- Lock every product in deterministic order and validate the whole cart before
  -- creating anything. Any exception below rolls back the parent, child orders,
  -- commission rows, inventory updates, and cart conversion together.
  for cart_item in
    select * from public.cart_items
    where cart_id = cart_row.id
    order by product_id
    for update
  loop
    select * into product_row
    from public.products
    where id = cart_item.product_id and status = 'active'
    for update;
    if not found then raise exception 'Product unavailable: %', cart_item.product_id; end if;
    if cart_item.quantity > 100 then
      raise exception 'Maximum quantity per product is 100';
    end if;
    if product_row.stock < cart_item.quantity then
      raise exception 'Insufficient stock for product: %', cart_item.product_id;
    end if;
    total := total + round(product_row.price * cart_item.quantity, 2);
  end loop;

  insert into public.marketplace_checkouts(buyer_id,total_amount,payment_method,payment_status,status,shipping_address)
  values(uid,total,'cod','pending','processing',p_shipping_address)
  returning * into checkout_row;

  for cart_item in
    select * from public.cart_items
    where cart_id = cart_row.id
    order by product_id
  loop
    attribution_reseller_id := null;
    attribution_expires_at := null;
    if p_attribution_code is not null and p_visitor_token is not null then
      select a.reseller_id, a.expires_at into attribution_reseller_id, attribution_expires_at
      from public.attribution_sessions a
      where a.code = p_attribution_code
        and a.visitor_token = p_visitor_token
        and a.product_id = cart_item.product_id
        and a.expires_at > now()
      order by a.created_at desc
      limit 1;
    end if;

    if attribution_reseller_id is not null then
      select * into order_row
      from public.finalize_marketplace_cod_order(
        cart_item.product_id, cart_item.quantity, p_shipping_address,
        attribution_reseller_id, p_attribution_code, attribution_expires_at,
        p_visitor_token
      );
    else
      select * into order_row
      from public.finalize_marketplace_cod_order(
        cart_item.product_id, cart_item.quantity, p_shipping_address,
        null, null, null
      );
    end if;

    update public.marketplace_orders
    set checkout_id = checkout_row.id
    where id = order_row.id;
    created_order_ids := array_append(created_order_ids, order_row.id);
  end loop;

  update public.carts
  set status = 'converted', updated_at = now()
  where id = cart_row.id;

  return jsonb_build_object(
    'checkoutId', checkout_row.id,
    'total', checkout_row.total_amount,
    'orderIds', to_jsonb(created_order_ids),
    'itemOrderCount', cardinality(created_order_ids)
  );
end;
$$;

revoke all on function public.finalize_marketplace_cart_checkout(jsonb,text,text) from public, anon;
grant execute on function public.finalize_marketplace_cart_checkout(jsonb,text,text) to authenticated;

commit;
