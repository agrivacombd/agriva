-- AGRIVA AI Search Intelligence
create type public.search_intent as enum ('informational','commercial','transactional','navigational','unknown');
create type public.content_draft_status as enum ('draft','review','approved','published','rejected');

create table public.search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  normalized_query text not null,
  intent public.search_intent not null default 'unknown',
  source text not null default 'site_search',
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  search_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index search_queries_normalized_idx on public.search_queries(normalized_query);

create table public.search_opportunities (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.search_queries(id) on delete cascade,
  opportunity_type text not null check (opportunity_type in ('article','product','category','tool')),
  score numeric(6,2) not null default 0,
  rationale text,
  competitor_notes text,
  suggested_title text,
  suggested_slug text,
  status public.content_draft_status not null default 'draft',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
create index search_opportunities_status_idx on public.search_opportunities(status);
create index search_opportunities_score_idx on public.search_opportunities(score desc);

alter table public.search_queries enable row level security;
alter table public.search_opportunities enable row level security;
create policy "search_queries_insert_authenticated" on public.search_queries for insert with check (auth.uid() = user_id or user_id is null);
create policy "search_queries_own_read" on public.search_queries for select using (auth.uid() = user_id);
create policy "opportunities_admin_read" on public.search_opportunities for select using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "opportunities_admin_update" on public.search_opportunities for update using (exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

comment on table public.search_queries is 'Aggregated site-search demand. Store query text only; do not use this table for sensitive profiling.';
comment on table public.search_opportunities is 'AI-generated content/product opportunities. All AI output starts as draft and requires admin review before publishing.';
