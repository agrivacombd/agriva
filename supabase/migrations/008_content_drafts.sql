-- AGRIVA AI SEO content drafts
create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.content_opportunities(id) on delete cascade,
  content_type text not null check (content_type in ('article','product','tool')),
  title text not null,
  slug text not null,
  meta_title text,
  meta_description text,
  primary_keyword text not null,
  secondary_keywords text[] not null default '{}',
  search_intent text not null default 'informational',
  outline jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  internal_link_suggestions jsonb not null default '[]'::jsonb,
  competitor_analysis jsonb not null default '[]'::jsonb,
  body_markdown text,
  status public.content_draft_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_drafts_status_idx on public.content_drafts(status);
create index if not exists content_drafts_opportunity_idx on public.content_drafts(opportunity_id);
alter table public.content_drafts enable row level security;
create policy if not exists "content_drafts_admin_all" on public.content_drafts for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

create or replace function public.create_content_draft_from_opportunity(p_opportunity_id uuid)
returns public.content_drafts
language plpgsql security definer set search_path=public
as $$
declare o public.content_opportunities; d public.content_drafts;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin role required'; end if;
  select * into o from public.content_opportunities where id=p_opportunity_id;
  if not found then raise exception 'Opportunity not found'; end if;
  insert into public.content_drafts(opportunity_id,content_type,title,slug,meta_title,meta_description,primary_keyword,search_intent,created_by)
  values(o.id,case when o.opportunity_type='both' then 'article' else o.opportunity_type end,coalesce(o.title,o.keyword),coalesce(o.slug,regexp_replace(lower(o.keyword),'[^a-z0-9]+','-','g')),coalesce(o.title,o.keyword),left('Helpful AGRIVA guide for '||o.keyword,160),o.keyword,o.intent,auth.uid())
  returning * into d;
  update public.content_opportunities set status='draft' where id=o.id and status in ('open','approved');
  return d;
end;
$$;
grant execute on function public.create_content_draft_from_opportunity(uuid) to authenticated;
