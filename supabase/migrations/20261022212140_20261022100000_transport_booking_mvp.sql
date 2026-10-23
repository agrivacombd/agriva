-- AGRIVA transport booking MVP
create table if not exists public.transport_partners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 6 and 30),
  district text not null check (char_length(trim(district)) between 1 and 100),
  vehicle_type text not null check (vehicle_type in ('van','pickup','truck','covered','refrigerated')),
  capacity_kg numeric(14,2) not null check (capacity_kg > 0),
  vehicle_registration text not null check (char_length(trim(vehicle_registration)) between 2 and 40),
  notes text not null default '' check (char_length(notes) <= 1000),
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.transport_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  crop_name text not null check (char_length(trim(crop_name)) between 1 and 100),
  quantity numeric(14,2) not null check (quantity > 0),
  unit text not null check (unit in ('kg','maund','ton','bag')),
  origin text not null check (char_length(trim(origin)) between 3 and 240),
  destination text not null check (char_length(trim(destination)) between 3 and 240),
  vehicle_type text not null check (vehicle_type in ('van','pickup','truck','covered','refrigerated')),
  pickup_date date not null,
  loading_help text not null default 'discuss' check (loading_help in ('self','partner','discuss')),
  payment_preference text not null default 'delivery' check (payment_preference in ('advance','delivery','split','discuss')),
  budget numeric(14,2) check (budget is null or budget > 0),
  notes text not null default '' check (char_length(notes) <= 2000),
  status text not null default 'open' check (status in ('open','booked','picked_up','in_transit','delivered','cancelled')),
  selected_quote_id uuid,
  selected_partner_id uuid references public.transport_partners(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transport_booking_not_same_place check (lower(trim(origin)) <> lower(trim(destination)))
);

create table if not exists public.transport_booking_contacts (
  booking_id uuid primary key references public.transport_bookings(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  phone text not null check (char_length(trim(phone)) between 6 and 30),
  created_at timestamptz not null default now()
);

alter table public.transport_booking_contacts enable row level security;
drop policy if exists transport_booking_contacts_read_parties on public.transport_booking_contacts;
create policy transport_booking_contacts_read_parties on public.transport_booking_contacts for select to authenticated
using (
  customer_id = (select auth.uid())
  or exists (
    select 1 from public.transport_bookings b
    where b.id = booking_id and b.selected_partner_id = (select auth.uid())
  )
);
drop policy if exists transport_booking_contacts_insert_customer on public.transport_booking_contacts;
create policy transport_booking_contacts_insert_customer on public.transport_booking_contacts for insert to authenticated
with check (
  customer_id = (select auth.uid())
  and exists (
    select 1 from public.transport_bookings b
    where b.id = booking_id and b.customer_id = (select auth.uid())
  )
);
grant select, insert on public.transport_booking_contacts to authenticated;

create table if not exists public.transport_quotes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.transport_bookings(id) on delete cascade,
  partner_id uuid not null references public.transport_partners(user_id) on delete cascade,
  price numeric(14,2) not null check (price > 0),
  eta_text text not null check (char_length(trim(eta_text)) between 2 and 120),
  loading_fee numeric(14,2) not null default 0 check (loading_fee >= 0),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  unique (booking_id, partner_id),
  unique (id, booking_id)
);

alter table public.transport_bookings
  add constraint transport_booking_selected_quote_fk
  foreign key (selected_quote_id, id)
  references public.transport_quotes(id, booking_id)
  deferrable initially deferred;

create index if not exists transport_bookings_open_created_idx on public.transport_bookings(status, created_at desc);
create index if not exists transport_bookings_customer_idx on public.transport_bookings(customer_id, created_at desc);
create index if not exists transport_quotes_booking_idx on public.transport_quotes(booking_id, created_at);
create index if not exists transport_quotes_partner_idx on public.transport_quotes(partner_id, created_at desc);

alter table public.transport_partners enable row level security;
alter table public.transport_bookings enable row level security;
alter table public.transport_quotes enable row level security;

drop policy if exists transport_partners_read on public.transport_partners;
create policy transport_partners_read on public.transport_partners for select to authenticated
using (user_id = (select auth.uid()) or verification_status = 'verified');

drop policy if exists transport_partners_insert_self on public.transport_partners;
create policy transport_partners_insert_self on public.transport_partners for insert to authenticated
with check (user_id = (select auth.uid()) and verification_status = 'pending');

drop policy if exists transport_bookings_read_owner_or_verified_partner on public.transport_bookings;
create policy transport_bookings_read_owner_or_verified_partner on public.transport_bookings for select to authenticated
using (
  customer_id = (select auth.uid())
  or (status = 'open' and exists (
    select 1 from public.transport_partners p
    where p.user_id = (select auth.uid()) and p.verification_status = 'verified'
  ))
  or selected_partner_id = (select auth.uid())
);

drop policy if exists transport_bookings_insert_self on public.transport_bookings;
create policy transport_bookings_insert_self on public.transport_bookings for insert to authenticated
with check (customer_id = (select auth.uid()) and status = 'open' and selected_quote_id is null and selected_partner_id is null);

drop policy if exists transport_bookings_update_owner on public.transport_bookings;
drop policy if exists transport_bookings_update_parties on public.transport_bookings;
create policy transport_bookings_update_parties on public.transport_bookings for update to authenticated
using (customer_id = (select auth.uid()) or selected_partner_id = (select auth.uid()))
with check (customer_id = (select auth.uid()) or selected_partner_id = (select auth.uid()));

drop policy if exists transport_quotes_read_parties on public.transport_quotes;
create policy transport_quotes_read_parties on public.transport_quotes for select to authenticated
using (
  partner_id = (select auth.uid())
  or exists (select 1 from public.transport_bookings b where b.id = booking_id and b.customer_id = (select auth.uid()))
);

drop policy if exists transport_quotes_insert_verified_partner on public.transport_quotes;
create policy transport_quotes_insert_verified_partner on public.transport_quotes for insert to authenticated
with check (
  partner_id = (select auth.uid())
  and status = 'pending'
  and exists (select 1 from public.transport_partners p where p.user_id = (select auth.uid()) and p.verification_status = 'verified')
  and exists (select 1 from public.transport_bookings b where b.id = booking_id and b.status = 'open' and b.customer_id <> (select auth.uid()))
);

drop policy if exists transport_quotes_update_booking_owner on public.transport_quotes;
create policy transport_quotes_update_booking_owner on public.transport_quotes for update to authenticated
using (exists (select 1 from public.transport_bookings b where b.id = booking_id and b.customer_id = (select auth.uid())))
with check (exists (select 1 from public.transport_bookings b where b.id = booking_id and b.customer_id = (select auth.uid())));

grant select, insert on public.transport_partners to authenticated;
grant select, insert on public.transport_bookings to authenticated;
grant update (status, selected_quote_id, selected_partner_id, updated_at) on public.transport_bookings to authenticated;
grant select, insert on public.transport_quotes to authenticated;
grant update (status) on public.transport_quotes to authenticated;

create or replace function public.set_transport_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_transport_updated_at() from public, anon, authenticated;
drop trigger if exists transport_bookings_updated_at on public.transport_bookings;
create trigger transport_bookings_updated_at before update on public.transport_bookings
for each row execute function public.set_transport_updated_at();

-- Verification status is intentionally not client-updatable. An administrator must
-- review submitted details and change verification_status through a trusted admin workflow.
