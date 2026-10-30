# Production Release Runbook — Module Access & Identity Verification

Status: **All nine feature migrations applied to Production; Global Super Admin assignment verified; RPC and FK/policy Advisor fixes verified**  
Target Supabase project: `dhqaepsbuwhbynagfxpf`  
Feature branch: `feat/security-performance-advisor-hardening`

## Production preflight observed on 2026-10-30

- Production migration history includes all nine feature migrations through `20261030150000 security_performance_advisor_hardening`.
- The eight feature migrations are applied in Production; only the follow-up Advisor hardening migration remains pending.
- Existing prerequisites verified: `public.farms`, `public.products`, `public.harvest_listings`, and `public.profiles` exist.
- `products.farmer_id`, `harvest_listings.owner_id`, `harvest_listings.moderation_status`, and `harvest_listings.moderation_note` exist.
- Production harvest moderation trigger exists as `harvest_listings_guard_moderation`; it calls `guard_harvest_listing_moderation()`. Preserve it.
- Production `is_admin()` still uses `profiles.role = 'admin'`. The new delegated RBAC permission function is additive and does not replace this legacy check.
- `agriva.com.bd@gmail.com` has been assigned the `super_admin` role globally with all 15 capabilities. The existing `profiles.role='admin'` flag remains intact.

## Previously applied feature migrations

The following eight repository migrations have already been applied to Production in filename order:

1. `20261030100000_module_access_foundation.sql`
2. `20261030110000_identity_verification_workflow.sql`
3. `20261030120000_harvest_direct_posting.sql`
4. `20261030130000_employer_identity_module.sql`
5. `20261030134732_revoke_trigger_only_function_execute.sql`
6. `20261030134847_revoke_client_writes_to_grants_and_audit_events.sql`
7. `20261030140200_fix_admin_user_roles_global_scope.sql`
8. `20261030140500_make_admin_role_scope_nullable.sql`

Do **not** replay Test-only fixture migrations (`test_fixture_core_schema`, `test_fixture_profiles_rls_hardening`, `test_fixture_signup_trigger`, `test_fixture_owner_select_policies`) to Production. They exist only to build the isolated test schema.

The last two migrations repair the global-scope Super Admin assignment model: `admin_user_roles.scope_id` is nullable and the table uses a surrogate primary key.

## Security and Performance Advisor hardening (follow-up release)

The follow-up migration `20261030150000_security_performance_advisor_hardening.sql` was applied after the eight feature migrations and is recorded in Production migration history.

- The Production preflight found 42 public `SECURITY DEFINER` functions executable by API roles (the 6 anonymous findings overlap with the authenticated list). The migration moves the original implementations into the non-exposed `private` schema and recreates the same public RPC signatures as `SECURITY INVOKER` facades, preserving each function's existing EXECUTE ACL, argument defaults, return shape, volatility, and original authorization logic.
- The trigger-returning `enforce_seller_product_moderation()` helper (no current trigger dependency was found) is moved to `private` with client EXECUTE revoked.
- Keep `private` out of the PostgREST exposed-schema allowlist (the normal exposed schemas are `public` and `graphql_public`). Do not add `private` to the API schema configuration.
- Eleven missing foreign-key indexes are added.
- The duplicate permissive SELECT policy pairs on `job_posts` and `job_applications` are consolidated while preserving anonymous published-job access, employer ownership access, and legacy admin visibility.
- Do not drop the 85 INFO-level unused-index candidates solely because current scan counters are zero. The count includes the 11 newly added FK indexes and indexes on recently added modules, low-volume tables, uniqueness constraints, and expected queue/query paths. Review after a representative 30-day workload window and query-plan evidence.
- One Security Advisor warning remains: leaked-password protection is disabled. This is an Auth setting, not SQL. Supabase documents it as available on Pro and above; enable it in Auth settings if the project plan supports it and verify signup UX. See https://supabase.com/docs/guides/auth/password-security.

The migration was dry-run inside a transaction on Production, then applied after feature-branch CI passed. Post-apply checks confirmed 0 public API-callable SECURITY DEFINER functions, 42 private implementations, 41 public invoker RPC facades, all 11 FK indexes, and consolidated SELECT policies. Security Advisor now reports only the leaked-password Auth setting; Performance Advisor reports only INFO-level unused-index candidates (85).

## Release gates

1. The nine migrations are recorded in Production history through `20261030150000`.
2. Confirm `private` remains absent from the PostgREST exposed-schema allowlist.
3. Verify the 41 public RPC facades are `SECURITY INVOKER`, their private implementations retain their original guards, and the trigger-returning helper is not client-executable.
4. Verify all 11 foreign-key indexes exist and job SELECT policy pairs are consolidated.
5. Security Advisor: no anonymous/authenticated SECURITY DEFINER RPC findings remain; only leaked-password protection is outstanding.
6. Performance Advisor: no unindexed-FK or duplicate permissive-policy findings remain; 85 INFO unused-index candidates are retained pending workload evidence.
7. Verify the 15 Global Super Admin capabilities remain active and ordinary users cannot self-assign admin roles or module grants.
8. Feature-branch CI passed on commit `0087899bf315c85e2792e41ad9ecb95dbf91d37e` (run 1727).
9. Run smoke tests for Plant Market, Marketplace, Sell Harvest, buyer demands, identity evidence upload/review, and admin permission checks.
10. No Vercel Production deployment was needed for this database-only hardening change.

## Rollback strategy

Prefer a **forward fix** over dropping the new schema. The migrations create additive tables/columns and private evidence storage; do not drop these objects during an application rollback because they may contain submitted evidence, audit history, or grants.

If the application must be rolled back to the pre-feature behavior:

1. Roll back the Vercel application to the last known-good Production deployment.
2. Apply this policy rollback SQL to restore the previous Product/Harvest RLS behavior. The baseline Production database did not have these new module-access restrictive policies:
   ```sql
   drop policy if exists products_module_access_insert_guard on public.products;
   drop policy if exists products_module_access_update_guard on public.products;
   drop policy if exists products_module_access_delete_guard on public.products;
   drop policy if exists harvest_module_access_insert_guard on public.harvest_listings;
   drop policy if exists harvest_module_access_update_guard on public.harvest_listings;
   ```
3. Keep the existing harvest moderation trigger and owner policies; do not disable or drop moderation protections.
4. Keep the private identity bucket, new tables, additive columns, and security revocations in place. They are safe to leave unused and may contain data.
5. If the new Super Admin assignment itself must be withdrawn, delete only the confirmed user's row from `admin_user_roles`; do not change their pre-existing `profiles.role` value without separate approval.
6. Verify the original product/harvest owner workflows and moderation behavior after rollback.

Do not use a blanket `DROP TABLE`, `DROP COLUMN`, or full database restore as the first rollback action. A full restore is a last resort and requires an explicit incident decision because it can discard writes made after the restore point.

## Known release blockers / caveats

- One Auth warning remains because leaked-password protection is disabled; the Supabase dashboard setting requires Pro or above.
- No Vercel Production environment or deployment has been changed as part of the database review.
- The isolated Test Supabase retains its own fixture schema; do not replay those fixture migrations into Production.
- The Advisor hardening migration is applied and reconciled to version `20261030150000` in Production.
- 85 INFO-level unused-index notices are intentionally retained until representative workload statistics are available; see the follow-up Advisor section.
