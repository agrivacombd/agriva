-- AGRIVA database compatibility and public product moderation migration
-- Safe to run after schema.sql, farmer_products.sql, and/or search_intelligence.sql.
begin;

alter table public.products
  add column if not exists moderation_status text not null default 'pending',
  add column if not exists rejection_reason text;

alter table public.profiles
  add column if not exists verification_status text not null default 'unverified';

-- Existing rows created before moderation was introduced should not become public
-- until an admin explicitly approves them.
alter table public.products
  drop constraint if exists products_moderation_status_check;
alter table public.products
  add constraint products_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

alter table public.profiles
  drop constraint if exists profiles_verification_status_check;
alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));

create index if not exists products_moderation_idx
  on public.products(moderation_status, created_at desc);

-- Harmonize the two historical content_opportunities schema variants.
alter table public.content_opportunities
  add column if not exists normalized_keyword text,
  add column if not exists result_count integer not null default 0,
  add column if not exists last_seen_at timestamptz not null default now();

update public.content_opportunities
set normalized_keyword = lower(trim(keyword))
where normalized_keyword is null;

alter table public.content_opportunities
  alter column normalized_keyword set default '';

-- Replace generated CHECK constraints for the two fields with compatible values.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.content_opportunities'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%opportunity_type%'
        or pg_get_constraintdef(oid) ilike '%status%')
  loop
    execute format('alter table public.content_opportunities drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.content_opportunities
  add constraint content_opportunities_type_compat_check
  check (opportunity_type in ('article', 'product', 'both', 'faq', 'review'));

alter table public.content_opportunities
  add constraint content_opportunities_status_compat_check
  check (status in ('open', 'reviewing', 'in_progress', 'drafted', 'published', 'dismissed', 'closed'));

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.content_opportunities enable row level security;

-- Public visibility requires both an active listing and explicit moderation approval.
drop policy if exists "active products public" on public.products;
drop policy if exists "approved active products public" on public.products;
create policy "approved active products public"
  on public.products for select
  using ((status = 'active' and moderation_status = 'approved') or public.is_admin());

-- Ensure admin management remains restricted to admins.
drop policy if exists "admins manage opportunities" on public.content_opportunities;
create policy "admins manage opportunities"
  on public.content_opportunities for all
  using (public.is_admin())
  with check (public.is_admin());

commit;
