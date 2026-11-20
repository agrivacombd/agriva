\set ON_ERROR_STOP on

-- Runtime integration tests against the complete AGRIVA migration chain.
-- Runs only on the disposable Supabase local database in GitHub Actions.

do $$
begin
  if current_setting('server_version_num')::integer < 140000 then
    raise exception 'PostgreSQL 14+ is required';
  end if;
  if to_regclass('public.organizations') is null
     or to_regclass('public.user_module_grants') is null
     or to_regclass('public.products') is null
     or to_regclass('public.marketplace_orders') is null
     or to_regclass('public.reseller_commissions') is null then
    raise exception 'Required AGRIVA marketplace schema objects are missing';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='products'
      and column_name='seller_organization_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='marketplace_orders'
      and column_name='seller_organization_id'
  ) then
    raise exception 'Seller organization snapshot columns are missing';
  end if;
end $$;

-- Auth inserts exercise the real auth.users -> public.profiles signup trigger.
insert into auth.users (id, email, raw_user_meta_data) values
('20000000-0000-0000-0000-000000000001','schema-seller@example.test','{"full_name":"Schema Seller","role":"farmer"}'),
('20000000-0000-0000-0000-000000000002','schema-other-seller@example.test','{"full_name":"Other Seller","role":"farmer"}'),
('50000000-0000-0000-0000-000000000001','schema-buyer@example.test','{"full_name":"Schema Buyer","role":"farmer"}');

do $$
begin
  if (select count(*) from public.profiles where id in (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001'
  )) <> 3 then
    raise exception 'Supabase Auth profile trigger did not create all test profiles';
  end if;
end $$;

insert into public.organizations (id, owner_id, name, organization_type, status) values
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Schema Seller Org','company','verified'),
('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Second Seller Org','company','verified'),
('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','Other Seller Org','company','verified'),
('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','Pending Seller Org','company','pending');

insert into public.user_module_grants
  (user_id,module,permission,scope_type,scope_id,reason)
values
  ('20000000-0000-0000-0000-000000000001','marketplace','manage_orders','organization','10000000-0000-0000-0000-000000000001','Disposable full-schema CI fixture');

-- Product creation must reject an organization owned by another seller or
-- an organization that has not been verified.
do $$
begin
  begin
    insert into public.products(id,farmer_id,name,price,stock,seller_organization_id)
    values ('30000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001','Wrong owner fixture',10,5,
      '10000000-0000-0000-0000-000000000003');
    raise exception 'Expected product insert with another seller organization to fail';
  exception when check_violation then null;
  end;

  begin
    insert into public.products(id,farmer_id,name,price,stock,seller_organization_id)
    values ('30000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000001','Unverified org fixture',10,5,
      '10000000-0000-0000-0000-000000000004');
    raise exception 'Expected product insert with an unverified organization to fail';
  exception when check_violation then null;
  end;
end $$;

-- Stock is already reduced as it would be after checkout.
insert into public.products
  (id,farmer_id,name,price,stock,status,seller_organization_id)
values
  ('30000000-0000-0000-0000-000000000010',
   '20000000-0000-0000-0000-000000000001','Full schema seller product A',10,8,'active',
   '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000011',
   '20000000-0000-0000-0000-000000000001','Full schema seller product B',10,7,'active',
   '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000012',
   '20000000-0000-0000-0000-000000000001','Legacy unmapped product',10,4,'active',null);

-- The trigger must ignore a client-supplied organization and snapshot the
-- product's verified organization instead.
insert into public.marketplace_orders
  (id,product_id,farmer_id,buyer_id,quantity,unit_price,total_amount,status,seller_organization_id)
values
  ('40000000-0000-0000-0000-000000000010',
   '30000000-0000-0000-0000-000000000010',
   '20000000-0000-0000-0000-000000000001',
   '50000000-0000-0000-0000-000000000001',2,10,20,'pending',
   '10000000-0000-0000-0000-000000000003');

do $$
begin
  if (select seller_organization_id from public.marketplace_orders
      where id='40000000-0000-0000-0000-000000000010')
      <> '10000000-0000-0000-0000-000000000001'::uuid then
    raise exception 'Order did not snapshot the product organization';
  end if;

  begin
    update public.products
      set seller_organization_id='10000000-0000-0000-0000-000000000002'
      where id='30000000-0000-0000-0000-000000000010';
    raise exception 'Expected organization reassignment after order creation to fail';
  exception when check_violation then null;
  end;

  begin
    insert into public.marketplace_orders
      (id,product_id,farmer_id,buyer_id,quantity,unit_price,total_amount,status)
    values
      ('40000000-0000-0000-0000-000000000012',
       '30000000-0000-0000-0000-000000000012',
       '20000000-0000-0000-0000-000000000001',
       '50000000-0000-0000-0000-000000000001',1,10,10,'pending');
    raise exception 'Expected checkout for legacy product without organization to fail';
  exception when check_violation then null;
  end;
end $$;

-- Real has_module_access() and is_admin() are exercised through the RPC.
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
select public.set_marketplace_order_status(
  '40000000-0000-0000-0000-000000000010','processing'
);
select public.set_marketplace_order_status(
  '40000000-0000-0000-0000-000000000010','processing'
);

do $$
begin
  begin
    perform public.set_marketplace_order_status(
      '40000000-0000-0000-0000-000000000010','completed'
    );
    raise exception 'Expected invalid forward status jump to fail';
  exception when invalid_parameter_value then null;
  end;

  perform set_config('request.jwt.claim.sub',
    '20000000-0000-0000-0000-000000000002',true);
  begin
    perform public.set_marketplace_order_status(
      '40000000-0000-0000-0000-000000000010','shipped'
    );
    raise exception 'Expected another seller to be denied';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Buyer cancellation before dispatch restores inventory exactly once.
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',false);
select public.set_marketplace_order_status(
  '40000000-0000-0000-0000-000000000010','cancelled'
);
select public.set_marketplace_order_status(
  '40000000-0000-0000-0000-000000000010','cancelled'
);

do $$
begin
  if (select stock from public.products
      where id='30000000-0000-0000-0000-000000000010') <> 10 then
    raise exception 'Pre-dispatch cancellation must restore stock exactly once';
  end if;
end $$;

-- Post-dispatch seller cancellation must not restore inventory.
insert into public.marketplace_orders
  (id,product_id,farmer_id,buyer_id,quantity,unit_price,total_amount,status)
values
  ('40000000-0000-0000-0000-000000000011',
   '30000000-0000-0000-0000-000000000011',
   '20000000-0000-0000-0000-000000000001',
   '50000000-0000-0000-0000-000000000001',3,10,30,'shipped');

select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
select public.set_marketplace_order_status(
  '40000000-0000-0000-0000-000000000011','cancelled'
);

do $$
begin
  if (select stock from public.products
      where id='30000000-0000-0000-0000-000000000011') <> 7 then
    raise exception 'Post-dispatch cancellation must not restock inventory';
  end if;
  if has_function_privilege('anon',
       'public.set_marketplace_order_status(uuid,text)','EXECUTE') then
    raise exception 'anon must not execute the Marketplace order status RPC';
  end if;
  if not has_function_privilege('authenticated',
       'public.set_marketplace_order_status(uuid,text)','EXECUTE') then
    raise exception 'authenticated must be granted the Marketplace order status RPC';
  end if;
  if has_function_privilege('anon',
       'public.snapshot_marketplace_order_seller_organization()','EXECUTE') then
    raise exception 'anon must not execute the order snapshot trigger helper';
  end if;
end $$;

\echo 'Full AGRIVA schema migration replay and Marketplace seller-organization runtime tests passed.'
