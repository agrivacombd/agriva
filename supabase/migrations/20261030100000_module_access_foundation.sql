-- AGRIVA module-access foundation. Additive only; not applied to any database by this branch.
-- Self-selected profile roles are descriptive; only approved grants authorize module actions.
create table if not exists public.module_access_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 module text not null check (module in ('plant_market','marketplace','sell_harvest','transport','farm_management')),
 applicant_type text not null check (applicant_type in ('gardener','business','farmer','transport_partner','farm_operator')),
 organization_id uuid,
 status text not null default 'pending' check (status in ('pending','under_review','approved','rejected','withdrawn')),
 applicant_data jsonb not null default '{}'::jsonb,
 review_note text,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint module_access_review_consistency check (
  (status in ('approved','rejected') and reviewed_by is not null and reviewed_at is not null)
  or status not in ('approved','rejected')
 ),
 constraint module_access_applicant_type_matches_module check (
  (module = 'plant_market' and applicant_type = 'gardener')
  or (module = 'marketplace' and applicant_type = 'business')
  or (module = 'sell_harvest' and applicant_type = 'farmer')
  or (module = 'transport' and applicant_type = 'transport_partner')
  or (module = 'farm_management' and applicant_type = 'farm_operator')
 ),
 constraint marketplace_application_requires_organization check (module <> 'marketplace' or organization_id is not null)
);
create index if not exists module_access_applications_user_status_idx on public.module_access_applications(user_id,status,created_at desc);
create index if not exists module_access_applications_queue_idx on public.module_access_applications(module,status,created_at) where status in ('pending','under_review');

create table if not exists public.organizations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete restrict,
 name text not null check (char_length(btrim(name)) between 2 and 180),
 organization_type text not null check (organization_type in ('company','shop','dealer','cooperative','farm_business','other')),
 registration_number text,
 status text not null default 'pending' check (status in ('pending','verified','rejected','suspended')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists organizations_owner_idx on public.organizations(owner_id);

create table if not exists public.organization_members (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 member_role text not null check (member_role in ('manager','catalog_manager','order_manager','staff','accountant')),
 status text not null default 'active' check (status in ('invited','active','suspended')),
 invited_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique (organization_id,user_id)
);
create index if not exists organization_members_user_idx on public.organization_members(user_id,status);
do $block$
begin
 if not exists (select 1 from pg_constraint where conname = 'module_access_applications_organization_fk') then
  alter table public.module_access_applications
   add constraint module_access_applications_organization_fk
   foreign key (organization_id) references public.organizations(id) on delete set null;
 end if;
end;
$block$;

create table if not exists public.farmer_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
 district text,
 upazila text,
 farming_types text[] not null default '{}',
 evidence jsonb not null default '{}'::jsonb,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.farm_members (
 id uuid primary key default gen_random_uuid(),
 farm_id uuid not null references public.farms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 member_role text not null check (member_role in ('manager','worker','accountant','viewer')),
 status text not null default 'active' check (status in ('invited','active','suspended')),
 invited_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique (farm_id,user_id)
);
create index if not exists farm_members_user_idx on public.farm_members(user_id,status);

create table if not exists public.user_module_grants (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 module text not null check (module in ('plant_market','marketplace','sell_harvest','buyer_demands','transport','farm_management')),
 permission text not null check (permission in ('read','create','update','delete','moderate','manage_members','manage_orders','manage_inventory')),
 scope_type text not null default 'global' check (scope_type in ('global','organization','farm')),
 scope_id uuid,
 status text not null default 'active' check (status in ('active','revoked','expired')),
 granted_by uuid references auth.users(id),
 granted_at timestamptz not null default now(),
 expires_at timestamptz,
 revoked_by uuid references auth.users(id),
 revoked_at timestamptz,
 reason text,
 constraint module_grant_scope_consistency check (
  (scope_type = 'global' and scope_id is null)
  or (scope_type in ('organization','farm') and scope_id is not null)
 ),
 constraint module_grant_revocation_consistency check ((status = 'revoked' and revoked_at is not null) or status <> 'revoked')
);
create index if not exists user_module_grants_lookup_idx on public.user_module_grants(user_id,module,permission,status,scope_type,scope_id);
create index if not exists user_module_grants_expiry_idx on public.user_module_grants(expires_at) where status = 'active' and expires_at is not null;
create unique index if not exists user_module_grants_unique_scope_idx
 on public.user_module_grants(user_id,module,permission,scope_type,coalesce(scope_id,'00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.admin_roles (
 id uuid primary key default gen_random_uuid(),
 role_key text not null unique check (role_key ~ '^[a-z][a-z0-9_]{1,63}$'),
 display_name text not null,
 description text,
 is_system boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.admin_role_permissions (
 role_id uuid not null references public.admin_roles(id) on delete cascade,
 capability text not null check (capability ~ '^[a-z][a-z0-9_.]{1,95}$'),
 created_at timestamptz not null default now(),
 primary key (role_id,capability)
);
create table if not exists public.admin_user_roles (
 user_id uuid not null references auth.users(id) on delete cascade,
 role_id uuid not null references public.admin_roles(id) on delete cascade,
 scope_type text not null default 'global' check (scope_type in ('global','organization','farm')),
 scope_id uuid,
 granted_by uuid references auth.users(id),
 granted_at timestamptz not null default now(),
 expires_at timestamptz,
 primary key (user_id,role_id,scope_type,scope_id),
 constraint admin_role_scope_consistency check ((scope_type = 'global' and scope_id is null) or (scope_type in ('organization','farm') and scope_id is not null))
);
create index if not exists admin_user_roles_user_idx on public.admin_user_roles(user_id,expires_at);
create unique index if not exists admin_user_roles_unique_scope_idx
 on public.admin_user_roles(user_id,role_id,scope_type,coalesce(scope_id,'00000000-0000-0000-0000-000000000000'::uuid));

create or replace function public.owns_organization(p_organization_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $function$
 select auth.uid() is not null and exists (
  select 1 from public.organizations o where o.id = p_organization_id and o.owner_id = auth.uid()
 );
$function$;

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $function$
 select auth.uid() is not null and exists (
  select 1 from public.organization_members m where m.organization_id = p_organization_id and m.user_id = auth.uid() and m.status = 'active'
 );
$function$;

create or replace function public.owns_farm(p_farm_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $function$
 select auth.uid() is not null and exists (
  select 1 from public.farms f where f.id = p_farm_id and f.owner_id = auth.uid()
 );
$function$;

create or replace function public.guard_organization_verification()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $function$
begin
 if auth.uid() is not null and not public.is_admin() then
  if new.owner_id is distinct from old.owner_id or new.status is distinct from old.status then
   raise exception 'Organization ownership and verification are admin-controlled' using errcode = '42501';
  end if;
 end if;
 return new;
end;
$function$;

drop trigger if exists organizations_verification_guard on public.organizations;
create trigger organizations_verification_guard
before update on public.organizations
for each row execute function public.guard_organization_verification();

create or replace function public.admin_review_module_application(p_application_id uuid,p_decision text,p_review_note text default null)
returns void language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
 v_application public.module_access_applications%rowtype;
begin
 if auth.uid() is null or not public.is_admin() then
  raise exception 'Administrator access required' using errcode = '42501';
 end if;
 if p_decision not in ('approved','rejected') then
  raise exception 'Invalid review decision' using errcode = '22023';
 end if;
 select * into v_application from public.module_access_applications
  where id = p_application_id and status in ('pending','under_review') for update;
 if not found then
  raise exception 'Application not found or already reviewed' using errcode = 'P0002';
 end if;
 update public.module_access_applications
  set status = p_decision,
      review_note = nullif(left(btrim(coalesce(p_review_note,'')),1000),''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;
 if p_decision = 'approved' then
  if v_application.module = 'marketplace' then
   update public.organizations
    set status = 'verified', updated_at = now()
    where id = v_application.organization_id
      and owner_id = v_application.user_id
      and status in ('pending','verified');
   if not found then
    raise exception 'Business organization must exist and belong to the applicant' using errcode = '42501';
   end if;
  end if;
  insert into public.user_module_grants(user_id,module,permission,scope_type,scope_id,granted_by,reason)
  select v_application.user_id,v_application.module,permission_name,
    case when v_application.organization_id is not null then 'organization' else 'global' end,
    v_application.organization_id,auth.uid(),'Approved application ' || v_application.id::text
  from (values ('read'),('create')) as requested(permission_name)
  where not exists (
   select 1 from public.user_module_grants existing
   where existing.user_id = v_application.user_id
    and existing.module = v_application.module
    and existing.permission = requested.permission_name
    and existing.status = 'active'
    and existing.scope_type = case when v_application.organization_id is not null then 'organization' else 'global' end
    and existing.scope_id is not distinct from v_application.organization_id
  );
 end if;
end;
$function$;

create or replace function public.has_module_access(p_module text,p_permission text,p_scope_type text default 'global',p_scope_id uuid default null)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $function$
 select auth.uid() is not null and exists (
  select 1 from public.user_module_grants g
  where g.user_id = auth.uid() and g.module = p_module and g.permission = p_permission
   and g.status = 'active' and (g.expires_at is null or g.expires_at > now())
   and ((g.scope_type = 'global' and g.scope_id is null)
     or (p_scope_type in ('organization','farm') and g.scope_type = p_scope_type and g.scope_id = p_scope_id))
 );
$function$;

create or replace function public.has_admin_permission(p_capability text)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $function$
 select auth.uid() is not null and exists (
  select 1 from public.admin_user_roles ur
  join public.admin_role_permissions rp on rp.role_id = ur.role_id
  where ur.user_id = auth.uid() and rp.capability = p_capability
   and (ur.expires_at is null or ur.expires_at > now())
   and ur.scope_type = 'global' and ur.scope_id is null
 );
$function$;

alter table public.module_access_applications enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.farmer_profiles enable row level security;
alter table public.farm_members enable row level security;
alter table public.user_module_grants enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_roles enable row level security;

drop policy if exists module_access_applications_select on public.module_access_applications;
create policy module_access_applications_select on public.module_access_applications for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists module_access_applications_insert on public.module_access_applications;
create policy module_access_applications_insert on public.module_access_applications for insert to authenticated
with check (
 user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null
 and (organization_id is null or public.owns_organization(organization_id))
);
drop policy if exists module_access_applications_admin_update on public.module_access_applications;
create policy module_access_applications_admin_update on public.module_access_applications for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select to authenticated
using (owner_id = (select auth.uid()) or public.is_organization_member(id) or public.is_admin());
drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations for insert to authenticated
with check (owner_id = (select auth.uid()) and status = 'pending');
drop policy if exists organizations_owner_update on public.organizations;
create policy organizations_owner_update on public.organizations for update to authenticated
using (owner_id = (select auth.uid()) or public.is_admin()) with check (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members for select to authenticated
using (user_id = (select auth.uid()) or public.owns_organization(organization_id) or public.is_admin());
drop policy if exists organization_members_owner_insert on public.organization_members;
create policy organization_members_owner_insert on public.organization_members for insert to authenticated
with check (public.owns_organization(organization_id) and status in ('invited','active'));
drop policy if exists organization_members_owner_update on public.organization_members;
create policy organization_members_owner_update on public.organization_members for update to authenticated
using (public.owns_organization(organization_id) or public.is_admin())
with check (public.owns_organization(organization_id) or public.is_admin());

drop policy if exists farmer_profiles_select on public.farmer_profiles;
create policy farmer_profiles_select on public.farmer_profiles for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists farmer_profiles_insert on public.farmer_profiles;
create policy farmer_profiles_insert on public.farmer_profiles for insert to authenticated with check (user_id = (select auth.uid()) and verification_status = 'pending' and reviewed_by is null and reviewed_at is null);
drop policy if exists farmer_profiles_admin_update on public.farmer_profiles;
create policy farmer_profiles_admin_update on public.farmer_profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists farm_members_select on public.farm_members;
create policy farm_members_select on public.farm_members for select to authenticated
using (user_id = (select auth.uid()) or public.owns_farm(farm_id) or public.is_admin());
drop policy if exists farm_members_owner_insert on public.farm_members;
create policy farm_members_owner_insert on public.farm_members for insert to authenticated
with check (public.owns_farm(farm_id) and status in ('invited','active'));
drop policy if exists farm_members_owner_update on public.farm_members;
create policy farm_members_owner_update on public.farm_members for update to authenticated
using (public.owns_farm(farm_id) or public.is_admin())
with check (public.owns_farm(farm_id) or public.is_admin());

drop policy if exists user_module_grants_select on public.user_module_grants;
create policy user_module_grants_select on public.user_module_grants for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists admin_roles_admin_all on public.admin_roles;
create policy admin_roles_admin_all on public.admin_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_role_permissions_admin_all on public.admin_role_permissions;
create policy admin_role_permissions_admin_all on public.admin_role_permissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_user_roles_admin_all on public.admin_user_roles;
create policy admin_user_roles_admin_all on public.admin_user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.module_access_applications,public.organizations,public.organization_members,public.farmer_profiles,public.farm_members,public.user_module_grants,public.admin_roles,public.admin_role_permissions,public.admin_user_roles from public,anon;
revoke truncate,references,trigger on public.module_access_applications,public.organizations,public.organization_members,public.farmer_profiles,public.farm_members,public.user_module_grants,public.admin_roles,public.admin_role_permissions,public.admin_user_roles from authenticated;
grant select,insert,update on public.module_access_applications to authenticated;
grant select,insert,update on public.organizations,public.organization_members,public.farm_members to authenticated;
grant select,insert,update on public.farmer_profiles to authenticated;
grant select on public.user_module_grants to authenticated;
grant select,insert,update,delete on public.admin_roles,public.admin_role_permissions,public.admin_user_roles to authenticated;
revoke all on function public.owns_organization(uuid) from public,anon;
revoke all on function public.is_organization_member(uuid) from public,anon;
revoke all on function public.owns_farm(uuid) from public,anon;
revoke all on function public.guard_organization_verification() from public,anon;
revoke all on function public.admin_review_module_application(uuid,text,text) from public,anon;
grant execute on function public.owns_organization(uuid) to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.owns_farm(uuid) to authenticated;
grant execute on function public.admin_review_module_application(uuid,text,text) to authenticated;
revoke all on function public.has_module_access(text,text,text,uuid) from public,anon;
revoke all on function public.has_admin_permission(text) from public,anon;
grant execute on function public.has_module_access(text,text,text,uuid) to authenticated;
grant execute on function public.has_admin_permission(text) to authenticated;
comment on table public.user_module_grants is 'Approved, scoped module permissions. Self-selected profile roles are not authorization grants.';
comment on table public.module_access_applications is 'User-submitted applications; only trusted admins may approve or reject.';
comment on table public.admin_user_roles is 'Delegated admin roles; never self-assignable.';
