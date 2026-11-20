-- Bind every newly-created Marketplace order to the seller organization recorded on its product.
-- Legacy products without an explicit organization are intentionally not purchasable until mapped.
begin;

-- Refunds and paid commissions require external/manual reconciliation. Do not
-- mark a payment as refunded merely because an admin changed the order status.
alter table public.marketplace_orders
  add column if not exists refund_reconciliation_status text not null default 'not_required';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.marketplace_orders'::regclass
      and conname='marketplace_orders_refund_reconciliation_status_check'
  ) then
    alter table public.marketplace_orders
      add constraint marketplace_orders_refund_reconciliation_status_check
      check (refund_reconciliation_status in ('not_required','pending','completed')) not valid;
  end if;
end $$;
alter table public.marketplace_orders
  validate constraint marketplace_orders_refund_reconciliation_status_check;
create index if not exists marketplace_orders_refund_reconciliation_pending_idx
  on public.marketplace_orders (updated_at desc)
  where refund_reconciliation_status='pending';

alter table public.reseller_commissions
  add column if not exists reconciliation_status text not null default 'not_required';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.reseller_commissions'::regclass
      and conname='reseller_commissions_reconciliation_status_check'
  ) then
    alter table public.reseller_commissions
      add constraint reseller_commissions_reconciliation_status_check
      check (reconciliation_status in ('not_required','pending','completed')) not valid;
  end if;
end $$;
alter table public.reseller_commissions
  validate constraint reseller_commissions_reconciliation_status_check;
create index if not exists reseller_commissions_reconciliation_pending_idx
  on public.reseller_commissions (updated_at desc)
  where reconciliation_status='pending';

comment on column public.marketplace_orders.refund_reconciliation_status is
  'Pending means a paid order was marked refunded in the app and its external/manual payment refund must still be reconciled. This column does not initiate a provider refund.';
comment on column public.reseller_commissions.reconciliation_status is
  'Pending means a commission already paid out on a refunded order requires separate accounting reconciliation; paid commission status is never silently reversed.';


create or replace function private.snapshot_marketplace_order_seller_organization()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_product public.products;
begin
  select * into v_product
  from public.products
  where id = new.product_id
  for key share;
  if not found then
    raise exception 'Marketplace product not found' using errcode = '23503';
  end if;
  if v_product.seller_organization_id is null then
    raise exception 'Seller organization is not assigned to this product' using errcode = '23514';
  end if;
  if new.farmer_id is distinct from v_product.farmer_id then
    raise exception 'Order seller does not match product owner' using errcode = '23514';
  end if;
  if new.seller_organization_id is not null
     and new.seller_organization_id is distinct from v_product.seller_organization_id then
    raise exception 'Order seller organization does not match product' using errcode = '23514';
  end if;
  new.seller_organization_id := v_product.seller_organization_id;
  return new;
end;
$$;

revoke all on function private.snapshot_marketplace_order_seller_organization() from public, anon, authenticated;
drop trigger if exists marketplace_order_snapshot_seller_organization on public.marketplace_orders;
create trigger marketplace_order_snapshot_seller_organization
before insert on public.marketplace_orders
for each row execute function private.snapshot_marketplace_order_seller_organization();

create or replace function private.prevent_product_seller_organization_change_with_orders()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if new.seller_organization_id is distinct from old.seller_organization_id
     and exists (select 1 from public.marketplace_orders o where o.product_id = old.id) then
    raise exception 'Seller organization cannot change after marketplace orders exist' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_product_seller_organization_change_with_orders() from public, anon, authenticated;
drop trigger if exists products_lock_seller_organization_after_orders on public.products;
create trigger products_lock_seller_organization_after_orders
before update of seller_organization_id on public.products
for each row execute function private.prevent_product_seller_organization_change_with_orders();

-- Sellers can manage only orders whose snapshotted organization is the exact organization
-- for which they hold Marketplace manage_orders. Legacy org-less orders are admin-only.
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
     or p_status not in ('pending','processing','shipped','delivered','completed','cancelled','refunded') then
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
      and p_status='cancelled' and o.status in ('pending','processing');
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
        (o.status='pending' and p_status='processing') or
        (o.status='processing' and p_status in ('shipped','cancelled')) or
        (o.status='shipped' and p_status in ('delivered','cancelled')) or
        (o.status='delivered' and p_status='completed');
    end if;
  else
    v_allowed :=
      (o.status='pending' and p_status in ('processing','cancelled')) or
      (o.status='processing' and p_status in ('shipped','cancelled')) or
      (o.status='shipped' and p_status in ('delivered','cancelled')) or
      (o.status='delivered' and p_status in ('completed','refunded')) or
      (o.status='completed' and p_status='refunded');
  end if;

  if o.status=p_status then return o; end if;
  if not v_allowed then
    raise exception 'Invalid order status transition: % -> %',o.status,p_status using errcode='22023';
  end if;

  if p_status='cancelled' and o.status in ('pending','processing') then
    update public.products set stock=stock+o.quantity,updated_at=now()
      where id=o.product_id;
  end if;

  if p_status in ('cancelled','refunded') then
    update public.reseller_commissions set status='reversed',updated_at=now()
      where order_id=o.id and status in ('pending','approved');
    if p_status='refunded' then
      -- Paid commissions are deliberately retained; create an accounting follow-up
      -- instead of silently reversing a payout that has already left the platform.
      update public.reseller_commissions
        set reconciliation_status='pending',updated_at=now()
        where order_id=o.id and status='paid' and coalesce(paid_amount,0)>0;
    end if;
  elsif p_status in ('delivered','completed') then
    update public.reseller_commissions set status='approved',updated_at=now()
      where order_id=o.id and status='pending';
  end if;

  update public.marketplace_orders
    set status=p_status,
      -- A refund status is not proof of a successful payment-provider refund.
      payment_status=payment_status,
      refund_reconciliation_status=case
        when p_status='refunded' and payment_status='paid' then 'pending'
        else refund_reconciliation_status
      end,
      updated_at=now(),
      shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,
      delivered_at=case when p_status in ('delivered','completed') then coalesce(delivered_at,now()) else delivered_at end
    where id=o.id returning * into o;
  return o;
end;
$$;

revoke all on function public.set_marketplace_order_status(uuid,text) from public,anon;
grant execute on function public.set_marketplace_order_status(uuid,text) to authenticated;

commit;
