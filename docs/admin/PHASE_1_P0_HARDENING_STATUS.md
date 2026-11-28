# AGRIVA Admin — Phase 1 P0 Hardening Status

**Snapshot:** 2026-11-28  
**Branch:** `feat/admin-p0-permission-hardening`  
**Stacked PR:** [#411](https://github.com/agrivacombd/agriva/pull/411) targeting `feat/admin-dashboard-premium-redesign` (PR #410)  
**Base commit:** `4a78149c0da2ff3ff484ee177b4d155fd356c494`

## Implemented in this branch

1. **COD reconciliation**
   - The Server Action and visible collection form now require delegated `payments.reconcile`.
   - Ordinary `orders.transition` no longer authorizes the COD collection action.
   - The database migration changes `record_cod_collection` to independently check `has_admin_permission('payments.reconcile')`.
   - Amount validation rejects negative, non-finite, over-range and more-than-two-decimal values.
   - The checkout row remains locked with `FOR UPDATE`; collection event, checkout/order payment state and central audit row are one transaction.

2. **Seller access**
   - Introduced `seller_access.read` and `seller_access.revoke` delegated capabilities.
   - Legacy `catalog.moderate` admins remain temporarily supported as a compatibility path; authorization lookup failures return 503 rather than falling back.
   - The revoke UI requires an explicit 10–500 character reason.
   - API validates market, seller UUID, organization/global scope and reason.
   - Database RPC independently checks either the legacy admin role or delegated `seller_access.revoke`, prevents a no-op grant revoke from partially updating application state, and writes a central audit event transactionally.
   - New seller capabilities are seeded idempotently to the existing `super_admin` role.

3. **Green Exchange moderation audit**
   - Preserved the existing legacy-admin authorization boundary for the moderation RPC.
   - Added explicit null/enum validation, row locking, and a transactional audit event recording previous and new moderation status.
   - Added static regression coverage for the Server Action capability and database guard.

4. **Additional privileged mutation audit coverage**
   - Added transactional audit events for Green Exchange listing moderation, marketplace product shipping changes, bulk quote/request moderation, bulk fulfillment transitions, and wholesaler verification/status changes.
   - Added explicit null/input validation to these RPCs, preserved their existing legacy-admin guard, and upgraded their fixed search paths to put `pg_catalog` first.
   - Bulk quote moderation now locks both the quote and its parent request before applying eligibility checks.
   - Added a synthetic schema fixture and behavior assertions for the COD, seller revoke, Green Exchange, shipping, and bulk workflows. CI now applies the three Admin P0 migrations only to its disposable local Supabase database.

5. **RLS event-trigger exposure**
   - Read-only advisor metadata showed `public.rls_auto_enable()` is a live `ddl_command_end` event-trigger function and inherited client EXECUTE exposure was reported.
   - Migration revokes EXECUTE from `PUBLIC`, `anon` and `authenticated`; the PostgreSQL event-trigger binding itself is left intact.

6. **RLS no-policy tables**
   - Read-only privilege checks confirmed all five advisor-listed tables (`buyer_demand_rfq_conversions`, `crop_health_feed_slug_registry`, `marketplace_order_idempotency`, `product_rank_daily_metrics`, `product_rank_events`) deny SELECT/INSERT/UPDATE to both `anon` and `authenticated`.
   - These are currently server-only/private tables; no permissive policy was added.

7. **Intentional public SECURITY DEFINER reads**
   - `get_green_impact_metrics()` returns aggregate counts only.
   - `get_ranked_marketplace_products()` and `get_ranked_plant_market_products()` return public active catalogue fields with a hard upper limit of 1,000 rows.
   - These three public functions were not blindly revoked because public site/catalogue workflows rely on them. Their returned columns and filters were source-reviewed; independent response tests remain required.

## Regression coverage added

- `scripts/smoke-admin-p0-permission-hardening.mjs`
- `npm run test:admin-p0-hardening`
- GitHub Actions CI step: **Admin P0 delegated permission and audit regression test**

Latest GitHub Actions run [46128615121](https://github.com/agrivacombd/agriva/actions/runs/46128615121) passed: lint, TypeScript, existing Admin authorization regression, new P0 hardening regression, Plant Market regression, production build, isolated local Auth/PostgREST integration, and application build against isolated Supabase. Follow-up Green Exchange and bulk workflow audit migrations, synthetic fixture/assertions, and a CI step that applies them to disposable local Supabase have since been committed; those new gates require the current CI run.

## Remaining P0 gates — not yet signed off

- Review all 38 authenticated-callable SECURITY DEFINER functions individually for caller identity, owner/scope checks, input bounds, fixed search_path, grants and intended API exposure. The Admin RPC sample is not a substitute for the full project inventory.
- Run anonymous Auth user, ordinary authenticated user, legacy admin and delegated-admin negative tests against every flagged policy and Storage path. Supabase's `authenticated` database role can include anonymous Auth users, so policy names alone do not establish a bypass.
- Exercise COD and seller-revocation RPCs in an isolated database with synthetic rows, including duplicate requests, concurrent collection, over-collection, wrong market/scope, revoked/expired capability and audit rollback.
- Verify every admin route, Server Action, API and RPC with role/capability matrices before declaring authorization parity.
- The migration is committed to this branch only. It has not been applied to Production or any connected Supabase database. No production data, schema, configuration or deployment was changed.
- The current execution environment has no repository checkout or Supabase CLI binary; the migration file was added through the GitHub repository API and still requires CLI/local-database validation before any rollout.

## Release decision

**Not approved for production.** Merge only after CI is green, an independent review approves the stacked PR, the migration passes isolated database validation, and the remaining P0 authorization tests are complete.
