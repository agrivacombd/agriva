-- One-time, service-role-only bootstrap for the first AGRIVA administrator.
-- The application must separately verify the signed-in email against AGRIVA_OWNER_EMAIL.
create or replace function public.bootstrap_first_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  -- Serialize bootstrap attempts so two requests cannot create separate first admins.
  perform pg_advisory_xact_lock(hashtext('agriva:first-admin-bootstrap'));
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An administrator already exists';
  end if;

  update public.profiles
     set role = 'admin', updated_at = now()
   where id = p_user_id;
  if not found then
    raise exception 'Profile not found; sign up first and retry';
  end if;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (p_user_id, 'admin.first_admin_bootstrapped', 'profile', p_user_id,
          jsonb_build_object('method', 'owner-email-allowlist'));
end;
$$;

revoke all on function public.bootstrap_first_admin(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_first_admin(uuid) to service_role;

-- The category column is required by the existing category assignment RPC and admin UI.
alter table public.products add column if not exists category text;
alter table public.marketplace_orders add column if not exists payment_reference text;
create unique index if not exists marketplace_orders_payment_reference_unique
  on public.marketplace_orders(payment_reference) where payment_reference is not null;

-- Let the verified admin create the first real catalogue items from the console.
create or replace function public.admin_create_product(
  p_name text,
  p_description text,
  p_price numeric,
  p_stock numeric,
  p_commission_percent numeric,
  p_status public.product_status,
  p_category text default null
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  result public.products;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 160 then
    raise exception 'Product name is required and must be at most 160 characters';
  end if;
  if p_price is null or p_price < 0 or p_stock is null or p_stock < 0 then
    raise exception 'Price and stock must be non-negative';
  end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;
  if p_category is not null and nullif(trim(p_category), '') is not null
     and not exists (select 1 from public.product_categories where name = trim(p_category) and is_active) then
    raise exception 'Select an active category';
  end if;

  insert into public.products (
    farmer_id, name, description, price, stock, reseller_commission_percent, status, category
  ) values (
    auth.uid(), trim(p_name), nullif(trim(coalesce(p_description, '')), ''),
    p_price, p_stock, p_commission_percent, coalesce(p_status, 'draft'::public.product_status),
    nullif(trim(coalesce(p_category, '')), '')
  )
  returning * into result;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'product.created', 'product', result.id,
          jsonb_build_object('name', result.name, 'price', result.price, 'stock', result.stock, 'status', result.status));

  return result;
end;
$$;
revoke all on function public.admin_create_product(text, text, numeric, numeric, numeric, public.product_status, text) from public, anon;
grant execute on function public.admin_create_product(text, text, numeric, numeric, numeric, public.product_status, text) to authenticated;
