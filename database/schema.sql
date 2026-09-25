-- AGRIVA initial intelligence schema
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  query text not null,
  normalized_query text,
  intent text,
  category text,
  crop text,
  result_count integer not null default 0,
  clicked_result_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists search_queries_created_at_idx on search_queries(created_at desc);
create index if not exists search_queries_normalized_idx on search_queries(normalized_query);
create index if not exists search_queries_intent_idx on search_queries(intent);

create table if not exists content_opportunities (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  intent text,
  search_count integer not null default 0,
  growth_percent numeric(8,2) not null default 0,
  no_result_rate numeric(5,2) not null default 0,
  opportunity_type text not null check (opportunity_type in ('article','product','faq','review')),
  status text not null default 'open' check (status in ('open','reviewing','published','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  body text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text,
  description text,
  price numeric(12,2),
  stock integer not null default 0,
  status text not null default 'draft' check (status in ('draft','active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table search_queries enable row level security;
alter table content_opportunities enable row level security;
alter table articles enable row level security;
alter table products enable row level security;

-- Application-specific RLS policies should be added after auth roles are configured.
