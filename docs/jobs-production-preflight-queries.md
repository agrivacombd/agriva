# Jobs migration — read-only Production preflight queries

These queries are for the reviewed Production Supabase target only after the operator independently confirms the project reference. They are **read-only inventory queries**. They do not apply the Jobs migration, reload PostgREST, change grants, or modify migration history.

Target identified from the Vercel Production runtime: `dhqaepsbuwhbynagfxpf`. Do not use the separate `utytcoxpjnoanqffkqft` project as a substitute.

## 1. Confirm the connection context

```sql
select current_database() as database_name,
       current_user as database_user,
       current_setting('server_version') as postgres_version,
       current_setting('search_path') as search_path;
```

This does not independently prove the Supabase project reference; confirm the project in the Supabase dashboard/connector before running any later release command.

## 2. Check Jobs object-name collisions

```sql
select n.nspname as schema_name,
       c.relname as object_name,
       c.relkind as object_kind,
       pg_get_userbyid(c.relowner) as owner,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public','auth')
  and c.relname in (
    'job_posts','job_applications','job_moderation_events',
    'job_posts_public_search_idx','job_posts_employer_idx','job_posts_deadline_idx',
    'job_applications_job_idx','job_applications_candidate_idx',
    'set_job_post_updated_at','set_job_application_updated_at',
    'admin_moderate_job_post'
  )
order by n.nspname, c.relname;
```

Any existing object requires semantic comparison. Do not treat a same-name object as equivalent.

## 3. Compare profiles role type and auth dependencies

```sql
select n.nspname as type_schema, t.typname as type_name,
       e.enumsortorder, e.enumlabel
from pg_type t
join pg_namespace n on n.oid=t.typnamespace
left join pg_enum e on e.enumtypid=t.oid
where (n.nspname='public' and t.typname='user_role')
   or (n.nspname='public' and t.typname in ('app_role','profile_role'))
order by n.nspname,t.typname,e.enumsortorder;

select column_name, data_type, udt_schema, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='profiles'
order by ordinal_position;

select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid='public.profiles'::regclass
order by conname;
```

Confirm the migration's `profiles.role='admin'` assumption, type, trigger and admin checks against the actual target.

## 4. Inventory existing policies, triggers and functions

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('job_posts','job_applications','job_moderation_events')
order by tablename,policyname;

select n.nspname as schema_name, c.relname as table_name,
       t.tgname as trigger_name, pg_get_triggerdef(t.oid,true) as definition
from pg_trigger t
join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal
  and n.nspname='public'
  and c.relname in ('job_posts','job_applications','job_moderation_events')
order by c.relname,t.tgname;

select p.oid::regprocedure as function_signature,
       pg_get_userbyid(p.proowner) as owner,
       p.prosecdef as security_definer,
       p.proconfig as function_settings,
       p.proacl as acl,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('set_job_post_updated_at','set_job_application_updated_at','admin_moderate_job_post')
order by p.proname,p.oid::regprocedure::text;
```

## 5. Inventory constraints, indexes, and effective role privileges

```sql
select c.conrelid::regclass as table_name, c.conname,
       c.contype, pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid in (
  to_regclass('public.job_posts'),
  to_regclass('public.job_applications'),
  to_regclass('public.job_moderation_events')
)
order by c.conrelid::regclass::text,c.conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname='public'
  and tablename in ('job_posts','job_applications','job_moderation_events')
order by tablename,indexname;

select r.rolname as role_name,
       has_table_privilege(r.rolname,'public.job_posts','SELECT') as job_posts_select,
       has_table_privilege(r.rolname,'public.job_posts','INSERT') as job_posts_insert,
       has_table_privilege(r.rolname,'public.job_posts','UPDATE') as job_posts_update,
       has_table_privilege(r.rolname,'public.job_applications','SELECT') as applications_select,
       has_table_privilege(r.rolname,'public.job_applications','INSERT') as applications_insert,
       has_table_privilege(r.rolname,'public.job_applications','UPDATE') as applications_update
from pg_roles r
where r.rolname in ('anon','authenticated','service_role','postgres')
order by r.rolname;
```

For missing relations, `has_table_privilege` can error depending on server behavior; if so, run this last query only after the relevant relation exists, or first inspect the actual table grants in `information_schema.role_table_grants`.

## 6. Review repository migration history without changing it

Compare repository migration files and the target's read-only migration listing. For each migration, classify its SQL effects as:

- not applied,
- already semantically equivalent,
- partially applied/divergent,
- Production-specific,
- unclear.

Do not insert/delete rows in `supabase_migrations.schema_migrations` to align timestamps. A matching migration name is not proof of equivalent effects.

## Release gate

The Jobs migration remains blocked until object-level comparisons, exact dependency checks, policy/grant review, backup/recovery plan, and explicit approval of the exact Production SQL plan are complete. After an approved migration, verify constraints, indexes, RLS policies, function ACLs, PostgREST schema cache, and `/jobs` behavior. No Production writes were performed to prepare this document.
