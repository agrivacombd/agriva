-- AGRIVA migration verification smoke test.
-- Run this in Supabase SQL Editor AFTER applying
-- database/migrations/20261017_harmonize_security.sql.
-- It performs read-only catalog checks and raises an exception on failure.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name = 'moderation_status'
  ) then
    raise exception 'Missing products.moderation_status';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name = 'rejection_reason'
  ) then
    raise exception 'Missing products.rejection_reason';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'verification_status'
  ) then
    raise exception 'Missing profiles.verification_status';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_opportunities'
      and column_name = 'normalized_keyword'
  ) then
    raise exception 'Missing content_opportunities.normalized_keyword';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_opportunities'
      and column_name = 'result_count'
  ) then
    raise exception 'Missing content_opportunities.result_count';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_opportunities'
      and column_name = 'last_seen_at'
  ) then
    raise exception 'Missing content_opportunities.last_seen_at';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and policyname = 'approved active products public'
  ) then
    raise exception 'Missing approved product visibility policy';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'prevent_profile_role_escalation'
      and tgrelid = 'public.profiles'::regclass
      and not tgisinternal
  ) then
    raise exception 'Missing profile role escalation trigger';
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'products' and c.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.products';
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles' and c.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.profiles';
  end if;

  raise notice 'AGRIVA migration verification passed.';
end;
$$;
