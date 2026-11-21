-- Ensure a farm expense/sale references a crop cycle from the same farm.
-- Safe to apply repeatedly; policy changes only, no data mutation.
drop policy if exists farm_expenses_owner_insert on public.farm_expenses;
create policy farm_expenses_owner_insert
  on public.farm_expenses
  for insert
  to public
  with check (
    (select auth.uid()) = owner_id
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
  to public
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
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
  to public
  with check (
    (select auth.uid()) = owner_id
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
  to public
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
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
