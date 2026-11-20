\set ON_ERROR_STOP on

-- Isolated PostgreSQL fixture: no Supabase project or production data is touched.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create schema if not exists auth;
create or replace function auth.uid()
returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table public.organizations (
  id uuid primary key,
  owner_id uuid not null,
  status text not null
);

create table public.products (
  id uuid primary key,
  farmer_id uuid not null,
  stock integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.marketplace_orders (
  id uuid primary key,
  product_id uuid not null references public.products(id),
  farmer_id uuid not null,
  buyer_id uuid not null,
  status text not null,
  quantity integer not null,
  updated_at timestamptz not null default now(),
  shipped_at timestamptz,
  delivered_at timestamptz
);

create table public.reseller_commissions (
  id bigint generated always as identity primary key,
  order_id uuid not null,
  status text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable
as $$ select coalesce(nullif(current_setting('test.is_admin', true), '')::boolean, false) $$;

create or replace function public.has_module_access(text, text, text, uuid)
returns boolean language sql stable
as $$ select coalesce(nullif(current_setting('test.manage_orders', true), '')::boolean, false) $$;

\ir ../../supabase/migrations/20261121100000_marketplace_seller_organization_scope.sql
\ir ../../supabase/migrations/20261121110000_enforce_marketplace_seller_organization_scope.sql

insert into public.organizations (id, owner_id, status) values
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','verified'),
('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','verified'),
('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','pending'),
('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','verified');

-- Product creation rejects organizations owned by another seller or not verified.
do $$
begin
  begin
    insert into public.products(id, farmer_id, seller_organization_id)
    values ('30000000-0000-0000-0000-000000000001',
            '20000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000002');
    raise exception 'Expected wrong-owner organization insert to fail';
  exception when check_violation then null;
  end;

  begin
    insert into public.products(id, farmer_id, seller_organization_id)
    values ('30000000-0000-0000-0000-000000000002',
            '20000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000003');
    raise exception 'Expected unverified organization insert to fail';
  exception when check_violation then null;
  end;
end $$;

insert into public.products(id, farmer_id, stock, seller_organization_id) values
('30000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000001',4,'10000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001',10,'10000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000001',2,null);

-- A client-supplied organization is ignored; the product organization is snapshotted.
insert into public.marketplace_orders(id, product_id, farmer_id, buyer_id, status, quantity, seller_organization_id)
values ('40000000-0000-0000-0000-000000000010',
        '30000000-0000-0000-0000-000000000010',
        '20000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'pending',2,'10000000-0000-0000-0000-000000000002');

do $$
begin
  if (select seller_organization_id from public.marketplace_orders
      where id='40000000-0000-0000-0000-000000000010')
      <> '10000000-0000-0000-0000-000000000001'::uuid then
    raise exception 'Order did not snapshot the product organization';
  end if;

  begin
    update public.products set seller_organization_id='10000000-0000-0000-0000-000000000004'
    where id='30000000-0000-0000-0000-000000000010';
    raise exception 'Expected organization reassignment after order to fail';
  exception when check_violation then null;
  end;

  begin
    insert into public.marketplace_orders(id, product_id, farmer_id, buyer_id, status, quantity)
    values ('40000000-0000-0000-0000-000000000012',
            '30000000-0000-0000-0000-000000000012',
            '20000000-0000-0000-0000-000000000001',
            '50000000-0000-0000-0000-000000000001',
            'pending',1);
    raise exception 'Expected checkout for unmapped legacy product to fail';
  exception when check_violation then null;
  end;
end $$;

-- Seller must have access to the exact order organization; valid transition works,
-- same-state retries are idempotent, and invalid jumps / other sellers are rejected.
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
select set_config('test.manage_orders','true',false);
select public.set_marketplace_order_status('40000000-0000-0000-0000-000000000010','processing');
select public.set_marketplace_order_status('40000000-0000-0000-0000-000000000010','processing');

do $$
begin
  begin
    perform public.set_marketplace_order_status('40000000-0000-0000-0000-000000000010','completed');
    raise exception 'Expected invalid status jump to fail';
  exception when invalid_parameter_value then null;
  end;

  perform set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
  begin
    perform public.set_marketplace_order_status('40000000-0000-0000-0000-000000000010','shipped');
    raise exception 'Expected non-owner seller to be rejected';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Buyer cancellation before dispatch restores inventory once, including safe retries.
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',false);
select public.set_marketplace_order_status('40000000-0000-0000-0000-000000000010','cancelled');
select public.set_marketplace_order_status('40000000-0000-0000-0000-000000000010','cancelled');
do $$
begin
  if (select stock from public.products where id='30000000-0000-0000-0000-000000000010') <> 6 then
    raise exception 'Pre-dispatch cancellation must restore stock exactly once';
  end if;
end $$;

-- Seller cancellation after dispatch must not restock the product.
insert into public.marketplace_orders(id, product_id, farmer_id, buyer_id, status, quantity)
values ('40000000-0000-0000-0000-000000000011',
        '30000000-0000-0000-0000-000000000011',
        '20000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'shipped',3);

select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
select set_config('test.manage_orders','true',false);
select public.set_marketplace_order_status('40000000-0000-0000-0000-000000000011','cancelled');
do $$
begin
  if (select stock from public.products where id='30000000-0000-0000-0000-000000000011') <> 10 then
    raise exception 'Post-dispatch cancellation must not restock';
  end if;
  if has_function_privilege('anon','public.set_marketplace_order_status(uuid,text)','EXECUTE') then
    raise exception 'anon must not execute the order status RPC';
  end if;
  if not has_function_privilege('authenticated','public.set_marketplace_order_status(uuid,text)','EXECUTE') then
    raise exception 'authenticated must be granted the order status RPC';
  end if;
  if has_function_privilege('anon','public.snapshot_marketplace_order_seller_organization()','EXECUTE') then
    raise exception 'anon must not execute trigger helper functions';
  end if;
end $$;

\echo 'Marketplace seller organization PostgreSQL integration tests passed.'
