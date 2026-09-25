-- AGRIVA auth + intelligence schema
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  query text not null,
  normalized_query text,
  intent text,
  category text,
  crop text,
  result_count integer not null default 0,
  clicked_result_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists content_opportunities (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  intent text,
  search_count integer not null default 0,
  growth_percent numeric(8,2) not null default 0,
  no_result_rate numeric(5,2) not null default 0,
  opportunity_type text not null check (opportunity_type in ('article','product','faq','review')),
  status text not null default 'open' check (status in ('open','reviewing','published','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique not null,
  excerpt text, body text, status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null,
  category text, description text, price numeric(12,2), stock integer not null default 0,
  status text not null default 'draft' check (status in ('draft','active','inactive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists search_queries_created_at_idx on search_queries(created_at desc);
create index if not exists search_queries_normalized_idx on search_queries(normalized_query);
create index if not exists search_queries_intent_idx on search_queries(intent);

alter table profiles enable row level security;
alter table search_queries enable row level security;
alter table content_opportunities enable row level security;
alter table articles enable row level security;
alter table products enable row level security;

drop policy if exists "profiles own read" on profiles;
create policy "profiles own read" on profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles own update" on profiles;
create policy "profiles own update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users insert searches" on search_queries;
create policy "users insert searches" on search_queries for insert with check (user_id = auth.uid() or user_id is null);

drop policy if exists "users read own searches" on search_queries;
create policy "users read own searches" on search_queries for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage opportunities" on content_opportunities;
create policy "admins manage opportunities" on content_opportunities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "published articles public" on articles;
create policy "published articles public" on articles for select using (status = 'published' or public.is_admin());
drop policy if exists "admins manage articles" on articles;
create policy "admins manage articles" on articles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "active products public" on products;
create policy "active products public" on products for select using (status = 'active' or public.is_admin());
drop policy if exists "admins manage products" on products;
create policy "admins manage products" on products for all using (public.is_admin()) with check (public.is_admin());
