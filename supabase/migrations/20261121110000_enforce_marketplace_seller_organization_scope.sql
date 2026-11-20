-- Bind every newly-created Marketplace order to the seller organization recorded on its product.
-- Legacy products without an explicit organization are intentionally not purchasable.
begin;

-- Validate organization ownership whenever a product is assigned to an organization.
-- Keep NULL assignments available for pre-existing/legacy product workflows; checkout
-- below fails closed for any product that still has no organization.
create or replace function public.validate_marketplace_product_seller_organization()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_organization public.organizations;
begin
  if new.seller_organization_id is null then
    return new;
  end if;

  select * into v_organization
    from public.organizations
    where id = new.seller_organization_id;

  if not found
     or v_organization.owner_id is distinct from new.farmer_id
     or v_organization.status is distinct from 'verified' then
    raise exception 'Seller organization must be verified and owned by the product seller'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
     and old.seller_organization_id is distinct from new.seller_organization_id
     and exists (
       select 1 from public.marketplace_orders
       where product_id = old.id
     ) then
    raise exception 'Seller organization cannot change after marketplace orders exist'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_marketplace_product_seller_organization
  on public.products;
create trigger validate_marketplace_product_seller_organization
  before insert or update of seller_organization_id on public.products
  for each row
  execute function public.validate_marketplace_product_seller_organization();

-- Snapshot the product's organization on every new order. Never trust a client- or
-- checkout-function-supplied organization ID; derive it from the locked product row.
create or replace function public.snapshot_marketplace_order_seller_organization()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_product public.products;
  v_organization public.organizations;
begin
  select * into v_product
    from public.products
    where id = new.product_id
    for key share;

  if not found or v_product.seller_organization_id is null then
    raise exception 'Seller organization is not assigned to this product'
      using errcode = '23514';
  end if;

  select * into v_organization
    from public.organizations
    where id = v_product.seller_organization_id;

  if not found
     or v_organization.owner_id is distinct from v_product.farmer_id
     or v_organization.status is distinct from 'verified' then
    raise exception 'Product seller organization is not verified or does not match the seller'
      using errcode = '23514';
  end if;

  new.seller_organization_id := v_product.seller_organization_id;
  return new;
end;
$$;

drop trigger if exists snapshot_marketplace_order_seller_organization
  on public.marketplace_orders;
create trigger snapshot_marketplace_order_seller_organization
  before insert on public.marketplace_orders
  for each row
  execute function public.snapshot_marketplace_order_seller_organization();

create or replace function public.set_marketplace_order_status(p_order_id uuid,p_status text)
returns public.marketplace_orders
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  o public.marketplace_orders;
  v_product_farmer_id uuid;
  v_admin boolean;
  v_buyer_cancel boolean := false;
  v_allowed boolean := false;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_order_id is null or p_status is null
     or p_status not in ('pending','processing','shipped','delivered','completed','cancelled') then
    raise exception 'Invalid order status' using errcode='22023';
  end if;

  v_admin := public.is_admin();
  select * into o from public.marketplace_orders where id=p_order_id for update;
  if not found then raise exception 'Order not found' using errcode='P0002'; end if;

  select farmer_id into v_product_farmer_id
    from public.products where id=o.product_id for update;
  if v_product_farmer_id is distinct from o.farmer_id then
    raise exception 'Order seller does not match product owner' using errcode='23514';
  end if;

  if not v_admin then
    -- Buyers retain the pre-existing ability to cancel before dispatch.
    v_buyer_cancel := o.buyer_id is not distinct from uid
      and p_status='cancelled' and o.status in ('pending','processing','cancelled');
    if v_buyer_cancel then
      v_allowed := true;
    else
      if o.farmer_id is distinct from uid
         or o.seller_organization_id is null
         or not exists (
           select 1 from public.organizations org
           where org.id=o.seller_organization_id
             and org.owner_id=uid
             and org.status='verified'
             and public.has_module_access('marketplace','manage_orders','organization',org.id)
         ) then
        raise exception 'Marketplace order-management permission required for this seller organization' using errcode='42501';
      end if;
      v_allowed :=
        o.status=p_status or
        (o.status='pending' and p_status='processing') or
        (o.status='processing' and p_status in ('shipped','cancelled')) or
        (o.status='shipped' and p_status in ('delivered','cancelled')) or
        (o.status='delivered' and p_status='completed');
    end if;
  else
    v_allowed :=
      o.status=p_status or
      (o.status='pending' and p_status in ('processing','cancelled')) or
      (o.status='processing' and p_status in ('shipped','cancelled')) or
      (o.status='shipped' and p_status in ('delivered','cancelled')) or
      (o.status='delivered' and p_status='completed');
  end if;

  if o.status=p_status then return o; end if;
  if not v_allowed then
    raise exception 'Invalid order status transition: % -> %',o.status,p_status using errcode='22023';
  end if;

  if p_status='cancelled' and o.status in ('pending','processing') then
    update public.products set stock=stock+o.quantity,updated_at=now()
      where id=o.product_id;
  end if;

  if p_status='cancelled' then
    update public.reseller_commissions set status='reversed',updated_at=now()
      where order_id=o.id and status in ('pending','approved');
  elsif p_status in ('delivered','completed') then
    update public.reseller_commissions set status='approved',updated_at=now()
      where order_id=o.id and status='pending';
  end if;

  update public.marketplace_orders
    set status=p_status,
      updated_at=now(),
      shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,
      delivered_at=case when p_status in ('delivered','completed') then coalesce(delivered_at,now()) else delivered_at end
    where id=o.id returning * into o;
  return o;
end;
$$;

revoke all on function public.validate_marketplace_product_seller_organization() from public,anon;
revoke all on function public.snapshot_marketplace_order_seller_organization() from public,anon;
revoke all on function public.set_marketplace_order_status(uuid,text) from public,anon;
grant execute on function public.set_marketplace_order_status(uuid,text) to authenticated;

commit;
