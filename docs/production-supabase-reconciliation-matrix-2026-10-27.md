# Production Supabase reconciliation matrix — 2026-10-27

Status: evidence-based planning only. **No SQL in this document is approved for Production execution.**

Target is the Production-connected Supabase project `dhqaepsbuwhbynagfxpf` (runtime host `dhqaepsbuwhbynagfxpf.supabase.co`). The separate project `utytcoxpjnoanqffkqft` is not a substitute for Production.

## Confirmed findings and migration disposition

| Change / area | Live evidence from read-only inspection | Classification | Safe next action |
|---|---|---|---|
| `20261025110000_agriculture_jobs_marketplace.sql` | `job_posts`, `job_applications`, and `job_moderation_events` are absent in Production; `profiles` has `id, full_name, phone, role, created_at, updated_at`; `public.user_role` labels are `farmer, reseller, admin`. | **Not applied / blocked pending full preflight** | Compare all expected indexes, constraints, triggers, function overloads, grants, RLS and dependencies. Confirm role assumptions and exact migration order. Do not replay yet. |
| `20261026110000_fix_farm_finance_crop_cycle_scope.sql` (PR #67) | Production `farm_expenses`, `farm_sales`, `farms`, and `crop_cycles` exist. Current INSERT/UPDATE policy expressions for expenses and sales contain tautology `c.farm_id = c.farm_id`; they also check the row owner and that the referenced farm belongs to the authenticated user. | **Divergent policy / repair candidate, not release-ready** | Keep PR #67 open. Test policy semantics on local disposable PostgreSQL with two owners, two farms and cross-farm crop cycles. Verify exact policy definitions and role behavior, then reconcile migration history. Do not apply to Production yet. |
| `20261027120000_restrict_payment_event_rpc_grants.sql` (PR #77 merged in repo) | Production has `record_payment_event(uuid,text,text,numeric,text,text,jsonb)`; live ACL is `{postgres=X/postgres,service_role=X/postgres}`. `anon` and `authenticated` cannot execute it; `service_role` can execute it. The function is owned by `postgres`, SECURITY DEFINER, with `search_path=pg_catalog, public, pg_temp`. | **Current effective grants already match the intended least-privilege state** | Do not run this grant migration in Production solely to align history. Record it as effectively equivalent for grants only after reviewing exact function definition and migration provenance; do not mark the migration applied just to silence drift. |
| Role-membership / content-draft migrations | Production lacks `user_role_memberships` and `content_draft_revisions`; it has `content_drafts`. | **Not applied or divergent; exact migration effects unclear** | Inspect each migration and all existing related objects before proposing any replay. Do not infer that missing tables mean the whole migration is safe to apply. |
| Product feature-control objects | Production has `admin_feature_permission_grants`, `product_form_feature_settings`, and `product_subcategories`; these were not found in the separate project's inventory. | **Production-specific until proven otherwise** | Preserve them. Identify their creation history and dependencies; never drop or overwrite to align projects. |

## Farm finance policy evidence

Read-only `pg_policies` inspection found the following predicate shape in the current Production policies for both `farm_expenses` and `farm_sales` INSERT/UPDATE checks:

- The parent record's `owner_id` must equal `auth.uid()`.
- The referenced `farms` row must match the submitted `farm_id` and belong to `auth.uid()`.
- If `crop_cycle_id` is non-null, a crop cycle must exist and its `owner_id` must equal `auth.uid()`.
- The current crop-cycle-to-farm predicate is tautological (`c.farm_id = c.farm_id`) rather than comparing against the expense/sale row's farm.

This is a confirmed integrity-validation defect, but the owner checks mean the read-only evidence alone does **not** prove cross-user data exposure. The intended repair must explicitly compare `c.farm_id = farm_expenses.farm_id` or `c.farm_id = farm_sales.farm_id` and preserve existing owner/farm checks.

## Jobs migration preflight still required

Before considering the Jobs migration, capture and compare:

1. Full `profiles.role` type definition, constraints, triggers and admin authorization function used by `admin_moderate_job_post`.
2. Existing names/signatures for every table, policy, index, trigger and function in the migration, including overloads.
3. Table grants and RLS policies as effective for `anon`, `authenticated`, and server-side roles.
4. Foreign keys to `auth.users`, default extensions/functions such as `gen_random_uuid()`, and trigger dependencies.
5. PostgREST exposed schema / schema-cache state after a reviewed migration only.
6. Preflight assertions that stop if any object is present but semantically different; postflight checks for expected columns, constraints, indexes, grants, RLS and function ACLs.

## Explicit non-actions

- No Production DDL, data writes, grants, migration-history edits, or schema-cache reloads were performed.
- No Supabase branch, test account, test payment, or paid resource was created.
- Do not change Vercel's Production Supabase URL to point at the separate project.
- Do not merge PR #67 until the required policy behavior tests and migration reconciliation are complete.
- Do not mark a migration applied based only on a matching name/version or to silence drift reports.

## Recommended sequence

1. Complete object-level inventory for each migration in the divergent history.
2. Run the farm crop-cycle policy regression scenarios in local disposable PostgreSQL and review PR #67.
3. Produce exact Jobs preflight/postflight SQL and a reviewed recovery plan.
4. Obtain explicit Production-owner approval for the exact commit, SQL plan and maintenance window.
5. Only then consider a narrowly scoped Production migration; stop on any failed assertion.
