-- Growth & Tracking Center foundation. Provider IDs/tokens only; never store arbitrary scripts.
create table if not exists public.site_integrations (
  provider_key text primary key,
  category text not null check (category in ('verification','analytics','marketing')),
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_integrations_config_object check (jsonb_typeof(config) = 'object')
);

create table if not exists public.site_integration_audit (
  id bigint generated always as identity primary key,
  provider_key text not null,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_integrations enable row level security;
alter table public.site_integration_audit enable row level security;

revoke all on public.site_integrations from anon, authenticated;
revoke all on public.site_integration_audit from anon, authenticated;
grant select on public.site_integrations to anon, authenticated;
grant insert, update, select on public.site_integrations to authenticated;
grant select, insert on public.site_integration_audit to authenticated;

drop policy if exists "Public reads enabled verification integrations" on public.site_integrations;
create policy "Public reads enabled verification integrations"
on public.site_integrations for select
to anon, authenticated
using (category = 'verification' and enabled = true);

drop policy if exists "Admins read all site integrations" on public.site_integrations;
create policy "Admins read all site integrations"
on public.site_integrations for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins insert site integrations" on public.site_integrations;
create policy "Admins insert site integrations"
on public.site_integrations for insert
to authenticated
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins update site integrations" on public.site_integrations;
create policy "Admins update site integrations"
on public.site_integrations for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins read integration audit" on public.site_integration_audit;
create policy "Admins read integration audit"
on public.site_integration_audit for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins insert integration audit" on public.site_integration_audit;
create policy "Admins insert integration audit"
on public.site_integration_audit for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create index if not exists site_integrations_category_enabled_idx
on public.site_integrations (category, enabled);
create index if not exists site_integration_audit_provider_created_idx
on public.site_integration_audit (provider_key, created_at desc);
