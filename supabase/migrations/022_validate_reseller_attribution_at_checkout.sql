-- Bind reseller commissions to a real, unexpired browser attribution session.
-- The legacy six-argument RPC remains for compatibility but cannot accept a reseller ID.
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
set search_path = public
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
  if p_quantity < 1 or p_quantity > 100 then raise exception 'Invalid quantity'; end if;

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
  where id = p_product_id and status = 'active'
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

grant execute on function public.finalize_marketplace_cod_order(uuid,integer,jsonb,uuid,text,timestamptz,text) to authenticated;

-- Prevent older callers from bypassing session validation by supplying a reseller ID.
create or replace function public.finalize_marketplace_cod_order(
  p_product_id uuid,
  p_quantity integer,
  p_shipping_address jsonb,
  p_reseller_id uuid default null,
  p_attribution_code text default null,
  p_attribution_expires_at timestamptz default null
)
returns public.marketplace_orders
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_reseller_id is not null or p_attribution_code is not null or p_attribution_expires_at is not null then
    raise exception 'Validated referral session required';
  end if;
  return public.finalize_marketplace_cod_order(
    p_product_id, p_quantity, p_shipping_address, null, null, null, null
  );
end;
$$;

grant execute on function public.finalize_marketplace_cod_order(uuid,integer,jsonb,uuid,text,timestamptz) to authenticated;
