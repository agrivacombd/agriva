begin;
alter table public.products add column if not exists shipping_class text not null default 'packet';
alter table public.products add column if not exists shipping_weight_grams integer;
alter table public.products drop constraint if exists products_shipping_class_check;
alter table public.products add constraint products_shipping_class_check check (shipping_class in ('packet','paddy'));
alter table public.products drop constraint if exists products_shipping_weight_grams_check;
alter table public.products add constraint products_shipping_weight_grams_check check (shipping_weight_grams is null or shipping_weight_grams between 1 and 1000000);
alter table public.marketplace_checkouts add column if not exists shipping_fee numeric(12,2) not null default 0;
alter table public.marketplace_checkouts drop constraint if exists marketplace_checkouts_shipping_fee_check;
alter table public.marketplace_checkouts add constraint marketplace_checkouts_shipping_fee_check check (shipping_fee>=0);
-- Backfill only the existing explicitly labeled 1kg paddy product.
update public.products set shipping_class='paddy',shipping_weight_grams=1000
where name='AGRIVA Black Rice Seed – কালো ধানের বীজ (১ কেজি)' and marketplace_channel='marketplace';
create or replace function public.admin_set_product_shipping(p_product_id uuid,p_shipping_class text,p_shipping_weight_grams integer)
returns void language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin required'; end if;
  if p_shipping_class not in ('packet','paddy') or
     (p_shipping_class='paddy' and (p_shipping_weight_grams is null or p_shipping_weight_grams<1 or p_shipping_weight_grams>1000000)) or
     (p_shipping_class='packet' and p_shipping_weight_grams is not null) then
    raise exception 'Invalid shipping class or weight';
  end if;
  update public.products set shipping_class=p_shipping_class,shipping_weight_grams=p_shipping_weight_grams,updated_at=now()
  where id=p_product_id and marketplace_channel='marketplace';
  if not found then raise exception 'Marketplace product not found'; end if;
end;
$$;
revoke all on function public.admin_set_product_shipping(uuid,text,integer) from public,anon;
grant execute on function public.admin_set_product_shipping(uuid,text,integer) to authenticated;
create or replace function public.finalize_marketplace_cod_order(
  p_product_id uuid,
  p_quantity integer,
  p_shipping_address jsonb,
  p_reseller_id uuid,
  p_attribution_code text,
  p_attribution_expires_at timestamptz,
  p_visitor_token text
)
returns public.marketplace_orders
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid;
  p public.products;
  o public.marketplace_orders;
  total numeric;
  commission numeric;
  rate numeric;
begin
  uid := auth.uid();
  if uid is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100 then raise exception 'Invalid quantity'; end if;

  if p_shipping_address is null
     or jsonb_typeof(p_shipping_address) <> 'object'
     or coalesce(trim(p_shipping_address->>'fullName'), '') = ''
     or coalesce(trim(p_shipping_address->>'phone'), '') = ''
     or coalesce(trim(p_shipping_address->>'district'), '') = ''
     or coalesce(trim(p_shipping_address->>'address'), '') = '' then
    raise exception 'Complete shipping details are required';
  end if;

  -- Never trust a reseller ID supplied by the client. Only attribute the order
  -- when the code, visitor token, product, reseller and live session all match.
  if p_reseller_id is null
     or p_attribution_code is null
     or p_visitor_token is null
     or not exists (
       select 1
       from public.attribution_sessions a
       where a.reseller_id = p_reseller_id
         and a.code = p_attribution_code
         and a.visitor_token = p_visitor_token
         and a.product_id = p_product_id
         and a.expires_at > now()
     ) then
    p_reseller_id := null;
    p_attribution_code := null;
    p_attribution_expires_at := null;
  end if;

  select * into p
  from public.products
  where id = p_product_id and status = 'active' and marketplace_channel = 'marketplace'
  for update;
  if not found then raise exception 'Product unavailable'; end if;
  if p.stock < p_quantity then raise exception 'Insufficient stock'; end if;

  rate := case when p_reseller_id is null then 0 else coalesce(p.reseller_commission_percent, 0) end;
  total := round(p.price * p_quantity, 2);
  commission := round(total * rate / 100, 2);

  insert into public.marketplace_orders(
    buyer_id, farmer_id, reseller_id, product_id, quantity, unit_price,
    total_amount, commission_percent, commission_amount, attribution_code,
    attribution_expires_at, payment_method, payment_status, status, shipping_address
  ) values (
    uid, p.farmer_id, p_reseller_id, p.id, p_quantity, p.price,
    total, rate, commission, p_attribution_code, p_attribution_expires_at,
    'cod', 'pending', 'processing', p_shipping_address
  ) returning * into o;

  update public.products
  set stock = stock - p_quantity, updated_at = now()
  where id = p.id;

  if p_reseller_id is not null then
    insert into public.reseller_commissions(reseller_id, order_id, amount, status)
    values(p_reseller_id, o.id, commission, 'pending');
  end if;

  return o;
end;
$$;
revoke all on function public.finalize_marketplace_cod_order(uuid,integer,jsonb,uuid,text,timestamptz,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION private.finalize_marketplace_cod_order(p_product_id uuid, p_quantity integer, p_shipping_address jsonb, p_reseller_id uuid DEFAULT NULL::uuid, p_attribution_code text DEFAULT NULL::text, p_attribution_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_visitor_token text DEFAULT NULL::text)
 RETURNS marketplace_orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
declare
  v_session public.attribution_sessions%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_reseller_id is null then
    if p_attribution_code is not null or p_attribution_expires_at is not null or p_visitor_token is not null then
      raise exception 'Invalid referral attribution';
    end if;
    return public.finalize_marketplace_cod_order(p_product_id,p_quantity,p_shipping_address,null,null,null,null);
  end if;
  if p_attribution_code is null or p_attribution_expires_at is null or p_visitor_token is null then
    raise exception 'Incomplete referral attribution';
  end if;
  select * into v_session from public.attribution_sessions a
  where a.product_id=p_product_id and a.reseller_id=p_reseller_id
    and a.code=p_attribution_code and a.visitor_token=p_visitor_token
    and a.expires_at=p_attribution_expires_at and a.expires_at>now()
  order by a.created_at desc limit 1;
  if not found then raise exception 'Referral attribution is invalid or expired'; end if;
  return public.finalize_marketplace_cod_order(
    p_product_id,p_quantity,p_shipping_address,v_session.reseller_id,v_session.code,v_session.expires_at,p_visitor_token
  );
end;
$function$;

revoke all on function private.finalize_marketplace_cod_order(uuid,integer,jsonb,uuid,text,timestamptz,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.finalize_marketplace_cart_checkout(p_shipping_address jsonb, p_idempotency_key text, p_attribution_code text DEFAULT NULL::text, p_visitor_token text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
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
  shipping_fee numeric(12,2) := 0;
  paddy_grams bigint := 0;
  packet_present boolean := false;
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
     or coalesce(trim(p_shipping_address->>'address'), '') = '' then
    raise exception 'Complete Bangladesh shipping details are required';
  end if;

  -- Enforce the same bounds at the database boundary because authenticated
  -- clients can invoke this RPC directly and bypass the HTTP route validator.
  if p_shipping_address->>'phone' !~ '^\+8801[3-9][0-9]{8}'
     or length(p_shipping_address->>'phone') <> 14
     or length(p_shipping_address->>'fullName') > 100
     or length(p_shipping_address->>'division') > 80
     or length(p_shipping_address->>'district') > 80
     or length(p_shipping_address->>'upazila') > 100
     or length(p_shipping_address->>'unionOrArea') > 120
     or length(p_shipping_address->>'villageRoadHouse') > 250
     or length(p_shipping_address->>'landmark') > 200
     or length(p_shipping_address->>'postalCode') > 20
     or length(p_shipping_address->>'deliveryInstructions') > 500
     or length(p_shipping_address->>'address') > 470 then
    raise exception 'Invalid Bangladesh shipping details';
  end if;

  -- Serialize retries for the same buyer/key before looking up or creating the checkout.
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_idempotency_key, 0));
  select * into checkout_row from public.marketplace_checkouts
   where buyer_id = uid and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'checkoutId', checkout_row.id,
      'total', checkout_row.total_amount,
      'subtotal', checkout_row.total_amount - checkout_row.shipping_fee,
      'shippingFee', checkout_row.shipping_fee,
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
    if product_row.shipping_class = 'paddy' then
      if product_row.shipping_weight_grams is null or product_row.shipping_weight_grams < 1 then
        raise exception 'Paddy shipping weight is missing for product: %', cart_item.product_id;
      end if;
      paddy_grams := paddy_grams + product_row.shipping_weight_grams::bigint * cart_item.quantity;
    elsif product_row.shipping_class = 'packet' then
      packet_present := true;
    else
      raise exception 'Unsupported shipping class for product: %', cart_item.product_id;
    end if;
  end loop;

  shipping_fee := case
    when paddy_grams > 0 then 135 + greatest(0, ceil(paddy_grams::numeric / 1000)::integer - 1) * 20
    when packet_present then 70
    else 0
  end;
  insert into public.marketplace_checkouts(
    buyer_id, idempotency_key, total_amount, shipping_fee, payment_method, payment_status, status,
    collection_status, shipping_address
  ) values (
    uid, p_idempotency_key, total + shipping_fee, shipping_fee, 'cod', 'pending', 'processing', 'pending', p_shipping_address
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

    -- Use the validated 7-argument private RPC. The legacy 6-argument
    -- wrapper intentionally rejects caller-supplied attribution fields.
    select * into order_row from private.finalize_marketplace_cod_order(
      cart_item.product_id, cart_item.quantity, p_shipping_address,
      attribution_reseller_id,
      case when attribution_reseller_id is not null then p_attribution_code else null end,
      case when attribution_reseller_id is not null then attribution_expires_at else null end,
      case when attribution_reseller_id is not null then p_visitor_token else null end
    );
    update public.marketplace_orders set checkout_id = checkout_row.id where id = order_row.id;
    created_order_ids := array_append(created_order_ids, order_row.id);
  end loop;

  update public.carts set status = 'converted', updated_at = now() where id = cart_row.id;
  return jsonb_build_object(
    'checkoutId', checkout_row.id,
    'total', checkout_row.total_amount,
    'subtotal', total,
    'shippingFee', shipping_fee,
    'orderIds', to_jsonb(created_order_ids),
    'itemOrderCount', cardinality(created_order_ids),
    'paymentMethod', 'cod',
    'paymentStatus', 'pending',
    'collectionStatus', 'pending',
    'idempotentReplay', false
  );
end;
$function$;

revoke all on function public.finalize_marketplace_cart_checkout(jsonb,text,text,text) from public,anon;
grant execute on function public.finalize_marketplace_cart_checkout(jsonb,text,text,text) to authenticated;
commit;