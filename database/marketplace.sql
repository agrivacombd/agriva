-- AGRIVA farmer + reseller marketplace
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  commission_percent numeric(5,2) not null default 5 check (commission_percent >= 0 and commission_percent <= 100),
  status text not null default 'draft' check (status in ('draft','active','inactive','sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reseller_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  reseller_code text unique not null,
  payout_method text,
  payout_account text,
  created_at timestamptz not null default now()
);

create table if not exists reseller_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  reseller_id uuid not null references profiles(id) on delete cascade,
  code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  farmer_id uuid not null references profiles(id),
  buyer_id uuid references profiles(id),
  reseller_id uuid references profiles(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  commission_percent numeric(5,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  attribution_code text,
  attribution_expires_at timestamptz,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists reseller_commissions (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null unique references marketplace_orders(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','available','paid','cancelled')),
  available_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists products_farmer_idx on products(farmer_id);
create index if not exists reseller_links_product_idx on reseller_links(product_id);
create index if not exists orders_reseller_idx on marketplace_orders(reseller_id, created_at desc);
create index if not exists commissions_reseller_idx on reseller_commissions(reseller_id, created_at desc);

alter table products enable row level security;
alter table reseller_profiles enable row level security;
alter table reseller_links enable row level security;
alter table marketplace_orders enable row level security;
alter table reseller_commissions enable row level security;

create policy "active products public" on products for select using (status = 'active' or farmer_id = auth.uid() or public.is_admin());
create policy "farmers manage own products" on products for all using (farmer_id = auth.uid() or public.is_admin()) with check (farmer_id = auth.uid() or public.is_admin());
create policy "reseller own profile" on reseller_profiles for select using (user_id = auth.uid() or public.is_admin());
create policy "reseller own links" on reseller_links for select using (reseller_id = auth.uid() or public.is_admin());
create policy "reseller create links" on reseller_links for insert with check (reseller_id = auth.uid());
create policy "order parties read" on marketplace_orders for select using (buyer_id = auth.uid() or farmer_id = auth.uid() or reseller_id = auth.uid() or public.is_admin());
create policy "own commissions read" on reseller_commissions for select using (reseller_id = auth.uid() or public.is_admin());
