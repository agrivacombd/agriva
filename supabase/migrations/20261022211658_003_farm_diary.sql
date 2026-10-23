-- AGRIVA farm diary persistence
create table if not exists public.farm_diary (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  activity text not null check (char_length(activity) between 1 and 2000),
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists farm_diary_owner_idx on public.farm_diary(owner_id, entry_date desc);

alter table public.farm_diary enable row level security;

create policy "farm_diary_owner_read" on public.farm_diary
  for select using (auth.uid() = owner_id);
create policy "farm_diary_owner_insert" on public.farm_diary
  for insert with check (auth.uid() = owner_id);
create policy "farm_diary_owner_update" on public.farm_diary
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "farm_diary_owner_delete" on public.farm_diary
  for delete using (auth.uid() = owner_id);
