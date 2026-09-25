-- Step 5: search intelligence / zero-result content and product opportunities
create table if not exists search_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  user_id uuid references profiles(id) on delete set null,
  query text not null,
  normalized_query text not null,
  result_count integer not null default 0,
  intent text,
  created_at timestamptz not null default now()
);
create table if not exists content_opportunities (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  normalized_keyword text not null,
  intent text,
  opportunity_type text not null check (opportunity_type in ('article','product','both')),
  search_count integer not null default 1,
  result_count integer not null default 0,
  status text not null default 'open' check (status in ('open','in_progress','drafted','published','closed')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(normalized_keyword, opportunity_type)
);
create index if not exists search_events_query_idx on search_events(normalized_query, created_at desc);
create index if not exists search_events_created_idx on search_events(created_at desc);
create index if not exists content_opportunities_demand_idx on content_opportunities(search_count desc, last_seen_at desc);

alter table search_events enable row level security;
alter table content_opportunities enable row level security;
create policy "admins read search events" on search_events for select using (public.is_admin());
create policy "admins manage opportunities" on content_opportunities for all using (public.is_admin()) with check (public.is_admin());
