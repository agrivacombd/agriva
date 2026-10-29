-- Let authenticated farmers upload their own product photos to the existing public product-images bucket.
-- Object paths must start with the authenticated user's UUID. The bucket already restricts
-- uploads to JPEG/PNG/WebP and 5 MiB; this policy adds the missing farmer authorization path.
drop policy if exists "Farmers can upload own product images" on storage.objects;
create policy "Farmers can upload own product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'farmer'
  )
);
