-- Green Exchange: user-owned listings and exchange requests.
-- Review and apply through the project's reconciled migration workflow; do not apply manually to production.
create table if not exists public.green_exchange_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null check (char_length(title) between 4 and 120),
  plant_name text not null check (char_length(plant_name) between 2 and 100),
  description text not null check (char_length(description) between 10 and 3000),
  exchange_type text not null check (exchange_type in ('plant_swap', 'cutting', 'seed', 'gift', 'garden_item')),
  wanted_items text check (wanted_items is null or char_length(wanted_items) <= 500),
  photo_urls text[] not null default '{}',
  area text not null check (char_length(area) between 2 and 100),
  district text check (district is null or char_length(district) <= 100),
  condition text not null default 'healthy' check (condition in ('healthy', 'needs_attention', 'unknown')),
  quantity integer not null default 1 check (quantity between 1 and 500),
  status text not null default 'active' check (status in ('active', 'reserved', 'completed', 'hidden', 'removed')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists green_exchange_public_listing_idx
  on public.green_exchange_listings (created_at desc)
  where status = 'active' and moderation_status = 'approved';
create index if not exists green_exchange_owner_idx
  on public.green_exchange_listings (owner_id, created_at desc);
create index if not exists green_exchange_area_idx
  on public.green_exchange_listings (district, area);

create table if not exists public.green_exchange_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.green_exchange_listings(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 10 and 1200),
  offered_item text not null check (char_length(offered_item) between 2 and 300),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'countered', 'cancelled', 'completed')),
  counter_message text check (counter_message is null or char_length(counter_message) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, requester_id)
);

create index if not exists green_exchange_request_listing_idx
  on public.green_exchange_requests (listing_id, created_at desc);
create index if not exists green_exchange_request_user_idx
  on public.green_exchange_requests (requester_id, created_at desc);

alter table public.green_exchange_listings enable row level security;
alter table public.green_exchange_requests enable row level security;

-- Public can only read approved, active listings. Owners can read their own listings.
drop policy if exists "Public can read approved active exchange listings" on public.green_exchange_listings;
create policy "Public can read approved active exchange listings"
  on public.green_exchange_listings for select to anon, authenticated
  using (status = 'active' and moderation_status = 'approved');

drop policy if exists "Owners can read own exchange listings" on public.green_exchange_listings;
create policy "Owners can read own exchange listings"
  on public.green_exchange_listings for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can create exchange listings" on public.green_exchange_listings;
create policy "Owners can create exchange listings"
  on public.green_exchange_listings for insert to authenticated
  with check ((select auth.uid()) = owner_id and moderation_status = 'pending' and status = 'active');

drop policy if exists "Owners can update own exchange listings" on public.green_exchange_listings;
create policy "Owners can update own exchange listings"
  on public.green_exchange_listings for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can delete own exchange listings" on public.green_exchange_listings;
create policy "Owners can delete own exchange listings"
  on public.green_exchange_listings for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Requests are private to the requester and listing owner; no anonymous requests.
drop policy if exists "Participants can read exchange requests" on public.green_exchange_requests;
create policy "Participants can read exchange requests"
  on public.green_exchange_requests for select to authenticated
  using (
    (select auth.uid()) = requester_id
    or exists (
      select 1 from public.green_exchange_listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Signed-in users can request an exchange" on public.green_exchange_requests;
create policy "Signed-in users can request an exchange"
  on public.green_exchange_requests for insert to authenticated
  with check (
    (select auth.uid()) = requester_id
    and exists (
      select 1 from public.green_exchange_listings l
      where l.id = listing_id
        and l.owner_id <> (select auth.uid())
        and l.status = 'active'
        and l.moderation_status = 'approved'
    )
  );

drop policy if exists "Participants can update exchange requests" on public.green_exchange_requests;
create policy "Participants can update exchange requests"
  on public.green_exchange_requests for update to authenticated
  using (
    (select auth.uid()) = requester_id
    or exists (
      select 1 from public.green_exchange_listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = requester_id
    or exists (
      select 1 from public.green_exchange_listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

grant select on public.green_exchange_listings to anon, authenticated;
grant insert, update, delete on public.green_exchange_listings to authenticated;
grant select, insert, update on public.green_exchange_requests to authenticated;
