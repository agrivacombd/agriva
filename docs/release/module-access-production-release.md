# Production Release Runbook — Module Access & Identity Verification

Status: **Eight feature migrations and Global Super Admin assignment applied to Production; follow-up Advisor hardening pending CI/release**  
Target Supabase project: `dhqaepsbuwhbynagfxpf`  
Feature branch: `feat/security-performance-advisor-hardening`

## Production preflight observed on 2026-10-30

- Production migration history now includes the eight feature migrations through `20261030140500 make_admin_role_scope_nullable`.
- The required feature migrations are newer than that head and are not applied in Production.
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

After the eight feature migrations, apply
`20261030150000_security_performance_advisor_hardening.sql` as a separate, reviewed migration.

- The Production preflight found 42 public `SECURITY DEFINER` functions executable by API roles (the 6 anonymous findings overlap with the authenticated list). The migration moves the original implementations into the non-exposed `private` schema and recreates the same public RPC signatures as `SECURITY INVOKER` facades, preserving each function's existing EXECUTE ACL, argument defaults, return shape, volatility, and original authorization logic.
- The trigger-returning `enforce_seller_product_moderation()` helper (no current trigger dependency was found) is moved to `private` with client EXECUTE revoked.
- Keep `private` out of the PostgREST exposed-schema allowlist (the normal exposed schemas are `public` and `graphql_public`). Do not add `private` to the API schema configuration.
- Eleven missing foreign-key indexes are added.
- The duplicate permissive SELECT policy pairs on `job_posts` and `job_applications` are consolidated while preserving anonymous published-job access, employer ownership access, and legacy admin visibility.
- Do not drop the 74 INFO-level unused-index candidates solely because current scan counters are zero. Most relate to recently added modules, low-volume tables, foreign keys, uniqueness constraints, or expected queue/query paths. Review them after a representative 30-day workload window and query-plan evidence.
- The separate Auth warning for leaked-password protection is not a SQL migration finding; enable it in Supabase Auth settings if the project plan supports it and verify signup UX before rollout.

The migration was dry-run inside a transaction on Production and rolled back after checking wrapper creation, anonymous public RPC behavior, unauthorized admin denial, index creation, and policy consolidation. Apply it only after the feature-branch CI checks pass, then rerun both Supabase Advisors.

## Release gates

1. Confirm a fresh backup/PITR restore point and verify restore access.
2. Confirm the hardening migration on `feat/security-performance-advisor-hardening` matches the reviewed commit.
3. Confirm `private` is absent from the PostgREST exposed-schema allowlist.
4. Apply `20261030150000_security_performance_advisor_hardening.sql`; stop immediately on any SQL error.
5. Verify the 41 public RPC facades are `SECURITY INVOKER`, their private implementations retain their original guards, and the trigger-returning helper is no longer client-executable.
6. Verify all 11 foreign-key indexes exist and the job SELECT policy pairs are consolidated without changing access.
7. Rerun Security and Performance Advisors and review every remaining finding.
8. Verify the 15 Global Super Admin capabilities remain active and an ordinary user cannot self-assign admin roles or module grants.
9. Run smoke tests for Plant Market, Marketplace, Sell Harvest, buyer demands, identity evidence upload/review, and admin permission checks.
10. Promote the application only if a code deployment is actually required and the Preview build plus production smoke checks pass.

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

- The follow-up Advisor hardening migration is pending its CI/release gate.
- No Vercel Production environment or deployment has been changed as part of the database review.
- The isolated Test Supabase retains its own fixture schema; do not replay those fixture migrations into Production.
- The follow-up Production Advisor hardening migration is prepared on `feat/security-performance-advisor-hardening`; it has not yet been applied to Production.
- INFO-level unused-index notices are intentionally retained until representative workload statistics are available; see the follow-up Advisor section.
