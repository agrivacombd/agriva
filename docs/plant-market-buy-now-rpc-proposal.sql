-- Proposed standalone Buy Now RPC. Review and test in an isolated staging database before deployment.
-- It deliberately does not read or modify plant_market_carts or plant_market_cart_items.
create or replace function public.plant_market_buy_now_checkout(
  p_product_id uuid,
  p_quantity integer,
  p_shipping_address jsonb,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_buyer uuid := auth.uid();
  v_product public.plant_market_products%rowtype;
  v_checkout public.plant_market_checkouts%rowtype;
  v_order public.plant_market_orders%rowtype;
  v_order_ids uuid[];
  v_total numeric(12,2);
begin
  if v_buyer is null then raise exception 'Authentication required'; end if;
  if p_product_id is null or p_quantity is null or p_quantity not between 1 and 100 then
    raise exception 'Invalid Buy Now item';
  end if;
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,100}$' then
    raise exception 'Invalid checkout key';
  end if;
  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object'
     or coalesce(trim(p_shipping_address->>'fullName'),'') = ''
     or coalesce(trim(p_shipping_address->>'phone'),'') = ''
     or coalesce(trim(p_shipping_address->>'division'),'') = ''
     or coalesce(trim(p_shipping_address->>'district'),'') = ''
     or coalesce(trim(p_shipping_address->>'upazila'),'') = ''
     or coalesce(trim(p_shipping_address->>'unionOrArea'),'') = ''
     or coalesce(trim(p_shipping_address->>'villageRoadHouse'),'') = ''
     or p_shipping_address->>'phone' !~ '^\\+8801[3-9][0-9]{8}$'
     or length(p_shipping_address->>'phone') <> 14
     or length(p_shipping_address->>'fullName') > 100
     or length(p_shipping_address->>'division') > 80
     or length(p_shipping_address->>'district') > 80
     or length(p_shipping_address->>'upazila') > 100
     or length(p_shipping_address->>'unionOrArea') > 100
     or length(p_shipping_address->>'villageRoadHouse') > 200
     or length(coalesce(p_shipping_address->>'landmark','')) > 160
     or length(coalesce(p_shipping_address->>'postalCode','')) > 20
     or length(coalesce(p_shipping_address->>'deliveryInstructions','')) > 300
  then raise exception 'Invalid shipping address'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_buyer::text || ':' || p_idempotency_key,42));
  select * into v_checkout from public.plant_market_checkouts
    where buyer_id = v_buyer and idempotency_key = p_idempotency_key;
  if found then
    select coalesce(array_agg(id), array[]::uuid[]) into v_order_ids
      from public.plant_market_orders where checkout_id = v_checkout.id;
    return jsonb_build_object('checkoutId',v_checkout.id,'orderIds',v_order_ids,
      'total',v_checkout.total_amount,'replayed',true);
  end if;
  if not exists(select 1 from public.site_settings where key='cod_enabled' and value='true') then
    raise exception 'Cash on Delivery is disabled';
  end if;

  select * into v_product from public.plant_market_products
    where id = p_product_id for update;
  if not found or v_product.status is distinct from 'active'
     or v_product.stock < p_quantity or v_product.price <= 0 then
    raise exception 'Product unavailable or insufficient stock';
  end if;
  v_total := v_product.price * p_quantity;
  insert into public.plant_market_checkouts(buyer_id,idempotency_key,total_amount,shipping_address)
    values(v_buyer,p_idempotency_key,v_total,p_shipping_address)
    returning * into v_checkout;
  insert into public.plant_market_orders(checkout_id,buyer_id,seller_id,total_amount,shipping_address)
    values(v_checkout.id,v_buyer,v_product.seller_id,v_total,p_shipping_address)
    returning * into v_order;
  insert into public.plant_market_order_items(order_id,product_id,product_name,quantity,unit_price,line_total)
    values(v_order.id,v_product.id,v_product.name,p_quantity,v_product.price,v_total);
  perform set_config('agriva.plant_market_inventory_adjustment','on',true);
  update public.plant_market_products set stock = stock - p_quantity, updated_at = now()
    where id = v_product.id;
  perform set_config('agriva.plant_market_inventory_adjustment','off',true);
  return jsonb_build_object('checkoutId',v_checkout.id,'orderIds',jsonb_build_array(v_order.id),
    'total',v_total,'replayed',false);
end;
$$;
revoke all on function public.plant_market_buy_now_checkout(uuid,integer,jsonb,text) from public, anon;
grant execute on function public.plant_market_buy_now_checkout(uuid,integer,jsonb,text) to authenticated;
