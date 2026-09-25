-- AGRIVA canonical search opportunity model.
-- The existing app uses content_opportunities; this migration makes it the single source of truth.
create table if not exists public.content_opportunities (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  normalized_keyword text not null,
  intent text not null default 'unknown',
  opportunity_type text not null check (opportunity_type in ('article','product','tool','both')),
  search_count integer not null default 0,
  result_count integer not null default 0,
  status text not null default 'open' check (status in ('open','draft','review','approved','published','rejected')),
  title text,
  slug text,
  ai_outline jsonb,
  competitor_notes text,
  seo_notes text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
create unique index if not exists content_opportunities_keyword_type_idx on public.content_opportunities(normalized_keyword,opportunity_type);
create index if not exists content_opportunities_status_idx on public.content_opportunities(status);
create index if not exists content_opportunities_search_count_idx on public.content_opportunities(search_count desc);
alter table public.content_opportunities enable row level security;
create policy if not exists "content_opportunities_admin_read" on public.content_opportunities for select using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy if not exists "content_opportunities_admin_update" on public.content_opportunities for update using (exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy if not exists "content_opportunities_admin_insert" on public.content_opportunities for insert with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

-- Keep the older table for compatibility during migration, but new application code should use content_opportunities only.
comment on table public.content_opportunities is 'Canonical AGRIVA search/content opportunity table. AI output remains draft/review until an admin approves publication.';
