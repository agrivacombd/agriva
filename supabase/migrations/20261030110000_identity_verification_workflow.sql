-- Identity verification workflow: private evidence storage, review audit trail and profile synchronization.
-- Additive; apply only to an isolated test project first.
create table if not exists public.gardener_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
 district text, gardening_types text[] not null default '{}', experience_note text,
 evidence_paths text[] not null default '{}', reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.module_access_application_events (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.module_access_applications(id) on delete cascade,
 actor_id uuid references auth.users(id),
 event_type text not null check (event_type in ('submitted','approved','rejected','withdrawn')),
 note text, created_at timestamptz not null default now()
);
create index if not exists module_access_events_application_idx on public.module_access_application_events(application_id,created_at desc);
alter table public.gardener_profiles enable row level security;
alter table public.module_access_application_events enable row level security;
drop policy if exists gardener_profiles_select on public.gardener_profiles;
create policy gardener_profiles_select on public.gardener_profiles for select to authenticated using (user_id=(select auth.uid()) or public.is_admin());
drop policy if exists gardener_profiles_insert on public.gardener_profiles;
create policy gardener_profiles_insert on public.gardener_profiles for insert to authenticated with check (user_id=(select auth.uid()) and verification_status='pending' and reviewed_by is null and reviewed_at is null);
drop policy if exists module_access_events_select on public.module_access_application_events;
create policy module_access_events_select on public.module_access_application_events for select to authenticated using (
 exists (select 1 from public.module_access_applications a where a.id=application_id and (a.user_id=(select auth.uid()) or public.is_admin()))
);
revoke all on public.gardener_profiles,public.module_access_application_events from public,anon;
revoke update,delete,truncate,references,trigger on public.gardener_profiles,public.module_access_application_events from authenticated;
grant select,insert on public.gardener_profiles to authenticated;
grant select on public.module_access_application_events to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('identity-verification','identity-verification',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','application/pdf'];
drop policy if exists identity_evidence_insert_own on storage.objects;
create policy identity_evidence_insert_own on storage.objects for insert to authenticated with check (
 bucket_id='identity-verification' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists identity_evidence_select_own_or_admin on storage.objects;
create policy identity_evidence_select_own_or_admin on storage.objects for select to authenticated using (
 bucket_id='identity-verification' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin())
);
drop policy if exists identity_evidence_delete_own_pending on storage.objects;
create policy identity_evidence_delete_own_pending on storage.objects for delete to authenticated using (
 bucket_id='identity-verification' and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists (
  select 1 from public.module_access_applications a where a.user_id=(select auth.uid())
  and a.status in ('pending','under_review')
  and coalesce(a.applicant_data->'evidence_paths','[]'::jsonb) ? name
 )
);
create unique index if not exists organizations_one_pending_per_owner_idx on public.organizations(owner_id) where status='pending';
create unique index if not exists module_access_one_open_application_idx
 on public.module_access_applications(user_id,module) where status in ('pending','under_review');
alter table public.module_access_applications add constraint module_access_applicant_data_object_check
 check (jsonb_typeof(applicant_data)='object' and pg_column_size(applicant_data)<=32768);
drop policy if exists module_access_applications_admin_update on public.module_access_applications;
revoke update,delete,truncate,references,trigger on public.module_access_applications from authenticated;
grant select,insert on public.module_access_applications to authenticated;

create or replace function public.sync_module_identity_review()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,pg_temp
as $function$
declare v_data jsonb;
begin
 if tg_op='INSERT' then
  insert into public.module_access_application_events(application_id,actor_id,event_type) values(new.id,new.user_id,'submitted');
  return new;
 end if;
 if old.status is distinct from new.status and new.status in ('approved','rejected') then
  v_data:=coalesce(new.applicant_data,'{}'::jsonb);
  if new.module='plant_market' then
   insert into public.gardener_profiles(user_id,verification_status,district,gardening_types,experience_note,evidence_paths,reviewed_by,reviewed_at)
   values(new.user_id,case when new.status='approved' then 'verified' else 'rejected' end,nullif(v_data->>'district',''),
    case when jsonb_typeof(v_data->'gardening_types')='array' then array(select jsonb_array_elements_text(v_data->'gardening_types')) else '{}'::text[] end,
    nullif(v_data->>'experience_note',''),
    case when jsonb_typeof(v_data->'evidence_paths')='array' then array(select jsonb_array_elements_text(v_data->'evidence_paths')) else '{}'::text[] end,
    new.reviewed_by,new.reviewed_at)
   on conflict(user_id) do update set verification_status=excluded.verification_status,district=excluded.district,
    gardening_types=excluded.gardening_types,experience_note=excluded.experience_note,evidence_paths=excluded.evidence_paths,
    reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at,updated_at=now();
  elsif new.module='sell_harvest' then
   insert into public.farmer_profiles(user_id,verification_status,district,upazila,farming_types,evidence,reviewed_by,reviewed_at)
   values(new.user_id,case when new.status='approved' then 'verified' else 'rejected' end,nullif(v_data->>'district',''),nullif(v_data->>'upazila',''),
    case when jsonb_typeof(v_data->'farming_types')='array' then array(select jsonb_array_elements_text(v_data->'farming_types')) else '{}'::text[] end,
    jsonb_build_object('farm_description',coalesce(v_data->>'farm_description',''),'evidence_paths',coalesce(v_data->'evidence_paths','[]'::jsonb)),
    new.reviewed_by,new.reviewed_at)
   on conflict(user_id) do update set verification_status=excluded.verification_status,district=excluded.district,
    upazila=excluded.upazila,farming_types=excluded.farming_types,evidence=excluded.evidence,
    reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at,updated_at=now();
  end if;
  insert into public.module_access_application_events(application_id,actor_id,event_type,note)
   values(new.id,new.reviewed_by,new.status,new.review_note);
 end if;
 return new;
end;
$function$;
drop trigger if exists module_access_application_identity_sync on public.module_access_applications;
create trigger module_access_application_identity_sync after insert or update of status on public.module_access_applications
 for each row execute function public.sync_module_identity_review();
revoke all on function public.sync_module_identity_review() from public,anon,authenticated;
comment on table public.gardener_profiles is 'Verified hobby/ornamental gardener identity for Plant Market seller access.';
comment on table public.module_access_application_events is 'Append-only audit trail for identity and module-access application lifecycle.';
