-- Prevent direct Data API inserts from spoofing another display name.
-- The account profile name is canonicalized server-side for every opt-in publication.
create or replace function public.crop_feed_canonicalize() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare d record; account_name text;
begin
 select trim(full_name) into account_name from public.profiles where id=new.user_id;
 if account_name is null or char_length(account_name) not between 2 and 60 then raise exception 'Account profile name is required'; end if;
 select crop,location,diagnosis,mime_type into d from public.crop_disease_detections where id=new.detection_id and user_id=new.user_id and status='completed';
 if not found then raise exception 'Not your completed diagnosis'; end if;
 new.display_name:=account_name;
 new.crop:=d.crop; new.district:=d.location;
 new.disease:=coalesce(nullif(d.diagnosis->>'disease',''),'অনিশ্চিত');
 new.confidence:=case when d.diagnosis->>'confidence' in ('low','medium','high') then d.diagnosis->>'confidence' else 'low' end;
 new.image_path:=new.user_id::text || '/' || new.detection_id::text || case d.mime_type when 'image/png' then '.png' when 'image/webp' then '.webp' else '.jpg' end;
 new.published_at:=now(); return new;
end $$;
