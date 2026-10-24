-- Audited admin-created product listings. New listings remain draft until reviewed.
alter table public.products add column if not exists image_url text;
create or replace function public.admin_create_product(
  p_farmer_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_stock numeric,
  p_commission_percent numeric,
  p_category_slug text,
  p_subcategory_slug text,
  p_image_url text
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  result public.products;
  category_name text;
  generated_slug text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;
  if p_farmer_id is null or not exists(select 1 from public.profiles where id=p_farmer_id and role='farmer') then
    raise exception 'Select a valid farmer account';
  end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name)) > 160 then
    raise exception 'Product name is required and must be 160 characters or fewer';
  end if;
  if p_price is null or p_price < 0 or p_stock is null or p_stock < 0 or p_stock <> trunc(p_stock) then
    raise exception 'Price must be non-negative and stock must be a non-negative whole number';
  end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;
  if p_image_url is null or p_image_url !~ '^https://[^/]+/storage/v1/object/public/product-images/' then
    raise exception 'A valid product image is required';
  end if;
  if p_category_slug is null or not exists(select 1 from public.product_categories where slug=p_category_slug and is_active) then
    raise exception 'Select an active category';
  end if;
  select name into category_name from public.product_categories where slug=p_category_slug;
  if p_subcategory_slug is not null and not exists(
    select 1 from public.product_subcategories
    where category_slug=p_category_slug and slug=p_subcategory_slug and is_active
  ) then raise exception 'Select a valid subcategory'; end if;

  generated_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  generated_slug := coalesce(nullif(generated_slug,''),'product') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,8);

  insert into public.products(
    farmer_id,name,slug,description,price,stock,reseller_commission_percent,
    category,category_slug,subcategory_slug,image_url,status
  ) values (
    p_farmer_id,trim(p_name),generated_slug,nullif(trim(coalesce(p_description,'')),''),
    p_price,p_stock,p_commission_percent,category_name,p_category_slug,nullif(trim(coalesce(p_subcategory_slug,'')),''),
    nullif(trim(coalesce(p_image_url,'')),''),
    'draft'
  ) returning * into result;

  insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'product.created','product',result.id,
    jsonb_build_object('name',result.name,'farmer_id',result.farmer_id,'category_slug',result.category_slug,
      'subcategory_slug',result.subcategory_slug,'status',result.status));
  return result;
end;
$$;
revoke all on function public.admin_create_product(uuid,text,text,numeric,numeric,numeric,text,text,text) from public, anon;
grant execute on function public.admin_create_product(uuid,text,text,numeric,numeric,numeric,text,text,text) to authenticated;
