-- Harden authenticated cart ownership and prevent duplicate active carts.
-- Guest carts are not supported by the current storefront checkout flow.
begin;

drop policy if exists cart_owner_read on public.carts;
create policy cart_owner_read
  on public.carts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists cart_owner_write on public.carts;
create policy cart_owner_write
  on public.carts
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists cart_item_owner_read on public.cart_items;
create policy cart_item_owner_read
  on public.cart_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
        and c.status = 'active'
    )
  );

drop policy if exists cart_item_owner_write on public.cart_items;
create policy cart_item_owner_write
  on public.cart_items
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
        and c.status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
        and c.status = 'active'
    )
  );

-- Serialize cart-item mutations with checkout. Checkout locks the cart row;
-- this trigger waits for that lock and rejects writes after conversion.
create or replace function public.ensure_cart_active_for_item()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $
declare
  target_cart_id uuid;
  cart_status text;
begin
  target_cart_id := case when tg_op = 'DELETE' then old.cart_id else new.cart_id end;
  select c.status into cart_status
  from public.carts c
  where c.id = target_cart_id
  for update;
  if not found or cart_status <> 'active' then
    raise exception 'Cart is no longer active';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$;

drop trigger if exists cart_items_require_active_cart on public.cart_items;
create trigger cart_items_require_active_cart
before insert or update or delete on public.cart_items
for each row execute function public.ensure_cart_active_for_item();

-- Migration 011 already provides a unique partial index for one active cart per user.

commit;
