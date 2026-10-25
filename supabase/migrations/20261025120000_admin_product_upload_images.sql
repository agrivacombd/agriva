-- Admin-managed marketplace product creation and public product images.
-- Apply only after reviewing and testing the full migration chain in an isolated Supabase project.

alter table public.products
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create or replace function public.admin_create_product(
  p_name text,
  p_slug text,
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
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;
  if nullif(trim(p_name), '') is null or char_length(trim(p_name)) > 160 then
    raise exception 'Product name is required and must be at most 160 characters';
  end if;
  if nullif(trim(p_slug), '') is null or trim(p_slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid product slug';
  end if;
  if p_description is not null and char_length(p_description) > 5000 then
    raise exception 'Description is too long';
  end if;
  if p_price is null or p_price <= 0 or p_stock is null or p_stock < 0 then
    raise exception 'Price must be positive and stock cannot be negative';
  end if;
  if p_commission_percent is null or p_commission_percent < 0 or p_commission_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;
  if p_image_url is null or trim(p_image_url) = '' or p_image_url not like '%/storage/v1/object/public/product-images/%' then
    raise exception 'A valid public product image is required';
  end if;

  if p_category_slug is not null and trim(p_category_slug) <> '' then
    select name into category_name from public.product_categories
    where slug = trim(p_category_slug) and is_active = true;
    if category_name is null then raise exception 'Category does not exist or is inactive'; end if;
  end if;

  insert into public.products (
    farmer_id, name, slug, description, price, stock, reseller_commission_percent,
    status, moderation_status, category, category_slug, subcategory_slug, image_url
  ) values (
    auth.uid(), trim(p_name), trim(p_slug), nullif(trim(coalesce(p_description, '')), ''),
    p_price, p_stock, p_commission_percent, 'active', 'approved',
    category_name, nullif(trim(coalesce(p_category_slug, '')), ''), null, trim(p_image_url)
  ) returning * into result;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'product.created', 'product', result.id,
    jsonb_build_object('name', result.name, 'price', result.price, 'stock', result.stock, 'status', result.status, 'category_slug', result.category_slug, 'has_image', true));

  return result;
end;
$$;

revoke all on function public.admin_create_product(text,text,text,numeric,numeric,numeric,text,text,text) from public, anon;
grant execute on function public.admin_create_product(text,text,text,numeric,numeric,numeric,text,text,text) to authenticated;
