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
  using ((select auth.uid()) = owner_id and moderation_status = 'pending')
  with check ((select auth.uid()) = owner_id and moderation_status = 'pending');

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

-- Request status transitions are intentionally not directly writable by clients.
-- Add a server-validated transition endpoint before granting UPDATE on requests.
grant select on public.green_exchange_listings to anon, authenticated;
grant insert, update, delete on public.green_exchange_listings to authenticated;
grant select, insert on public.green_exchange_requests to authenticated;

-- Keep timestamps consistent when a listing or request changes.
create or replace function public.set_green_exchange_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  new.updated_at = now();
  return new;
end;
$;

drop trigger if exists green_exchange_listings_updated_at on public.green_exchange_listings;
create trigger green_exchange_listings_updated_at
before update on public.green_exchange_listings
for each row execute function public.set_green_exchange_updated_at();

drop trigger if exists green_exchange_requests_updated_at on public.green_exchange_requests;
create trigger green_exchange_requests_updated_at
before update on public.green_exchange_requests
for each row execute function public.set_green_exchange_updated_at();

-- Admin-only moderation endpoint; the role check comes from profiles, not editable user metadata.
create or replace function public.admin_moderate_green_exchange_listing(
  p_listing_id uuid,
  p_moderation_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_moderation_status not in ('approved', 'rejected', 'pending') then
    raise exception 'invalid moderation status' using errcode = '22023';
  end if;

  update public.green_exchange_listings
  set moderation_status = p_moderation_status
  where id = p_listing_id;

  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;
end;
$;

revoke all on function public.admin_moderate_green_exchange_listing(uuid, text) from public, anon;
grant execute on function public.admin_moderate_green_exchange_listing(uuid, text) to authenticated;

-- Only the listing owner may respond to a request. Clients cannot change ownership,
-- requester identity, listing ID, or status directly.
create or replace function public.respond_green_exchange_request(
  p_request_id uuid,
  p_status text,
  p_counter_message text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_status not in ('accepted', 'declined', 'countered') then
    raise exception 'invalid request status' using errcode = '22023';
  end if;

  if p_status = 'countered' and (p_counter_message is null or char_length(p_counter_message) not between 10 and 1200) then
    raise exception 'counter message must be 10 to 1200 characters' using errcode = '22023';
  end if;

  update public.green_exchange_requests r
  set status = p_status,
      counter_message = case when p_status = 'countered' then p_counter_message else null end
  from public.green_exchange_listings l
  where r.id = p_request_id
    and l.id = r.listing_id
    and l.owner_id = auth.uid()
    and r.status = 'pending';

  if not found then
    raise exception 'request not found or already responded to' using errcode = 'P0002';
  end if;
end;
$;

revoke all on function public.respond_green_exchange_request(uuid, text, text) from public, anon;
grant execute on function public.respond_green_exchange_request(uuid, text, text) to authenticated;

