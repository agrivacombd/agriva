-- Minimal isolated PostgreSQL fixture for Buyer Demand → RFQ integration tests.
create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

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
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

insert into public.buyer_demands (
 id,buyer_id,crop_name,quantity,unit,district,upazila,need_mode,need_date,
 response_deadline,notes,contact_phone,target_price,status
) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',
  'ধান','120','kg','Dinajpur','Birampur','specific_date',current_date + 12,
  current_date + 20,'PRIVATE_NOTE_MUST_NOT_COPY','01700000000',45,'active'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111',
  'ভুট্টা','50','kg','Rangpur','Mithapukur','flexible',null,
  current_date - 1,'EXPIRED_DEMAND','01800000000',30,'active'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111',
  'গম','30','kg','Dinajpur','Sadar','flexible',null,
  current_date + 20,'CANCELLED','01900000000',20,'cancelled');
