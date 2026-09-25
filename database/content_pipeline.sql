create table if not exists article_drafts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references content_opportunities(id) on delete set null,
  keyword text not null,
  search_intent text,
  title text not null,
  slug text unique not null,
  content text not null,
  meta_title text,
  meta_description text,
  primary_keyword text,
  secondary_keywords jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  competitor_notes jsonb not null default '[]'::jsonb,
  ai_model text,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','rejected')),
  created_by uuid references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists article_drafts_status_idx on article_drafts(status, created_at desc);
create index if not exists article_drafts_keyword_idx on article_drafts(keyword);

alter table article_drafts enable row level security;
create policy "admins manage article drafts" on article_drafts for all using (public.is_admin()) with check (public.is_admin());
create policy "published articles public read" on article_drafts for select using (status = 'published' or public.is_admin());
