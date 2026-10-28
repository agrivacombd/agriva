-- Allow admins to create audited catalogue entries without inventing product facts.
-- New products are always drafts; admins publish them only after verifying details.
create or replace function public.admin_create_marketplace_product(
  p_name text,
  p_description text,
  p_price numeric,
  p_stock numeric,
  p_commission_percent numeric,
  p_category_slug text,
  p_subcategory_slug text
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  result public.products;
  category_name text;
  subcategory_name text;
  product_slug text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 160 then
    raise exception 'Product name is required';
  end if;
  if p_price is null or p_price <= 0 or p_stock is null or p_stock < 0 then
    raise exception 'Price must be positive and stock must be non-negative';
  end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;
  select c.name, s.name into category_name, subcategory_name
  from public.product_categories c
  join public.product_subcategories s on s.category_slug = c.slug
  where c.slug = trim(p_category_slug) and c.is_active = true
    and s.slug = trim(p_subcategory_slug) and s.is_active = true;
  if category_name is null or subcategory_name is null then
    raise exception 'Category or subcategory does not exist or is inactive';
  end if;

  product_slug := coalesce(nullif(left(trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g')), 90), ''), 'product')
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.products (
    farmer_id, name, slug, description, price, stock,
    reseller_commission_percent, status, category,
    category_slug, subcategory_slug
  ) values (
    auth.uid(), trim(p_name), product_slug, nullif(trim(coalesce(p_description, '')), ''),
    p_price, p_stock, p_commission_percent, 'draft', subcategory_name,
    trim(p_category_slug), trim(p_subcategory_slug)
  ) returning * into result;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'product.created', 'product', result.id,
    jsonb_build_object('name', result.name, 'category_slug', result.category_slug,
      'subcategory_slug', result.subcategory_slug, 'status', result.status));

  return result;
end;
$$;

revoke all on function public.admin_create_marketplace_product(text,text,numeric,numeric,numeric,text,text) from public, anon;
grant execute on function public.admin_create_marketplace_product(text,text,numeric,numeric,numeric,text,text) to authenticated;