-- AGRIVA crop cycle tracking: sowing-to-harvest records linked to a farmer-owned farm.
create table if not exists public.crop_cycles (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  crop_name text not null check (char_length(trim(crop_name)) between 1 and 100),
  variety text check (variety is null or char_length(variety) <= 100),
  season_name text,
  sowing_date date,
  expected_harvest_date date,
  status text not null default 'planned'
    check (status in ('planned','growing','harvested','cancelled')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sowing_date is null or expected_harvest_date is null or expected_harvest_date >= sowing_date)
);

create index if not exists crop_cycles_owner_idx
  on public.crop_cycles(owner_id, created_at desc);
create index if not exists crop_cycles_farm_idx
  on public.crop_cycles(farm_id, sowing_date desc);

alter table public.crop_cycles enable row level security;

drop policy if exists "crop_cycles_owner_read" on public.crop_cycles;
create policy "crop_cycles_owner_read" on public.crop_cycles
  for select using (auth.uid() = owner_id);

drop policy if exists "crop_cycles_owner_insert" on public.crop_cycles;
create policy "crop_cycles_owner_insert" on public.crop_cycles
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
  );

drop policy if exists "crop_cycles_owner_update" on public.crop_cycles;
create policy "crop_cycles_owner_update" on public.crop_cycles
  for update using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
  );

drop policy if exists "crop_cycles_owner_delete" on public.crop_cycles;
create policy "crop_cycles_owner_delete" on public.crop_cycles
  for delete using (auth.uid() = owner_id);

comment on table public.crop_cycles is 'Farmer-owned crop season records from planning through harvest.';
