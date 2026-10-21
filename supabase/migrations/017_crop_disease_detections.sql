-- Crop disease photo analysis: private image storage + per-user history.
create table if not exists public.crop_disease_detections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  crop text not null,
  location text,
  symptoms text,
  status text not null default 'completed' check (status in ('completed')),
  diagnosis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists crop_disease_detections_user_created_idx
  on public.crop_disease_detections (user_id, created_at desc);

alter table public.crop_disease_detections enable row level security;
grant select, insert, delete on public.crop_disease_detections to authenticated;

drop policy if exists "Users can read their crop disease detections" on public.crop_disease_detections;
create policy "Users can read their crop disease detections"
  on public.crop_disease_detections for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their crop disease detections" on public.crop_disease_detections;
create policy "Users can create their crop disease detections"
  on public.crop_disease_detections for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their crop disease detections" on public.crop_disease_detections;
create policy "Users can delete their crop disease detections"
  on public.crop_disease_detections for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crop-disease-photos', 'crop-disease-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Users can upload their crop disease photos" on storage.objects;
create policy "Users can upload their crop disease photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'crop-disease-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can read their crop disease photos" on storage.objects;
create policy "Users can read their crop disease photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'crop-disease-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their crop disease photos" on storage.objects;
create policy "Users can delete their crop disease photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'crop-disease-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
