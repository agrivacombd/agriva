-- Retail launch: public product image bucket and SEO image alt text.
-- This migration is branch-only and must be reviewed before production application.

alter table public.products add column if not exists image_alt text;

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_image_alt_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_image_alt_length
      check (image_alt is null or length(image_alt) <= 180);
  end if;
end;
$constraints$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 3145728, array['image/webp'])
on conflict (id) do update
set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/webp'];

drop policy if exists "Public can read AGRIVA product images" on storage.objects;
create policy "Public can read AGRIVA product images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Super Admin can upload AGRIVA product images" on storage.objects;
create policy "Super Admin can upload AGRIVA product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (select auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Super Admin can update AGRIVA product images" on storage.objects;
create policy "Super Admin can update AGRIVA product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'product-images'
  and (select auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'product-images'
  and (select auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Super Admin can delete AGRIVA product images" on storage.objects;
create policy "Super Admin can delete AGRIVA product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and (select auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
