-- Global admin assignments require a nullable scope_id.
-- The original composite primary key made scope_id NOT NULL, contradicting
-- the global-scope consistency constraint. Use a surrogate key and retain the
-- expression-based unique index for one assignment per user/role/scope.
alter table public.admin_user_roles
  drop constraint if exists admin_user_roles_pkey;

alter table public.admin_user_roles
  add column if not exists id uuid default gen_random_uuid();

update public.admin_user_roles
set id = gen_random_uuid()
where id is null;

alter table public.admin_user_roles
  alter column id set not null;

alter table public.admin_user_roles
  add constraint admin_user_roles_pkey primary key (id);
