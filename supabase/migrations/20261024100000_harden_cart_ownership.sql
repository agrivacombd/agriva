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
    )
  )
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );

-- Migration 011 already provides a unique partial index for one active cart per user.

commit;
