create table if not exists public.crop_health_feed_slug_registry (slug text primary key, feed_id uuid not null unique);
alter table public.crop_health_feed add column if not exists slug text;
create unique index if not exists crop_health_feed_slug_unique on public.crop_health_feed(slug);
create or replace function public.crop_feed_make_slug(p_crop text,p_disease text,p_id uuid) returns text language plpgsql immutable as $$
declare crop_key text; disease_key text;
begin
 crop_key:=case when lower(coalesce(p_crop,'')) ~ 'ধান|rice' then 'rice' when lower(coalesce(p_crop,'')) ~ 'টমেটো|tomato' then 'tomato' when lower(coalesce(p_crop,'')) ~ 'আলু|potato' then 'potato' when lower(coalesce(p_crop,'')) ~ 'গম|wheat' then 'wheat' when lower(coalesce(p_crop,'')) ~ 'মরিচ|chili|chilli' then 'chili' else regexp_replace(lower(coalesce(p_crop,'')),'[^a-z0-9]+','-','g') end;
 disease_key:=case when lower(coalesce(p_disease,'')) ~ 'ব্লাস্ট|blast' then 'blast' when lower(coalesce(p_disease,'')) ~ 'লিফ কার্ল|পাতা কুঁকড়ে|leaf curl' then 'leaf-curl' when lower(coalesce(p_disease,'')) ~ 'লেট ব্লাইট|late blight' then 'late-blight' when lower(coalesce(p_disease,'')) ~ 'পচা|rot' then 'rot' else regexp_replace(lower(coalesce(p_disease,'')),'[^a-z0-9]+','-','g') end;
 crop_key:=trim(both '-' from left(crop_key,32)); disease_key:=trim(both '-' from left(disease_key,40));
 if crop_key='' then crop_key:='crop'; end if;
 if disease_key='' then disease_key:='possible-disease'; end if;
 return crop_key||'-'||disease_key||'-'||left(replace(p_id::text,'-',''),12);
end $$;
create or replace function public.crop_feed_assign_slug() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare candidate text;
begin
 if tg_op='UPDATE' then
   if new.slug is distinct from old.slug then raise exception 'Published slug cannot be changed'; end if;
   return new;
 end if;
 candidate:=public.crop_feed_make_slug(new.crop,new.disease,new.id);
 insert into public.crop_health_feed_slug_registry(slug,feed_id) values(candidate,new.id);
 new.slug:=candidate;
 return new;
end $$;
drop trigger if exists crop_feed_assign_slug_before_insert on public.crop_health_feed;
create trigger crop_feed_assign_slug_before_insert before insert on public.crop_health_feed for each row execute function public.crop_feed_assign_slug();
drop trigger if exists crop_feed_lock_slug_before_update on public.crop_health_feed;
create trigger crop_feed_lock_slug_before_update before update on public.crop_health_feed for each row execute function public.crop_feed_assign_slug();
do $$ declare r record; candidate text; begin
 for r in select id,crop,disease from public.crop_health_feed where slug is null loop
 candidate:=public.crop_feed_make_slug(r.crop,r.disease,r.id);
 insert into public.crop_health_feed_slug_registry(slug,feed_id) values(candidate,r.id) on conflict do nothing;
 update public.crop_health_feed set slug=candidate where id=r.id;
 end loop;
end $$;
alter table public.crop_health_feed alter column slug set not null;
revoke all on public.crop_health_feed_slug_registry from anon,authenticated;
