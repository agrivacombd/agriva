-- Phase 2: atomic COD cart checkout and append-only collection audit.
begin;


create or replace function public.add_marketplace_cart_item(p_product_id uuid, p_quantity integer default 1)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare uid uuid; product_row public.products; cart_row public.carts; item_row public.cart_items; next_quantity integer;
begin
  uid := auth.uid();
  if uid is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100 then raise exception 'Quantity must be between 1 and 100'; end if;
  -- Serialize same-buyer cart creation and take the cart lock before product locks,
  -- matching checkout's cart -> item -> product lock order.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 1));
  select * into cart_row from public.carts where user_id = uid and status = 'active' for update;
  if not found then insert into public.carts(user_id, status) values(uid, 'active') returning * into cart_row; end if;
  select * into product_row from public.products where id = p_product_id and status = 'active' for update;
  if not found then raise exception 'Product unavailable'; end if;
  if product_row.stock < 1 then raise exception 'Insufficient stock'; end if;
  select * into item_row from public.cart_items where cart_id = cart_row.id and product_id = product_row.id for update;
  next_quantity := coalesce(item_row.quantity, 0) + p_quantity;
  if next_quantity > least(product_row.stock, 100) then raise exception 'Insufficient stock or maximum quantity exceeded'; end if;
  insert into public.cart_items(cart_id, product_id, quantity, unit_price)
    values(cart_row.id, product_row.id, next_quantity, product_row.price)
    on conflict (cart_id, product_id) do update
      set quantity = excluded.quantity, unit_price = excluded.unit_price, updated_at = now()
    returning * into item_row;
  update public.carts set updated_at = now() where id = cart_row.id;
  return jsonb_build_object('cartId', cart_row.id, 'itemId', item_row.id, 'quantity', item_row.quantity, 'unitPrice', item_row.unit_price);
end;
$$;
revoke all on function public.add_marketplace_cart_item(uuid,integer) from public, anon;
grant execute on function public.add_marketplace_cart_item(uuid,integer) to authenticated;


create or replace function public.ensure_cart_active_for_item()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $
declare target_cart_id uuid; cart_status text;
begin
  target_cart_id := case when tg_op = 'DELETE' then old.cart_id else new.cart_id end;
  select status into cart_status from public.carts where id = target_cart_id;
  if cart_status is distinct from 'active' then
    raise exception 'Cart is no longer active';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$;
revoke all on function public.ensure_cart_active_for_item() from public, anon, authenticated;
drop trigger if exists cart_items_require_active_cart on public.cart_items;
create trigger cart_items_require_active_cart
before insert or update or delete on public.cart_items
for each row execute function public.ensure_cart_active_for_item();

create table if not exists public.marketplace_checkouts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null default 'cod' check (payment_method = 'cod'),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status text not null default 'processing' check (status in ('pending','processing','completed','cancelled','refunded')),
  collection_status text not null default 'pending' check (collection_status in ('pending','partial','collected','over_collected')),
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, idempotency_key)
);

alter table public.marketplace_orders
  add column if not exists checkout_id uuid references public.marketplace_checkouts(id) on delete set null;
create index if not exists marketplace_orders_checkout_id_idx
  on public.marketplace_orders(checkout_id);

alter table public.marketplace_checkouts enable row level security;
drop policy if exists marketplace_checkouts_buyer_or_admin_read on public.marketplace_checkouts;
create policy marketplace_checkouts_buyer_or_admin_read
  on public.marketplace_checkouts for select to authenticated
  using (buyer_id = (select auth.uid()) or public.is_admin());
grant select on public.marketplace_checkouts to authenticated;
revoke all on public.marketplace_checkouts from anon;
revoke insert, update, delete, truncate on public.marketplace_checkouts from authenticated;

create table if not exists public.cod_collection_events (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.marketplace_checkouts(id) on delete restrict,
  expected_amount numeric(12,2) not null check (expected_amount >= 0),
  collected_amount numeric(12,2) not null check (collected_amount >= 0),
  cumulative_collected numeric(12,2) not null check (cumulative_collected >= 0),
  discrepancy_amount numeric(12,2) not null,
  note text,
  collected_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists cod_collection_events_checkout_idx
  on public.cod_collection_events(checkout_id, created_at desc);
alter table public.cod_collection_events enable row level security;
drop policy if exists cod_collection_events_admin_read on public.cod_collection_events;
create policy cod_collection_events_admin_read
  on public.cod_collection_events for select to authenticated
  using (public.is_admin());
grant select on public.cod_collection_events to authenticated;
revoke all on public.cod_collection_events from anon;
revoke insert, update, delete, truncate on public.cod_collection_events from authenticated;

create or replace function public.finalize_marketplace_cart_checkout(
  p_shipping_address jsonb,
  p_idempotency_key text,
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
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,100}$' then
    raise exception 'Invalid checkout request key';
  end if;
  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object'
     or coalesce(trim(p_shipping_address->>'fullName'), '') = ''
     or coalesce(trim(p_shipping_address->>'phone'), '') = ''
     or coalesce(trim(p_shipping_address->>'division'), '') = ''
     or coalesce(trim(p_shipping_address->>'district'), '') = ''
     or coalesce(trim(p_shipping_address->>'upazila'), '') = ''
     or coalesce(trim(p_shipping_address->>'unionOrArea'), '') = ''
     or coalesce(trim(p_shipping_address->>'villageRoadHouse'), '') = ''
     or coalesce(trim(p_shipping_address->>'address'), '') = '' then
    raise exception 'Complete Bangladesh shipping details are required';
  end if;

  -- Serialize retries for the same buyer/key before looking up or creating the checkout.
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_idempotency_key, 0));
  select * into checkout_row from public.marketplace_checkouts
   where buyer_id = uid and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'checkoutId', checkout_row.id,
      'total', checkout_row.total_amount,
      'paymentMethod', checkout_row.payment_method,
      'paymentStatus', checkout_row.payment_status,
      'collectionStatus', checkout_row.collection_status,
      'idempotentReplay', true
    );
  end if;

  if not exists (select 1 from public.site_settings where key = 'cod_enabled' and value = 'true') then
    raise exception 'Cash on Delivery is disabled';
  end if;

  select * into cart_row from public.carts
   where user_id = uid and status = 'active' for update;
  if not found then raise exception 'Active cart not found'; end if;
  if not exists (select 1 from public.cart_items where cart_id = cart_row.id) then
    raise exception 'Cart is empty';
  end if;

  -- Validate and lock all products before creating any order rows.
  for cart_item in
    select * from public.cart_items where cart_id = cart_row.id order by product_id for update
  loop
    if cart_item.quantity > 100 then raise exception 'Maximum quantity per product is 100'; end if;
    select * into product_row from public.products
     where id = cart_item.product_id and status = 'active' for update;
    if not found then raise exception 'Product unavailable: %', cart_item.product_id; end if;
    if product_row.stock < cart_item.quantity then
      raise exception 'Insufficient stock for product: %', cart_item.product_id;
    end if;
    total := total + round(product_row.price * cart_item.quantity, 2);
  end loop;

  insert into public.marketplace_checkouts(
    buyer_id, idempotency_key, total_amount, payment_method, payment_status, status,
    collection_status, shipping_address
  ) values (
    uid, p_idempotency_key, total, 'cod', 'pending', 'processing', 'pending', p_shipping_address
  ) returning * into checkout_row;

  for cart_item in
    select * from public.cart_items where cart_id = cart_row.id order by product_id
  loop
    attribution_reseller_id := null;
    attribution_expires_at := null;
    if p_attribution_code is not null and p_visitor_token is not null then
      select a.reseller_id, a.expires_at into attribution_reseller_id, attribution_expires_at
      from public.attribution_sessions a
      where a.code = p_attribution_code and a.visitor_token = p_visitor_token
        and a.product_id = cart_item.product_id and a.expires_at > now()
      order by a.created_at desc limit 1;
    end if;

    select * into order_row from public.finalize_marketplace_cod_order(
      cart_item.product_id, cart_item.quantity, p_shipping_address,
      attribution_reseller_id,
      case when attribution_reseller_id is not null then p_attribution_code else null end,
      case when attribution_reseller_id is not null then attribution_expires_at else null end
    );
    update public.marketplace_orders set checkout_id = checkout_row.id where id = order_row.id;
    created_order_ids := array_append(created_order_ids, order_row.id);
  end loop;

  update public.carts set status = 'converted', updated_at = now() where id = cart_row.id;
  return jsonb_build_object(
    'checkoutId', checkout_row.id,
    'total', checkout_row.total_amount,
    'orderIds', to_jsonb(created_order_ids),
    'itemOrderCount', cardinality(created_order_ids),
    'paymentMethod', 'cod',
    'paymentStatus', 'pending',
    'collectionStatus', 'pending',
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public.finalize_marketplace_cart_checkout(jsonb,text,text,text) from public, anon;
grant execute on function public.finalize_marketplace_cart_checkout(jsonb,text,text,text) to authenticated;

create or replace function public.record_cod_collection(
  p_checkout_id uuid,
  p_collected_amount numeric,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  checkout_row public.marketplace_checkouts;
  prior_collected numeric(12,2);
  next_collected numeric(12,2);
  next_status text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin authorization required';
  end if;
  if p_collected_amount is null or p_collected_amount < 0 then
    raise exception 'Collected amount must be zero or greater';
  end if;
  select * into checkout_row from public.marketplace_checkouts
   where id = p_checkout_id for update;
  if not found then raise exception 'Checkout not found'; end if;
  if checkout_row.payment_method <> 'cod' then raise exception 'Checkout is not COD'; end if;
  if checkout_row.payment_status = 'paid' then raise exception 'COD checkout is already fully collected'; end if;

  select coalesce(sum(collected_amount), 0) into prior_collected
    from public.cod_collection_events where checkout_id = p_checkout_id;
  next_collected := prior_collected + p_collected_amount;
  next_status := case
    when next_collected = checkout_row.total_amount then 'collected'
    when next_collected < checkout_row.total_amount and next_collected > 0 then 'partial'
    when next_collected > checkout_row.total_amount then 'over_collected'
    else 'pending'
  end;

  insert into public.cod_collection_events(
    checkout_id, expected_amount, collected_amount, cumulative_collected,
    discrepancy_amount, note, collected_by
  ) values (
    checkout_row.id, checkout_row.total_amount, p_collected_amount, next_collected,
    next_collected - checkout_row.total_amount, nullif(left(trim(coalesce(p_note, '')), 500), ''),
    auth.uid()
  );

  update public.marketplace_checkouts
    set collection_status = next_status,
        payment_status = case when next_collected >= checkout_row.total_amount then 'paid' else 'pending' end,
        updated_at = now()
    where id = checkout_row.id;

  if next_collected >= checkout_row.total_amount then
    update public.marketplace_orders
      set payment_status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
      where checkout_id = checkout_row.id;
  end if;

  return jsonb_build_object(
    'checkoutId', checkout_row.id,
    'expectedAmount', checkout_row.total_amount,
    'collectedThisTime', p_collected_amount,
    'cumulativeCollected', next_collected,
    'discrepancy', next_collected - checkout_row.total_amount,
    'collectionStatus', next_status,
    'paymentStatus', case when next_collected >= checkout_row.total_amount then 'paid' else 'pending' end
  );
end;
$$;

revoke all on function public.record_cod_collection(uuid,numeric,text) from public, anon;
grant execute on function public.record_cod_collection(uuid,numeric,text) to authenticated;

commit;
