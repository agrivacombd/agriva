-- Enforce that referenced crop cycles belong to the same farm as the
-- expense/sale row and to the authenticated owner. The previous predicate
-- (c.farm_id = c.farm_id) was tautological and did not enforce farm scope.
-- Safe to re-run: each policy is dropped before being recreated.
begin;

drop policy if exists farm_expenses_owner_insert on public.farm_expenses;
create policy farm_expenses_owner_insert
  on public.farm_expenses
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.farms f
      where f.id = farm_expenses.farm_id
        and f.owner_id = (select auth.uid())
    )
    and (
      crop_cycle_id is null
      or exists (
        select 1
        from public.crop_cycles c
        where c.id = farm_expenses.crop_cycle_id
          and c.farm_id = farm_expenses.farm_id
          and c.owner_id = (select auth.uid())
      )
    )
  );

drop policy if exists farm_expenses_owner_update on public.farm_expenses;
create policy farm_expenses_owner_update
  on public.farm_expenses
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.farms f
      where f.id = farm_expenses.farm_id
        and f.owner_id = (select auth.uid())
    )
    and (
      crop_cycle_id is null
      or exists (
        select 1
        from public.crop_cycles c
        where c.id = farm_expenses.crop_cycle_id
          and c.farm_id = farm_expenses.farm_id
          and c.owner_id = (select auth.uid())
      )
    )
  );

drop policy if exists farm_sales_owner_insert on public.farm_sales;
create policy farm_sales_owner_insert
  on public.farm_sales
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.farms f
      where f.id = farm_sales.farm_id
        and f.owner_id = (select auth.uid())
    )
    and (
      crop_cycle_id is null
      or exists (
        select 1
        from public.crop_cycles c
        where c.id = farm_sales.crop_cycle_id
          and c.farm_id = farm_sales.farm_id
          and c.owner_id = (select auth.uid())
      )
    )
  );

drop policy if exists farm_sales_owner_update on public.farm_sales;
create policy farm_sales_owner_update
  on public.farm_sales
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.farms f
      where f.id = farm_sales.farm_id
        and f.owner_id = (select auth.uid())
    )
    and (
      crop_cycle_id is null
      or exists (
        select 1
        from public.crop_cycles c
        where c.id = farm_sales.crop_cycle_id
          and c.farm_id = farm_sales.farm_id
          and c.owner_id = (select auth.uid())
      )
    )
  );

commit;
