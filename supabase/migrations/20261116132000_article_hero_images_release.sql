-- AGRIVA AI article hero and social image storage (idempotent release migration)
alter table public.content_drafts
  add column if not exists hero_image_url text,
  add column if not exists hero_image_alt text,
  add column if not exists hero_image_width integer,
  add column if not exists hero_image_height integer,
  add column if not exists hero_image_license text,
  add column if not exists hero_image_rights_note text,
  add column if not exists hero_image_verified_by uuid,
  add column if not exists hero_image_verified_at timestamptz;

insert into storage.buckets (id,name,public)
values ('article-hero-images','article-hero-images',true)
on conflict (id) do update set public=true;

-- Authorization is based on database-maintained admin role, not user_metadata.
do $$
begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='article_hero_admin_insert') then
  create policy article_hero_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id='article-hero-images' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='article_hero_admin_select') then
  create policy article_hero_admin_select on storage.objects for select to authenticated
  using (bucket_id='article-hero-images' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='article_hero_admin_delete') then
  create policy article_hero_admin_delete on storage.objects for delete to authenticated
  using (bucket_id='article-hero-images' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
 end if;
end $$;
