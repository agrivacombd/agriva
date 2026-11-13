-- Crop Health Feed: only explicitly shared analysis is public. Original diagnosis and private photos remain protected.
create table if not exists public.crop_health_feed (
 id uuid primary key default gen_random_uuid(),
 detection_id uuid not null unique references public.crop_disease_detections(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 60),
 crop text not null, district text, disease text not null,
 confidence text not null check (confidence in ('low','medium','high')),
 image_path text, published_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index if not exists crop_health_feed_recent_idx on public.crop_health_feed(published_at desc);
create index if not exists crop_health_feed_analytics_idx on public.crop_health_feed(crop,district,published_at desc);
alter table public.crop_health_feed enable row level security;
create policy "Anyone can read explicitly published feed" on public.crop_health_feed for select to anon,authenticated using (true);
create policy "Owner can opt in own analysis" on public.crop_health_feed for insert to authenticated with check ((select auth.uid())=user_id and exists (select 1 from public.crop_disease_detections d where d.id=detection_id and d.user_id=(select auth.uid()) and d.status='completed'));
create policy "Owner can unpublish" on public.crop_health_feed for delete to authenticated using ((select auth.uid())=user_id);
grant select on public.crop_health_feed to anon,authenticated;
grant insert,delete on public.crop_health_feed to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('crop-health-feed','crop-health-feed',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Read consented feed photos" on storage.objects for select to anon,authenticated using (bucket_id='crop-health-feed');
create policy "Upload own consented feed photos" on storage.objects for insert to authenticated with check (bucket_id='crop-health-feed' and (storage.foldername(name))[1]=(select auth.uid())::text and exists (select 1 from public.crop_health_feed f where f.user_id=(select auth.uid()) and f.image_path=name));
create policy "Remove own feed photos" on storage.objects for delete to authenticated using (bucket_id='crop-health-feed' and (storage.foldername(name))[1]=(select auth.uid())::text);
create or replace function public.crop_feed_canonicalize() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare d record;
begin
 select crop,location,diagnosis,mime_type into d from public.crop_disease_detections where id=new.detection_id and user_id=new.user_id and status='completed';
 if not found then raise exception 'Not your completed diagnosis'; end if;
 new.crop:=d.crop; new.district:=d.location;
 new.disease:=coalesce(nullif(d.diagnosis->>'disease',''),'অনিশ্চিত');
 new.confidence:=case when d.diagnosis->>'confidence' in ('low','medium','high') then d.diagnosis->>'confidence' else 'low' end;
 new.image_path:=new.user_id::text || '/' || new.detection_id::text || case d.mime_type when 'image/png' then '.png' when 'image/webp' then '.webp' else '.jpg' end;
 new.published_at:=now(); return new;
end $$;
create trigger crop_feed_canonicalize_before_insert before insert on public.crop_health_feed for each row execute function public.crop_feed_canonicalize();
