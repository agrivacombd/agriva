-- AGRIVA Jobs: agriculture-focused hiring marketplace.
-- Apply only through the reviewed migration rollout; not executed against production here.
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id) on delete cascade,\n  employer_name text not null check (char_length(trim(employer_name)) between 2 and 160),
  title text not null check (char_length(trim(title)) between 8 and 160),
  slug text not null unique,
  description text not null check (char_length(trim(description)) between 40 and 12000),
  job_type text not null check (job_type in ('one-time','part-time','full-time')),
  category_slug text not null default 'farm-labor' check (category_slug in ('farm-labor','farm-management','machinery','livestock','agronomy','sales','processing','other')),
  skills text[] not null default '{}',
  district text not null,
  upazila text not null,
  union_name text,
  address_hint text,
  latitude double precision,
  longitude double precision,
  location_is_approximate boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  schedule_text text,
  compensation_type text not null check (compensation_type in ('daily','hourly','monthly','per-task','negotiable')),
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_currency char(3) not null default 'BDT',
  workers_needed integer check (workers_needed is null or workers_needed between 1 and 10000),
  experience_level text check (experience_level is null or experience_level in ('any','entry','experienced','skilled')),
  education_requirement text,
  application_deadline timestamptz,
  contact_method text not null default 'platform' check (contact_method in ('platform','phone','both')),
  contact_phone text,
  status text not null default 'pending' check (status in ('draft','pending','published','paused','filled','expired','rejected')),
  moderation_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180)),
  check (salary_min is null or salary_min >= 0),
  check (salary_max is null or salary_max >= 0),
  check (salary_min is null or salary_max is null or salary_max >= salary_min),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (job_type <> 'one-time' or starts_at is not null),
  check (contact_method = 'platform' or contact_phone is not null)
);

create index if not exists job_posts_public_search_idx
  on public.job_posts (status, job_type, district, upazila, published_at desc);
create index if not exists job_posts_employer_idx
  on public.job_posts (employer_id, created_at desc);
create index if not exists job_posts_deadline_idx
  on public.job_posts (application_deadline) where status = 'published';

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  cover_note text check (cover_note is null or char_length(cover_note) <= 3000),
  experience_summary text check (experience_summary is null or char_length(experience_summary) <= 3000),
  status text not null default 'submitted' check (status in ('submitted','shortlisted','contacted','hired','declined','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
create index if not exists job_applications_job_idx on public.job_applications (job_id, created_at desc);
create index if not exists job_applications_candidate_idx on public.job_applications (candidate_id, created_at desc);

alter table public.job_posts enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "Published jobs are publicly readable" on public.job_posts;
create policy "Published jobs are publicly readable" on public.job_posts
  for select to anon, authenticated
  using (
    status = 'published'
    and (application_deadline is null or application_deadline > now())
  );

drop policy if exists "Employers can read their own jobs" on public.job_posts;
create policy "Employers can read their own jobs" on public.job_posts
  for select to authenticated using (employer_id = (select auth.uid()));

drop policy if exists "Authenticated users can create own job drafts" on public.job_posts;
create policy "Authenticated users can create own job drafts" on public.job_posts
  for insert to authenticated with check (
    employer_id = (select auth.uid()) and status in ('draft','pending')
  );

drop policy if exists "Employers can edit own unpublished jobs" on public.job_posts;
create policy "Employers can edit own unpublished jobs" on public.job_posts
  for update to authenticated using (
    employer_id = (select auth.uid()) and status in ('draft','pending','paused')
  ) with check (
    employer_id = (select auth.uid()) and status in ('draft','pending','paused')
  );

drop policy if exists "Candidates can read own applications" on public.job_applications;
create policy "Candidates can read own applications" on public.job_applications
  for select to authenticated using (candidate_id = (select auth.uid()));

drop policy if exists "Employers can read applications for own jobs" on public.job_applications;
create policy "Employers can read applications for own jobs" on public.job_applications
  for select to authenticated using (
    exists (select 1 from public.job_posts j where j.id = job_id and j.employer_id = (select auth.uid()))
  );

drop policy if exists "Candidates can apply to published jobs" on public.job_applications;
create policy "Candidates can apply to published jobs" on public.job_applications
  for insert to authenticated with check (
    candidate_id = (select auth.uid())
    and exists (
      select 1 from public.job_posts j
      where j.id = job_id and j.status = 'published'
        and (j.application_deadline is null or j.application_deadline > now())
        and j.employer_id <> (select auth.uid())
    )
  );

drop policy if exists "Candidates can withdraw own applications" on public.job_applications;
create policy "Candidates can withdraw own applications" on public.job_applications
  for update to authenticated using (candidate_id = (select auth.uid()) and status = 'submitted')
  with check (candidate_id = (select auth.uid()) and status = 'withdrawn');

grant select on public.job_posts to anon, authenticated;
grant insert, update on public.job_posts to authenticated;
grant select, insert, update on public.job_applications to authenticated;

create or replace function public.set_job_post_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  new.updated_at = now();
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists job_posts_set_updated_at on public.job_posts;
create trigger job_posts_set_updated_at before update on public.job_posts
for each row execute function public.set_job_post_updated_at();
create or replace function public.set_job_application_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $
begin
  new.updated_at = now();
  return new;
end;
$;
drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at before update on public.job_applications
for each row execute function public.set_job_application_updated_at();

comment on table public.job_posts is 'AGRIVA agriculture jobs; only reviewed and published posts are public.';
comment on column public.job_posts.location_is_approximate is 'Public pages should default to approximate coordinates to protect private farm/home locations.';


-- Moderation audit trail and admin-only status transitions.
create table if not exists public.job_moderation_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  previous_status text not null,
  new_status text not null check (new_status in ('published','rejected','paused','filled')),
  note text,
  created_at timestamptz not null default now()
);
alter table public.job_moderation_events enable row level security;
drop policy if exists "Admins can read job moderation events" on public.job_moderation_events;
create policy "Admins can read job moderation events" on public.job_moderation_events for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
revoke all on public.job_moderation_events from anon, authenticated;
grant select on public.job_moderation_events to authenticated;

create or replace function public.admin_moderate_job_post(p_job_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_admin uuid := auth.uid();
  v_previous text;
begin
  if v_admin is null or not exists(select 1 from public.profiles p where p.id=v_admin and p.role='admin') then
    raise exception 'admin access required' using errcode='42501';
  end if;
  if p_status not in ('published','rejected','paused','filled') then
    raise exception 'invalid moderation status' using errcode='22023';
  end if;
  if p_note is not null and char_length(p_note)>1000 then
    raise exception 'moderation note too long' using errcode='22023';
  end if;
  select status into v_previous from public.job_posts where id=p_job_id for update;
  if not found then raise exception 'job not found' using errcode='P0002'; end if;
  update public.job_posts
    set status=p_status,
        moderation_note=nullif(trim(p_note),''),
        published_at=case when p_status='published' then coalesce(published_at,now()) else published_at end,
        updated_at=now()
    where id=p_job_id;
  insert into public.job_moderation_events(job_id,admin_id,previous_status,new_status,note)
  values(p_job_id,v_admin,v_previous,p_status,nullif(trim(p_note),''));
end;
$$;
revoke all on function public.admin_moderate_job_post(uuid,text,text) from public, anon;
grant execute on function public.admin_moderate_job_post(uuid,text,text) to authenticated;
