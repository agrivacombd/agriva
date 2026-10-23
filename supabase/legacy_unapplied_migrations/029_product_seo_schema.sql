-- Per-product SEO fields and structured-data support for AGRIVA catalogue.
alter table public.products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text,
  add column if not exists image_url text,
  add column if not exists brand text,
  add column if not exists sku text;

create unique index if not exists products_sku_unique
  on public.products (sku) where sku is not null and length(trim(sku)) > 0;

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_seo_title_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_seo_title_length check (seo_title is null or length(seo_title) <= 70);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_seo_description_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_seo_description_length check (seo_description is null or length(seo_description) <= 170);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_seo_keywords_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_seo_keywords_length check (seo_keywords is null or length(seo_keywords) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_image_url_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_image_url_length
      check (image_url is null or (length(image_url) <= 2048 and image_url ~* '^https://'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_brand_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_brand_length check (brand is null or length(brand) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_sku_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_sku_length check (sku is null or length(sku) <= 100);
  end if;
end;
$constraints$;

-- Keep the original RPC signatures intact for compatibility. SEO-enabled overloads are
-- used by the current admin UI and remain protected by the same admin check/audit log.
create or replace function public.admin_create_product(
  p_name text, p_description text, p_price numeric, p_stock numeric,
  p_commission_percent numeric, p_status public.product_status, p_category text,
  p_seo_title text, p_seo_description text, p_seo_keywords text,
  p_image_url text, p_brand text, p_sku text
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare result public.products;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 160 then raise exception 'Product name is required and must be at most 160 characters'; end if;
  if p_price is null or p_price < 0 or p_stock is null or p_stock < 0 then raise exception 'Price and stock must be non-negative'; end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then raise exception 'Commission must be between 0 and 100'; end if;
  if p_status not in ('draft','active','paused','sold_out') then raise exception 'Invalid product status'; end if;
  if length(coalesce(p_seo_title,'')) > 70 or length(coalesce(p_seo_description,'')) > 170 or length(coalesce(p_seo_keywords,'')) > 500 then raise exception 'SEO field length exceeded'; end if;
  if length(coalesce(p_image_url,'')) > 2048 or (nullif(trim(p_image_url),'') is not null and p_image_url !~* '^https://') then raise exception 'Image URL must use HTTPS'; end if;
  if length(coalesce(p_brand,'')) > 120 or length(coalesce(p_sku,'')) > 100 then raise exception 'Brand or SKU too long'; end if;
  if nullif(trim(p_sku),'') is not null and exists(select 1 from public.products where sku = trim(p_sku)) then raise exception 'SKU already exists'; end if;
  if p_category is not null and nullif(trim(p_category),'') is not null and not exists(select 1 from public.product_categories where name=trim(p_category) and is_active) then raise exception 'Select an active category'; end if;
  insert into public.products(farmer_id,name,description,price,stock,reseller_commission_percent,status,category,seo_title,seo_description,seo_keywords,image_url,brand,sku)
  values(auth.uid(),trim(p_name),nullif(trim(coalesce(p_description,'')),''),p_price,p_stock,p_commission_percent,p_status,nullif(trim(coalesce(p_category,'')),''),nullif(trim(coalesce(p_seo_title,'')),''),nullif(trim(coalesce(p_seo_description,'')),''),nullif(trim(coalesce(p_seo_keywords,'')),''),nullif(trim(coalesce(p_image_url,'')),''),nullif(trim(coalesce(p_brand,'')),''),nullif(trim(coalesce(p_sku,'')),''))
  returning * into result;
  insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'product.created','product',result.id,jsonb_build_object('name',result.name,'price',result.price,'stock',result.stock,'status',result.status,'seo_configured',result.seo_title is not null or result.seo_description is not null));
  return result;
end;
$$;
revoke all on function public.admin_create_product(text,text,numeric,numeric,numeric,public.product_status,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.admin_create_product(text,text,numeric,numeric,numeric,public.product_status,text,text,text,text,text,text,text) to authenticated;

create or replace function public.admin_update_product(
  p_product_id uuid, p_name text, p_description text, p_price numeric, p_stock numeric,
  p_commission_percent numeric, p_status public.product_status, p_category text,
  p_seo_title text, p_seo_description text, p_seo_keywords text,
  p_image_url text, p_brand text, p_sku text
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare result public.products;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_product_id is null or nullif(trim(p_name),'') is null or length(trim(p_name)) > 160 then raise exception 'Product ID and valid name are required'; end if;
  if p_price is null or p_price < 0 or p_stock is null or p_stock < 0 then raise exception 'Price and stock must be non-negative'; end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then raise exception 'Commission must be between 0 and 100'; end if;
  if length(coalesce(p_seo_title,'')) > 70 or length(coalesce(p_seo_description,'')) > 170 or length(coalesce(p_seo_keywords,'')) > 500 then raise exception 'SEO field length exceeded'; end if;
  if length(coalesce(p_image_url,'')) > 2048 or (nullif(trim(p_image_url),'') is not null and p_image_url !~* '^https://') then raise exception 'Image URL must use HTTPS'; end if;
  if length(coalesce(p_brand,'')) > 120 or length(coalesce(p_sku,'')) > 100 then raise exception 'Brand or SKU too long'; end if;
  if nullif(trim(p_sku),'') is not null and exists(select 1 from public.products where sku=trim(p_sku) and id<>p_product_id) then raise exception 'SKU already exists'; end if;
  if p_category is not null and nullif(trim(p_category),'') is not null and not exists(select 1 from public.product_categories where name=trim(p_category) and is_active) then raise exception 'Select an active category'; end if;
  update public.products set name=trim(p_name),description=nullif(trim(coalesce(p_description,'')),''),price=p_price,stock=p_stock,
    reseller_commission_percent=p_commission_percent,status=p_status,category=nullif(trim(coalesce(p_category,'')),''),
    seo_title=nullif(trim(coalesce(p_seo_title,'')),''),seo_description=nullif(trim(coalesce(p_seo_description,'')),''),
    seo_keywords=nullif(trim(coalesce(p_seo_keywords,'')),''),image_url=nullif(trim(coalesce(p_image_url,'')),''),
    brand=nullif(trim(coalesce(p_brand,'')),''),sku=nullif(trim(coalesce(p_sku,'')),''),
    updated_at=now()
  where id=p_product_id returning * into result;
  if not found then raise exception 'Product not found'; end if;
  insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'product.updated','product',result.id,jsonb_build_object('name',result.name,'price',result.price,'stock',result.stock,'status',result.status,'seo_configured',result.seo_title is not null or result.seo_description is not null));
  return result;
end;
$$;
revoke all on function public.admin_update_product(uuid,text,text,numeric,numeric,numeric,public.product_status,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.admin_update_product(uuid,text,text,numeric,numeric,numeric,public.product_status,text,text,text,text,text,text,text) to authenticated;
