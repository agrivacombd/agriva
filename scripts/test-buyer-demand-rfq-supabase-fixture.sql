-- Synthetic schema fixture for local Supabase Auth + PostgREST and Admin UI integration.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  full_name text
);
alter table public.profiles enable row level security;
create policy "test users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table public.buyer_demands (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id),
  crop_name text not null,
  variety text,
  quantity numeric not null,
  unit text not null,
  price_type text,
  target_price numeric,
  district text,
  upazila text,
  delivery_method text,
  need_mode text,
  need_date date,
  need_start_date date,
  need_end_date date,
  response_deadline date,
  allow_partial boolean default false,
  notes text,
  contact_phone text,
  contact_phone_public boolean default false,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.bulk_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id),
  buyer_type text not null,
  visibility text not null,
  status text not null,
  product_name text not null,
  specification text not null,
  quantity numeric not null,
  unit text not null,
  district text not null,
  upazila text not null,
  desired_date date,
  quote_deadline timestamptz not null
);

grant usage on schema public to anon, authenticated;
grant select on public.buyer_demands to anon, authenticated;
grant all on public.buyer_demands, public.bulk_requests to service_role;
