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

-- A user should have one active cart. Partial index leaves converted/abandoned
-- carts intact and does not affect any future guest-cart implementation.
create unique index if not exists carts_one_active_cart_per_user
  on public.carts (user_id)
  where user_id is not null and status = 'active';

commit;
