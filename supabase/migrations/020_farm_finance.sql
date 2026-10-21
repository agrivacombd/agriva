-- AGRIVA farm finance ledger: farmer-owned expenses and harvest sales.
create table if not exists public.farm_expenses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('seed','fertilizer','pesticide','labor','irrigation','machinery','transport','other')),
  description text not null check (char_length(trim(description)) between 1 and 160),
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  check (crop_cycle_id is null or farm_id is not null)
);
create index if not exists farm_expenses_owner_date_idx on public.farm_expenses(owner_id, expense_date desc);
create index if not exists farm_expenses_farm_idx on public.farm_expenses(farm_id, expense_date desc);

alter table public.farm_expenses enable row level security;
drop policy if exists "farm_expenses_owner_read" on public.farm_expenses;
create policy "farm_expenses_owner_read" on public.farm_expenses for select using (auth.uid() = owner_id);
drop policy if exists "farm_expenses_owner_insert" on public.farm_expenses;
create policy "farm_expenses_owner_insert" on public.farm_expenses for insert with check (
  auth.uid() = owner_id
  and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
  and (crop_cycle_id is null or exists (
    select 1 from public.crop_cycles c where c.id = crop_cycle_id and c.farm_id = farm_id and c.owner_id = auth.uid()
  ))
);
drop policy if exists "farm_expenses_owner_update" on public.farm_expenses;
create policy "farm_expenses_owner_update" on public.farm_expenses for update using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
  and (crop_cycle_id is null or exists (
    select 1 from public.crop_cycles c where c.id = crop_cycle_id and c.farm_id = farm_id and c.owner_id = auth.uid()
  ))
);
drop policy if exists "farm_expenses_owner_delete" on public.farm_expenses;
create policy "farm_expenses_owner_delete" on public.farm_expenses for delete using (auth.uid() = owner_id);

create table if not exists public.farm_sales (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 160),
  amount numeric(12,2) not null check (amount > 0),
  sale_date date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists farm_sales_owner_date_idx on public.farm_sales(owner_id, sale_date desc);
create index if not exists farm_sales_farm_idx on public.farm_sales(farm_id, sale_date desc);

alter table public.farm_sales enable row level security;
drop policy if exists "farm_sales_owner_read" on public.farm_sales;
create policy "farm_sales_owner_read" on public.farm_sales for select using (auth.uid() = owner_id);
drop policy if exists "farm_sales_owner_insert" on public.farm_sales;
create policy "farm_sales_owner_insert" on public.farm_sales for insert with check (
  auth.uid() = owner_id
  and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
  and (crop_cycle_id is null or exists (
    select 1 from public.crop_cycles c where c.id = crop_cycle_id and c.farm_id = farm_id and c.owner_id = auth.uid()
  ))
);
drop policy if exists "farm_sales_owner_update" on public.farm_sales;
create policy "farm_sales_owner_update" on public.farm_sales for update using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
  and (crop_cycle_id is null or exists (
    select 1 from public.crop_cycles c where c.id = crop_cycle_id and c.farm_id = farm_id and c.owner_id = auth.uid()
  ))
);
drop policy if exists "farm_sales_owner_delete" on public.farm_sales for delete using (auth.uid() = owner_id);

comment on table public.farm_expenses is 'Farmer-entered costs linked to a farm and optionally a crop cycle.';
comment on table public.farm_sales is 'Farmer-entered crop sales revenue linked to a farm and optionally a crop cycle.';
