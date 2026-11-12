-- AGRIVA SEO Engine foundation. Additive migration; does not change the existing CMS.
create table if not exists public.seo_engine_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('keyword_research','cluster','brief','draft','quality_review','performance_sync')),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seo_engine_jobs_queue_idx on public.seo_engine_jobs(status,scheduled_at);
create table if not exists public.seo_engine_usage (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.seo_engine_jobs(id) on delete set null,
  provider text not null,
  model text not null,
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(14,6) not null default 0 check (estimated_cost_usd >= 0),
  created_at timestamptz not null default now()
);
create index if not exists seo_engine_usage_job_idx on public.seo_engine_usage(job_id);
alter table public.seo_engine_jobs enable row level security;
alter table public.seo_engine_usage enable row level security;
-- Admin-only reads; mutations deliberately remain service-side until the
-- worker, capability checks and atomic claim RPC have been reviewed.
create policy seo_engine_jobs_admin_read on public.seo_engine_jobs
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );
create policy seo_engine_usage_admin_read on public.seo_engine_usage
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );
revoke all on public.seo_engine_jobs, public.seo_engine_usage from anon;
grant select on public.seo_engine_jobs, public.seo_engine_usage to authenticated;
