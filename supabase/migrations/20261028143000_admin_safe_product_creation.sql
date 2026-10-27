-- Secure admin-only product creation for the existing production products schema.
-- Products are always created as drafts; a separate admin review activates them.

create or replace function public.admin_create_product(
  p_name text,
  p_description text,
  p_price numeric,
  p_stock numeric,
  p_commission_percent numeric,
  p_category_slug text default null,
  p_image_url text default null,
  p_brand text default null,
  p_sku text default null
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  result public.products;
  category_name text;
  product_slug text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if nullif(trim(p_name), '') is null or char_length(trim(p_name)) > 160 then
    raise exception 'Product name is required and must be at most 160 characters';
  end if;
  if p_description is not null and char_length(p_description) > 5000 then
    raise exception 'Description must be at most 5000 characters';
  end if;
  if p_price is null or p_price <= 0 or p_stock is null or p_stock < 0 then
    raise exception 'Price must be positive and stock cannot be negative';
  end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;
  if p_image_url is not null and (
    length(p_image_url) > 2048 or p_image_url !~* '^https://'
  ) then
    raise exception 'Image URL must be HTTPS and at most 2048 characters';
  end if;
  if p_brand is not null and char_length(p_brand) > 120 then
    raise exception 'Brand must be at most 120 characters';
  end if;
  if p_sku is not null and char_length(p_sku) > 100 then
    raise exception 'SKU must be at most 100 characters';
  end if;

  if p_category_slug is not null and trim(p_category_slug) <> '' then
    select name into category_name
      from public.product_categories
      where slug = trim(p_category_slug) and is_active = true;
    if category_name is null then
      raise exception 'Category does not exist or is inactive';
    end if;
  end if;

  product_slug := trim(both '-' from regexp_replace(
    lower(trim(p_name)), '[^a-zA-Z0-9]+', '-', 'g'
  ));
  if product_slug = '' then product_slug := 'agriva-product'; end if;
  product_slug := left(product_slug, 70) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

  insert into public.products (
    farmer_id, name, slug, description, price, stock,
    reseller_commission_percent, status, category, category_slug,
    image_url, brand, sku
  ) values (
    auth.uid(), trim(p_name), product_slug,
    nullif(trim(coalesce(p_description, '')), ''),
    p_price, p_stock, p_commission_percent, 'draft',
    category_name, nullif(trim(coalesce(p_category_slug, '')), ''),
    nullif(trim(coalesce(p_image_url, '')), ''),
    nullif(trim(coalesce(p_brand, '')), ''),
    nullif(trim(coalesce(p_sku, '')), '')
  ) returning * into result;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'product.created_draft', 'product', result.id,
    jsonb_build_object(
      'name', result.name,
      'price', result.price,
      'stock', result.stock,
      'status', result.status,
      'category_slug', result.category_slug,
      'has_image', result.image_url is not null
    )
  );

  return result;
end;
$$;

revoke all on function public.admin_create_product(text,text,numeric,numeric,numeric,text,text,text,text) from public, anon;
grant execute on function public.admin_create_product(text,text,numeric,numeric,numeric,text,text,text,text) to authenticated;
