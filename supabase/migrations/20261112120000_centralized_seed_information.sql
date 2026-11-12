-- Centralized, reusable information for agricultural seed products only.
-- Existing products and descriptions remain untouched.

create table if not exists public.seed_category_content_sections (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null default 'seeds' check (category_slug = 'seeds'),
  section_key text not null unique check (section_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 160),
  content_html text not null default '',
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seed_crop_guides (
  id uuid primary key default gen_random_uuid(),
  crop_slug text not null unique check (crop_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  crop_name text not null check (length(trim(crop_name)) between 1 and 120),
  summary text not null default '',
  content_html text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_seed_details (
  product_id uuid primary key references public.products(id) on delete cascade,
  crop_guide_id uuid references public.seed_crop_guides(id) on delete set null,
  variety_name text not null default '',
  germination_rate numeric(5,2) check (germination_rate is null or germination_rate between 0 and 100),
  purity_rate numeric(5,2) check (purity_rate is null or purity_rate between 0 and 100),
  seed_treatment text not null default '',
  special_warnings text not null default '',
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications) = 'object'),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seed_content_enabled_order_idx
  on public.seed_category_content_sections (is_enabled, sort_order);
create index if not exists seed_crop_guides_active_order_idx
  on public.seed_crop_guides (is_active, sort_order);
create index if not exists product_seed_details_crop_guide_idx
  on public.product_seed_details (crop_guide_id);

alter table public.seed_category_content_sections enable row level security;
alter table public.seed_crop_guides enable row level security;
alter table public.product_seed_details enable row level security;

revoke all on public.seed_category_content_sections from anon, authenticated;
revoke all on public.seed_crop_guides from anon, authenticated;
revoke all on public.product_seed_details from anon, authenticated;

grant select on public.seed_category_content_sections to anon, authenticated;
grant select on public.seed_crop_guides to anon, authenticated;
grant select on public.product_seed_details to anon, authenticated;
grant insert, update, delete on public.seed_category_content_sections to authenticated;
grant insert, update, delete on public.seed_crop_guides to authenticated;
grant insert, update, delete on public.product_seed_details to authenticated;

drop policy if exists "Enabled seed content is public" on public.seed_category_content_sections;
create policy "Enabled seed content is public"
  on public.seed_category_content_sections for select to anon, authenticated
  using (category_slug = 'seeds' and is_enabled = true);

drop policy if exists "Active seed crop guides are public" on public.seed_crop_guides;
create policy "Active seed crop guides are public"
  on public.seed_crop_guides for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Seed product details are public only for active seed products" on public.product_seed_details;
create policy "Seed product details are public only for active seed products"
  on public.product_seed_details for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_seed_details.product_id
        and p.category_slug = 'seeds'
        and p.status = 'active'
        and p.marketplace_channel = 'marketplace'
    )
  );

-- Admin policies are intentionally based on the trusted profiles.role column.
-- No user-editable metadata is used for authorization.
drop policy if exists "Admins manage seed category content" on public.seed_category_content_sections;
create policy "Admins manage seed category content"
  on public.seed_category_content_sections for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins manage seed crop guides" on public.seed_crop_guides;
create policy "Admins manage seed crop guides"
  on public.seed_crop_guides for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins manage product seed details" on public.product_seed_details;
create policy "Admins manage product seed details"
  on public.product_seed_details for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

comment on table public.seed_category_content_sections is 'Reusable information blocks exclusively for marketplace products whose category_slug is seeds.';
comment on table public.seed_crop_guides is 'Reusable crop cultivation guides; attached only to seed products through product_seed_details.';
comment on table public.product_seed_details is 'Structured, product-specific seed facts and optional crop guide assignment. Never applies to non-seed categories.';
