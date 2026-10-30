# Production Release Runbook — Module Access & Identity Verification

Status: **Prepared, not approved/applied to Production**  
Target Supabase project: `dhqaepsbuwhbynagfxpf`  
Feature branch: `feat/security-performance-advisor-hardening`

## Production preflight observed on 2026-10-30

- Production migration history currently ends at `20261030094756 add_marketplace_product_unit`.
- The required feature migrations are newer than that head and are not applied in Production.
- Existing prerequisites verified: `public.farms`, `public.products`, `public.harvest_listings`, and `public.profiles` exist.
- `products.farmer_id`, `harvest_listings.owner_id`, `harvest_listings.moderation_status`, and `harvest_listings.moderation_note` exist.
- Production harvest moderation trigger exists as `harvest_listings_guard_moderation`; it calls `guard_harvest_listing_moderation()`. Preserve it.
- Production `is_admin()` still uses `profiles.role = 'admin'`. The new delegated RBAC permission function is additive and does not replace this legacy check.
- A currently existing Production profile with `role='admin'` is `agriva.com.bd@gmail.com`. Do not grant the new global Super Admin role to any account until the owner confirms the intended email.

## Migration sequence

Apply only these repository migrations, in filename order, after taking a verified database backup/PITR restore point:

1. `20261030100000_module_access_foundation.sql`
2. `20261030110000_identity_verification_workflow.sql`
3. `20261030120000_harvest_direct_posting.sql`
4. `20261030130000_employer_identity_module.sql`
5. `20261030134732_revoke_trigger_only_function_execute.sql`
6. `20261030134847_revoke_client_writes_to_grants_and_audit_events.sql`
7. `20261030140200_fix_admin_user_roles_global_scope.sql`
8. `20261030140500_make_admin_role_scope_nullable.sql`

Do **not** replay Test-only fixture migrations (`test_fixture_core_schema`, `test_fixture_profiles_rls_hardening`, `test_fixture_signup_trigger`, `test_fixture_owner_select_policies`) to Production. They exist only to build the isolated test schema.

The last two migrations repair the global-scope Super Admin assignment model: `admin_user_roles.scope_id` must be nullable, and the table needs a surrogate primary key rather than a composite primary key that forces `scope_id` to NOT NULL.

## Security and Performance Advisor hardening (follow-up release)

After the eight feature migrations, apply
`20261030150000_security_performance_advisor_hardening.sql` as a separate, reviewed migration.

- The Production preflight found 42 public `SECURITY DEFINER` functions executable by API roles (the 6 anonymous findings overlap with the authenticated list). The migration moves the original implementations into the non-exposed `private` schema and recreates the same public RPC signatures as `SECURITY INVOKER` facades, preserving each function's existing EXECUTE ACL, argument defaults, return shape, volatility, and original authorization logic.
- The trigger-only `enforce_seller_product_moderation()` implementation is moved to `private` with client EXECUTE revoked. Existing PostgreSQL triggers keep their function OID.
- Keep `private` out of the PostgREST exposed-schema allowlist (the normal exposed schemas are `public` and `graphql_public`). Do not add `private` to the API schema configuration.
- Eleven missing foreign-key indexes are added.
- The duplicate permissive SELECT policy pairs on `job_posts` and `job_applications` are consolidated while preserving anonymous published-job access, employer ownership access, and legacy admin visibility.
- Do not drop the 74 INFO-level unused-index candidates solely because current scan counters are zero. Most relate to recently added modules, low-volume tables, foreign keys, uniqueness constraints, or expected queue/query paths. Review them after a representative 30-day workload window and query-plan evidence.
- The separate Auth warning for leaked-password protection is not a SQL migration finding; enable it in Supabase Auth settings if the project plan supports it and verify signup UX before rollout.

The migration was dry-run inside a transaction on Production and rolled back after checking wrapper creation, anonymous public RPC behavior, unauthorized admin denial, index creation, and policy consolidation. Apply it only after the feature-branch CI checks pass, then rerun both Supabase Advisors.

## Release gates

1. Confirm a fresh backup/PITR restore point and verify restore access.
2. Confirm the feature branch SHA and all migration filenames match this runbook.
3. Apply migrations one at a time; stop immediately on any SQL error.
4. Verify migration history contains all eight feature migrations.
5. Verify RLS is enabled on all newly created public tables and the private `identity-verification` bucket remains private.
6. Verify `guard_organization_verification()` is not directly executable by `anon` or `authenticated`.
7. Verify authenticated clients cannot INSERT/UPDATE/DELETE `user_module_grants` or mutate `module_access_application_events`.
8. Verify an ordinary authenticated user cannot self-assign admin roles or module grants.\n9. Apply the follow-up Advisor hardening migration only after its CI and database dry-run checks pass; confirm `private` remains unexposed, all public RPC wrappers retain their original grants, and both Advisors are rerun.
10. Seed the `super_admin` role and all 15 declared capabilities, then assign it to the owner-confirmed account only. Keep the existing `profiles.role='admin'` legacy flag intact until a separately tested RBAC cutover.
11. Run smoke tests for Plant Market, Marketplace, Sell Harvest, buyer demands, identity evidence upload/review, and admin permission checks.
12. Promote the application only after the Preview build and production smoke checks pass.

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

- Production Super Admin identity is awaiting owner confirmation.
- The latest Vercel Preview remains on commit `d720928c63d983d67de2264e87423f2656cb354e`; newer SQL-only commits have not received a new Preview deployment because Vercel reported a build-rate-limit failure.
- Test Supabase has the eight feature migrations plus four Test-only fixture entries. Feature migration version IDs were reconciled to repository filenames; fixture entries intentionally remain test-only.
- The follow-up Production Advisor hardening migration is prepared on `feat/security-performance-advisor-hardening`; it has not yet been applied to Production.
- Test Performance Advisor reports existing/unindexed FK and RLS-initplan warnings. These are not migration blockers by themselves, but should be tracked.
