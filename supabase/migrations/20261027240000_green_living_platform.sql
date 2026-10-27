-- AGRIVA Green Living platform foundation.
-- User-owned garden records are private; public impact metrics expose aggregates only.

create table if not exists public.garden_plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plant_name text not null check (char_length(btrim(plant_name)) between 2 and 120),
  nickname text check (nickname is null or char_length(nickname) <= 80),
  plant_type text not null default 'other' check (plant_type in ('indoor', 'flower', 'fruit', 'vegetable', 'herb', 'tree', 'succulent', 'other')),
  location_label text check (location_label is null or char_length(location_label) <= 120),
  acquired_on date,
  photo_url text,
  notes text check (notes is null or char_length(notes) <= 2000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint garden_plants_id_owner_key unique (id, owner_id)
);

create index if not exists garden_plants_owner_active_idx
  on public.garden_plants (owner_id, is_active, created_at desc);

create table if not exists public.garden_care_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.garden_plants(id) on delete cascade,
  task_type text not null check (task_type in ('water', 'fertilize', 'prune', 'repot', 'inspect', 'custom')),
  title text not null check (char_length(btrim(title)) between 2 and 160),
  notes text check (notes is null or char_length(notes) <= 1000),
  due_on date not null,
  completed_at timestamptz,
  recurrence_days integer check (recurrence_days is null or recurrence_days between 1 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint garden_care_tasks_owner_plant_fk foreign key (plant_id, owner_id)
    references public.garden_plants(id, owner_id) on delete cascade
);

-- Composite unique constraint above supports ownership-safe child references.
create index if not exists garden_care_tasks_due_idx
  on public.garden_care_tasks (owner_id, due_on, completed_at);

create table if not exists public.garden_activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.garden_plants(id) on delete cascade,
  activity_type text not null check (activity_type in ('watering', 'fertilizing', 'pruning', 'repotting', 'observation', 'photo', 'other')),
  note text not null check (char_length(btrim(note)) between 2 and 2000),
  photo_url text,
  happened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint garden_activity_logs_owner_plant_fk foreign key (plant_id, owner_id)
    references public.garden_plants(id, owner_id) on delete cascade
);

create index if not exists garden_activity_logs_plant_time_idx
  on public.garden_activity_logs (plant_id, happened_at desc);

alter table public.garden_plants enable row level security;
alter table public.garden_care_tasks enable row level security;
alter table public.garden_activity_logs enable row level security;

drop policy if exists "Owners manage their garden plants" on public.garden_plants;
create policy "Owners manage their garden plants"
  on public.garden_plants for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners manage their garden care tasks" on public.garden_care_tasks;
create policy "Owners manage their garden care tasks"
  on public.garden_care_tasks for all to authenticated
  using ((select auth.uid()) = owner_id and exists (
    select 1 from public.garden_plants p where p.id = plant_id and p.owner_id = (select auth.uid())
  ))
  with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.garden_plants p where p.id = plant_id and p.owner_id = (select auth.uid())
  ));

drop policy if exists "Owners manage their garden activity logs" on public.garden_activity_logs;
create policy "Owners manage their garden activity logs"
  on public.garden_activity_logs for all to authenticated
  using ((select auth.uid()) = owner_id and exists (
    select 1 from public.garden_plants p where p.id = plant_id and p.owner_id = (select auth.uid())
  ))
  with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.garden_plants p where p.id = plant_id and p.owner_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.garden_plants to authenticated;
grant select, insert, update, delete on public.garden_care_tasks to authenticated;
grant select, insert, update, delete on public.garden_activity_logs to authenticated;

create or replace function public.set_green_living_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists garden_plants_updated_at on public.garden_plants;
create trigger garden_plants_updated_at before update on public.garden_plants
for each row execute function public.set_green_living_updated_at();

drop trigger if exists garden_care_tasks_updated_at on public.garden_care_tasks;
create trigger garden_care_tasks_updated_at before update on public.garden_care_tasks
for each row execute function public.set_green_living_updated_at();

-- Return only aggregate, non-identifying public metrics. Never expose member or seller details.
create or replace function public.get_green_impact_metrics()
returns table (
  approved_exchange_listings bigint,
  active_marketplace_products bigint,
  completed_exchange_requests bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.green_exchange_listings l
      where l.status = 'active' and l.moderation_status = 'approved'),
    (select count(*) from public.products p
      where p.status = 'active' and p.moderation_status = 'approved'
      and (
        lower(coalesce(p.name, '')) ~ '(plant|tree|seed|seedling|sapling|flower|orchid|cactus|succulent|nursery|গাছ|চারা|বীজ|ফুল|টব|মাটি|কম্পোস্ট)'
        or lower(coalesce(p.category, '')) ~ '(plant|tree|seed|garden|nursery|গাছ|চারা|বীজ|ফুল|বাগান)'
      )),
    (select count(*) from public.green_exchange_requests r
      join public.green_exchange_listings l on l.id = r.listing_id
      where r.status = 'completed' and l.moderation_status = 'approved');
$$;

revoke all on function public.get_green_impact_metrics() from public;
grant execute on function public.get_green_impact_metrics() to anon, authenticated;

comment on function public.get_green_impact_metrics() is
  'Returns aggregate counts only; does not reveal user IDs, listing IDs, messages, or private garden records.';
