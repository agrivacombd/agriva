-- AGRIVA Super Admin: audited product maintenance and limited user-role management.
-- Admin assignment is deliberately excluded from the self-service console to prevent privilege escalation.

create or replace function public.admin_update_product(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_stock numeric,
  p_commission_percent numeric,
  p_status public.product_status
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.products;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;
  if p_product_id is null or nullif(trim(p_name), '') is null then
    raise exception 'Product ID and name are required';
  end if;
  if p_price is null or p_price < 0 or p_stock is null or p_stock < 0 then
    raise exception 'Price and stock must be non-negative';
  end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;

  update public.products
  set name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      price = p_price,
      stock = p_stock,
      reseller_commission_percent = p_commission_percent,
      status = p_status,
      updated_at = now()
  where id = p_product_id
  returning * into result;

  if not found then raise exception 'Product not found'; end if;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'product.updated', 'product', result.id,
    jsonb_build_object('name', result.name, 'price', result.price, 'stock', result.stock, 'status', result.status));

  return result;
end;
$$;
grant execute on function public.admin_update_product(uuid,text,text,numeric,numeric,numeric,public.product_status) to authenticated;

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.user_role
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  previous_role public.user_role;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;
  if p_user_id is null or p_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;
  if p_role not in ('farmer', 'reseller') then
    raise exception 'Admin role changes require a separate privileged process';
  end if;

  select role into previous_role from public.profiles where id = p_user_id for update;
  if not found then raise exception 'User not found'; end if;

  update public.profiles set role = p_role, updated_at = now()
  where id = p_user_id returning * into result;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'user.role_changed', 'profile', result.id,
    jsonb_build_object('from', previous_role, 'to', result.role));

  return result;
end;
$$;
grant execute on function public.admin_set_user_role(uuid,public.user_role) to authenticated;

drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles for select using (public.is_admin());

drop policy if exists "products_admin_read" on public.products;
create policy "products_admin_read" on public.products for select using (public.is_admin());
