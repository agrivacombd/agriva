-- AGRIVA core database schema
-- Run this migration in Supabase SQL Editor after enabling Auth.
create extension if not exists pgcrypto;

create type public.user_role as enum ('farmer','reseller','admin');
create type public.product_status as enum ('draft','active','paused','sold_out');
create type public.order_status as enum ('pending','confirmed','cancelled','refunded','completed');
create type public.commission_status as enum ('pending','approved','reversed','paid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'farmer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  district text,
  area_acres numeric(12,2) check (area_acres >= 0),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock numeric(12,2) not null default 0 check (stock >= 0),
  reseller_commission_percent numeric(5,2) not null default 0 check (reseller_commission_percent >= 0 and reseller_commission_percent <= 100),
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  reseller_id uuid references public.profiles(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  referral_id uuid references public.referrals(id) on delete set null,
  quantity numeric(12,2) not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  reseller_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  rate_percent numeric(5,2) not null check (rate_percent >= 0 and rate_percent <= 100),
  eligible_amount numeric(12,2) not null check (eligible_amount >= 0),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  status public.commission_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index farms_owner_idx on public.farms(owner_id);
create index products_farmer_idx on public.products(farmer_id);
create index products_status_idx on public.products(status);
create index referrals_reseller_idx on public.referrals(reseller_id);
create index referrals_expiry_idx on public.referrals(expires_at);
create index orders_reseller_idx on public.orders(reseller_id);
create index orders_product_idx on public.orders(product_id);
create index commissions_reseller_idx on public.commissions(reseller_id);

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.products enable row level security;
alter table public.referrals enable row level security;
alter table public.orders enable row level security;
alter table public.commissions enable row level security;

-- Profiles: users can read/update their own profile. Admin policies should be added using a server-side role check.
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "farms_owner_all" on public.farms for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Active marketplace products are publicly readable; writes belong to the farmer who owns the product.
create policy "products_public_active" on public.products for select using (status = 'active' or auth.uid() = farmer_id);
create policy "products_farmer_insert" on public.products for insert with check (auth.uid() = farmer_id);
create policy "products_farmer_update" on public.products for update using (auth.uid() = farmer_id) with check (auth.uid() = farmer_id);
create policy "products_farmer_delete" on public.products for delete using (auth.uid() = farmer_id);

-- Referral codes can be read by their reseller. Public click resolution should use a server-side endpoint.
create policy "referrals_reseller_read" on public.referrals for select using (auth.uid() = reseller_id);
create policy "referrals_reseller_insert" on public.referrals for insert with check (auth.uid() = reseller_id);

create policy "orders_customer_or_reseller_read" on public.orders for select using (auth.uid() = customer_id or auth.uid() = reseller_id);
create policy "commissions_reseller_read" on public.commissions for select using (auth.uid() = reseller_id);

-- Commission creation/calculation must happen in a trusted server-side transaction, not from the browser.
-- Add admin/service-role payout policies separately; never expose service-role keys to the client.

comment on table public.commissions is 'Commission ledger. Calculate server-side after order validation; reverse on cancellation/refund before payout.';
comment on table public.referrals is '15-day referral attribution records. Store expiry server-side; cookie is only a convenience signal.';
