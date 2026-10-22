-- Buyer Demand Board: buyer requests and farmer availability responses.
create table if not exists public.buyer_demands (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  crop_name text not null check (char_length(trim(crop_name)) between 1 and 100),
  variety text check (variety is null or char_length(variety) <= 100),
  quantity numeric(14,2) not null check (quantity > 0),
  unit text not null check (unit in ('kg','maund','ton','bag')),
  price_type text not null default 'negotiable' check (price_type in ('fixed','negotiable','market')),
  target_price numeric(14,2) check (target_price is null or target_price > 0),
  district text not null check (char_length(trim(district)) between 1 and 100),
  upazila text check (upazila is null or char_length(upazila) <= 100),
  delivery_method text not null default 'discuss' check (delivery_method in ('buyer_pickup','seller_delivery','discuss')),
  need_mode text not null default 'flexible' check (need_mode in ('urgent','specific_date','date_range','flexible')),
  need_date date,
  need_start_date date,
  need_end_date date,
  response_deadline date,
  allow_partial boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 2000),
  contact_phone text check (contact_phone is null or char_length(contact_phone) between 6 and 30),
  contact_phone_public boolean not null default false,
  status text not null default 'active' check (status in ('active','fulfilled','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buyer_demands_fixed_price_check check (price_type <> 'fixed' or target_price is not null),
  constraint buyer_demands_need_dates_check check (
    (need_mode = 'urgent' and need_date is null and need_start_date is null and need_end_date is null)
    or (need_mode = 'specific_date' and need_date is not null and need_start_date is null and need_end_date is null)
    or (need_mode = 'date_range' and need_date is null and need_start_date is not null and need_end_date is not null and need_start_date <= need_end_date)
    or (need_mode = 'flexible' and need_date is null and need_start_date is null and need_end_date is null)
  ),
  constraint buyer_demands_public_phone_check check (not contact_phone_public or contact_phone is not null)
);

create index if not exists buyer_demands_active_created_idx
  on public.buyer_demands(status, created_at desc);
create index if not exists buyer_demands_crop_location_idx
  on public.buyer_demands(crop_name, district, status);
create index if not exists buyer_demands_buyer_created_idx
  on public.buyer_demands(buyer_id, created_at desc);

create table if not exists public.buyer_demand_responses (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.buyer_demands(id) on delete cascade,
  farmer_id uuid not null references auth.users(id) on delete cascade,
  available_quantity numeric(14,2) not null check (available_quantity > 0),
  unit text not null check (unit in ('kg','maund','ton','bag')),
  offered_price numeric(14,2) check (offered_price is null or offered_price > 0),
  available_date date,
  location text not null check (char_length(trim(location)) between 1 and 160),
  contact_phone text not null check (char_length(trim(contact_phone)) between 6 and 30),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'interested' check (status in ('interested','contacted','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buyer_demand_response_unique_farmer unique (demand_id, farmer_id)
);

create index if not exists buyer_demand_responses_demand_idx
  on public.buyer_demand_responses(demand_id, created_at desc);
create index if not exists buyer_demand_responses_farmer_idx
  on public.buyer_demand_responses(farmer_id, created_at desc);

alter table public.buyer_demands enable row level security;
alter table public.buyer_demand_responses enable row level security;

drop policy if exists "buyer_demands_public_or_owner_read" on public.buyer_demands;
create policy "buyer_demands_public_or_owner_read"
  on public.buyer_demands for select
  using (
    buyer_id = (select auth.uid())
    or (status = 'active' and (response_deadline is null or response_deadline >= current_date))
  );

drop policy if exists "buyer_demands_owner_insert" on public.buyer_demands;
create policy "buyer_demands_owner_insert"
  on public.buyer_demands for insert to authenticated
  with check (buyer_id = (select auth.uid()));

drop policy if exists "buyer_demands_owner_update" on public.buyer_demands;
create policy "buyer_demands_owner_update"
  on public.buyer_demands for update to authenticated
  using (buyer_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()));

drop policy if exists "buyer_demands_owner_delete" on public.buyer_demands;
create policy "buyer_demands_owner_delete"
  on public.buyer_demands for delete to authenticated
  using (buyer_id = (select auth.uid()));

drop policy if exists "buyer_demand_responses_parties_read" on public.buyer_demand_responses;
create policy "buyer_demand_responses_parties_read"
  on public.buyer_demand_responses for select to authenticated
  using (
    farmer_id = (select auth.uid())
    or exists (
      select 1 from public.buyer_demands d
      where d.id = demand_id and d.buyer_id = (select auth.uid())
    )
  );

drop policy if exists "buyer_demand_responses_authenticated_insert" on public.buyer_demand_responses;
create policy "buyer_demand_responses_authenticated_insert"
  on public.buyer_demand_responses for insert to authenticated
  with check (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.buyer_demands d
      where d.id = demand_id
        and d.buyer_id <> (select auth.uid())
        and d.status = 'active'
        and (d.response_deadline is null or d.response_deadline >= current_date)
    )
  );

grant select on public.buyer_demands to anon, authenticated;
grant insert, update, delete on public.buyer_demands to authenticated;
grant select, insert on public.buyer_demand_responses to authenticated;

create or replace function public.set_buyer_demand_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_buyer_demand_updated_at() from public, anon, authenticated;
drop trigger if exists buyer_demands_updated_at on public.buyer_demands;
create trigger buyer_demands_updated_at before update on public.buyer_demands
for each row execute function public.set_buyer_demand_updated_at();
drop trigger if exists buyer_demand_responses_updated_at on public.buyer_demand_responses;
create trigger buyer_demand_responses_updated_at before update on public.buyer_demand_responses
for each row execute function public.set_buyer_demand_updated_at();
