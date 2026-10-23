-- User-submitted factual correction requests for AGRIVA learning content.
create table if not exists public.learning_correction_reports (
  id uuid primary key default gen_random_uuid(),
  content_slug text not null check (char_length(content_slug) between 1 and 160),
  content_title text not null check (char_length(content_title) between 1 and 200),
  issue_type text not null check (issue_type in ('fact','source','spelling','outdated','safety','other')),
  reported_text text not null check (char_length(reported_text) between 5 and 5000),
  suggested_correction text check (suggested_correction is null or char_length(suggested_correction) <= 5000),
  source_url text check (source_url is null or char_length(source_url) <= 1000),
  reporter_name text check (reporter_name is null or char_length(reporter_name) <= 120),
  reporter_email text check (reporter_email is null or char_length(reporter_email) <= 254),
  status text not null default 'pending' check (status in ('pending','approved','rejected','needs_info')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists learning_correction_reports_status_created_idx
  on public.learning_correction_reports(status, created_at desc);
alter table public.learning_correction_reports enable row level security;
revoke all on table public.learning_correction_reports from anon, authenticated;
grant insert on table public.learning_correction_reports to anon, authenticated;
grant select, update on table public.learning_correction_reports to authenticated;
drop policy if exists "Anyone can submit a learning correction" on public.learning_correction_reports;
create policy "Anyone can submit a learning correction"
  on public.learning_correction_reports for insert to anon, authenticated
  with check (
    char_length(content_slug) between 1 and 160
    and char_length(content_title) between 1 and 200
    and char_length(reported_text) between 5 and 5000
    and status = 'pending'
    and reviewed_by is null and reviewed_at is null and admin_note is null
  );
drop policy if exists "Admins can read correction reports" on public.learning_correction_reports;
create policy "Admins can read correction reports"
  on public.learning_correction_reports for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
drop policy if exists "Admins can review correction reports" on public.learning_correction_reports;
create policy "Admins can review correction reports"
  on public.learning_correction_reports for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    and status in ('pending','approved','rejected','needs_info')
  );
