-- Product-form feature controls and narrow admin delegation.
-- Super Admin identity is established only through trusted app_metadata:
-- app_metadata.agriva_super_admin = true (never user_metadata).
create table if not exists public.product_form_feature_settings (
  feature_key text primary key check (feature_key in (
    'seo_studio', 'ai_seo', 'schema_settings',
    'category_specific_fields', 'advanced_options', 'product_images'
  )),
  enabled boolean not null default false,
  updated_by uuid null references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.product_form_feature_settings(feature_key, enabled)
values
  ('seo_studio', false),
  ('ai_seo', false),
  ('schema_settings', false),
  ('category_specific_fields', false),
  ('advanced_options', false),
  ('product_images', false)
on conflict (feature_key) do nothing;

create table if not exists public.admin_feature_permission_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null check (permission_key = 'product_form_features.manage'),
  granted_by uuid not null references public.profiles(id),
  reason text null check (reason is null or length(reason) <= 500),
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  revoked_by uuid null references public.profiles(id),
  revoke_reason text null check (revoke_reason is null or length(revoke_reason) <= 500),
  check (user_id <> granted_by or revoked_at is not null)
);

create unique index if not exists admin_feature_permission_one_active_grant
  on public.admin_feature_permission_grants(user_id, permission_key)
  where revoked_at is null;

create table if not exists public.product_form_feature_audit (
  id bigint generated always as identity primary key,
  actor_id uuid null references public.profiles(id),
  action text not null check (action in ('feature_setting_changed','permission_granted','permission_revoked')),
  feature_key text null,
  target_user_id uuid null references public.profiles(id),
  before_state jsonb null,
  after_state jsonb null,
  reason text null,
  created_at timestamptz not null default now()
);

alter table public.product_form_feature_settings enable row level security;
alter table public.admin_feature_permission_grants enable row level security;
alter table public.product_form_feature_audit enable row level security;

drop policy if exists "Authenticated can read product form feature settings" on public.product_form_feature_settings;
create policy "Authenticated can read product form feature settings"
  on public.product_form_feature_settings for select to authenticated
  using (true);

drop policy if exists "Authorized admins update product form feature settings" on public.product_form_feature_settings;
create policy "Authorized admins update product form feature settings"
  on public.product_form_feature_settings for update to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)
    or (
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
      and exists (
        select 1 from public.admin_feature_permission_grants g
        where g.user_id = (select auth.uid())
          and g.permission_key = 'product_form_features.manage'
          and g.revoked_at is null
      )
    )
  )
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)
    or (
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
      and exists (
        select 1 from public.admin_feature_permission_grants g
        where g.user_id = (select auth.uid())
          and g.permission_key = 'product_form_features.manage'
          and g.revoked_at is null
      )
    )
  );

drop policy if exists "Admins can read their own feature grant" on public.admin_feature_permission_grants;
create policy "Admins can read their own feature grant"
  on public.admin_feature_permission_grants for select to authenticated
  using (user_id = (select auth.uid()) and revoked_at is null);

drop policy if exists "Super Admin manages feature grants" on public.admin_feature_permission_grants;
create policy "Super Admin manages feature grants"
  on public.admin_feature_permission_grants for all to authenticated
  using (coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false))
  with check (coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false));

drop policy if exists "Super Admin reads feature audit" on public.product_form_feature_audit;
create policy "Super Admin reads feature audit"
  on public.product_form_feature_audit for select to authenticated
  using (coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false));

create or replace function public.audit_product_form_feature_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if tg_table_name = 'product_form_feature_settings' then
    insert into public.product_form_feature_audit(actor_id, action, feature_key, before_state, after_state)
    values (
      auth.uid(), 'feature_setting_changed', new.feature_key,
      jsonb_build_object('enabled', old.enabled),
      jsonb_build_object('enabled', new.enabled)
    );
    new.updated_by := auth.uid();
    new.updated_at := now();
    return new;
  elsif tg_table_name = 'admin_feature_permission_grants' then
    if tg_op = 'INSERT' then
      insert into public.product_form_feature_audit(actor_id, action, target_user_id, after_state, reason)
      values (auth.uid(), 'permission_granted', new.user_id,
        jsonb_build_object('permission_key', new.permission_key, 'grant_id', new.id), new.reason);
      return new;
    elsif old.revoked_at is null and new.revoked_at is not null then
      insert into public.product_form_feature_audit(actor_id, action, target_user_id, before_state, after_state, reason)
      values (auth.uid(), 'permission_revoked', new.user_id,
        jsonb_build_object('permission_key', old.permission_key, 'grant_id', old.id),
        jsonb_build_object('revoked_at', new.revoked_at), new.revoke_reason);
    end if;
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists product_form_feature_settings_audit on public.product_form_feature_settings;
create trigger product_form_feature_settings_audit
  before update on public.product_form_feature_settings
  for each row execute function public.audit_product_form_feature_changes();

drop trigger if exists admin_feature_permission_grants_audit on public.admin_feature_permission_grants;
create trigger admin_feature_permission_grants_audit
  after insert or update on public.admin_feature_permission_grants
  for each row execute function public.audit_product_form_feature_changes();

revoke all on public.product_form_feature_settings from anon;
revoke all on public.admin_feature_permission_grants from anon;
revoke all on public.product_form_feature_audit from anon;
grant select on public.product_form_feature_settings to authenticated;
grant update (enabled) on public.product_form_feature_settings to authenticated;
grant select, insert on public.admin_feature_permission_grants to authenticated;
grant update (revoked_at, revoked_by, revoke_reason) on public.admin_feature_permission_grants to authenticated;
grant select on public.product_form_feature_audit to authenticated;
revoke all on function public.audit_product_form_feature_changes() from public, anon, authenticated;
