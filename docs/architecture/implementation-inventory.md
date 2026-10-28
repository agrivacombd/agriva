# AGRIVA Architecture Implementation Inventory

**Baseline ref:** `feat/super-admin-audit-dashboard`  
**Baseline commit:** `ab2f9c0cdda80b3bbcb5ee71ce510b8d92472fda`  
**Reviewed:** 2026-10-29  
**Purpose:** Living Phase A inventory for the AGRIVA Platform Architecture: Roles, Access, and Connected Workflows. This is a gap register, not a declaration that the platform is release-ready.

## Architecture invariants

- One authenticated identity across public, customer, seller, and staff workspaces.
- Deny by default; UI visibility is never authorization.
- Enforce permissions in server handlers/actions, RPCs, RLS, and Storage.
- Super Admin governance is separate from scoped operational permissions.
- Seller products and editorial content require review before public publication.
- Consequential role, moderation, finance, and settings changes must be auditable.
- Additive migrations are validated against staging before production.
- Release requires CI, security/isolation tests, exact-commit preview verification, and rollback readiness.

## Repository baseline

At the baseline commit, the repository tree contains:

| Area | Inventory count | Notes |
| --- | ---: | --- |
| Tracked repository files | 371 | Includes application, scripts, migrations, and configuration |
| API route handlers | 18 | Includes checkout, product creation, payment callbacks, reseller links, content APIs |
| Admin page routes | 22 | Includes access, moderation, content, products, orders, reports, settings, users |
| Supabase migration files | 82 | Legacy and dated migrations; must be replayed/validated as a sequence |
| Security/regression test-like files | 24 | Mix of smoke scripts and SQL checks; not all are true integration tests |

## Phase A — route and workflow inventory

### Public and customer journeys

- Public discovery: `app/page.tsx`, `app/marketplace/**`, `app/blog/**`, `app/articles/**`, `app/jobs/**`, `app/learn/**`, public tools and informational routes.
- Customer account and orders: `app/dashboard/**`, `app/profile/page.tsx`, `app/orders/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx`.
- Checkout API: `app/api/checkout/route.ts`.
- Payment callbacks: `app/api/payment/sslcommerz/{init,success,fail,cancel,ipn}/route.ts`; generic webhook at `app/api/payments/webhook/route.ts` is intentionally inert.
- Required checks: subject-scoped order/profile reads, no client-trusted prices/payment status/owner IDs, idempotent payment reconciliation, verified provider signatures, and no private data in public pages.

### Seller, farmer, reseller, and other workspaces

- Seller: `app/seller/page.tsx`, `app/farmer/**`, `app/dashboard/farmer/**`.
- Reseller: `app/reseller/**`, `app/dashboard/reseller/**`, `app/api/reseller/links/route.ts`.
- Transport: `app/transport/**` and admin transport tools.
- Employer/job seeker: `app/jobs/**`.
- Other platform workflows include harvest listings, buyer demands, green exchange/living, learning, and farm records.
- Required checks: every read/write must constrain records and files to the authenticated subject/organization; role overlap must be explicit; cross-account ID substitution must fail.

### Staff and Super Admin

- Staff/admin routes: `app/admin/**`; governance entry points include `app/admin/access/**`, `app/admin/audit/**`, `app/admin/moderation/**`, and `app/super-admin/**`.
- Permission catalogue: `lib/auth/permissions.ts`.
- Server helpers: `lib/auth/server-authorization.ts` and `lib/auth/server-permissions.ts`.
- Legacy role helper: `lib/auth/roles.ts` only describes farmer/reseller/admin route homes.
- Session refresh: `middleware.ts`; it refreshes authentication but is not an authorization boundary.
- Required checks: every route/API/RPC independently authorizes a capability; scoped staff roles must not gain broader permissions through shared admin predicates; role grants and revocations must be auditable and not self-service.

### APIs to audit individually

- `app/api/admin/article/generate/route.ts`
- `app/api/admin/content-brief/route.ts`
- `app/api/admin/content-drafts/generate/route.ts`
- `app/api/admin/content-opportunities/route.ts`
- `app/api/admin/products/route.ts`
- `app/api/ai/route.ts`
- `app/api/checkout/route.ts`
- `app/api/crop-disease/route.ts`
- `app/api/farmer/products/route.ts`
- `app/api/health/route.ts`
- `app/api/payment/sslcommerz/cancel/route.ts`
- `app/api/payment/sslcommerz/fail/route.ts`
- `app/api/payment/sslcommerz/init/route.ts`
- `app/api/payment/sslcommerz/ipn/route.ts`
- `app/api/payment/sslcommerz/success/route.ts`
- `app/api/payments/webhook/route.ts`
- `app/api/reseller/links/route.ts`
- `app/api/search/route.ts`

## Initial findings and known gaps

1. **Authorization helpers are duplicated.** Two server-side permission helpers implement the same profile + membership lookup with slightly different error statuses. Consolidate only after call-site inventory and tests to avoid behavior regressions.
2. **Capability coverage is incomplete.** The typed permission catalogue exists, but the presence of a helper does not prove every route, server action, RPC, RLS policy, or Storage policy uses it. The initial matrix now records API routes, and five admin content/catalog handlers plus reseller-link creation were migrated to shared capability checks with static assertions. Build out the full matrix and test every privileged path.
3. **Legacy role compatibility remains.** `profiles.role`, `user_role_memberships`, and `lib/auth/roles.ts` coexist. Privileged role assignment and public signup must not be allowed to mint staff permissions.
4. **Seller listing edit/resubmit is incomplete.** Dashboard visibility and creation are not the full lifecycle. A secure edit path must only allow owner fields, must not accept status/commission/moderation fields from the client, and must requeue rejected/changes-requested listings for review.
5. **Product moderator scope was found too broad and a fix was added.** The initial trigger used a shared moderation-permission predicate as a broad bypass, conflating product moderators with platform administrators. Migration `20261029170000_separate_moderator_and_admin_scope.sql` narrows the broad branch to platform admin/super-admin, limits moderator changes to review/publication fields, blocks self-moderation, and writes an audit event. The regression smoke test now asserts these boundaries. This is code-level coverage only until CI and staging SQL tests pass.
6. **Payment IPN browser-session dependency was fixed in code.** The callback previously used the cookie-bound anon Supabase client to read/update orders; provider IPNs do not have the buyer's browser session, so RLS could reject valid payments. The route now verifies SSLCommerz remotely and calls the service-role-only `reconcile_sslcommerz_payment` RPC, which locks the order, verifies canonical amount/state, and records the payment transaction and order event idempotently. Staging SQL and SSLCommerz sandbox validation are still required.
7. **Public search moderation leak was fixed in code.** `app/api/search/route.ts` previously selected active products without requiring approved moderation state. It now filters to active + approved and fails closed if the migration is absent. Regression coverage was added. Production catalog search may remain unavailable until the moderation migration is validated/applied through the release process. Storage ownership is not yet fully inventoried. Confirm every private seller/customer media bucket has object-path ownership policies for read, insert, update, and delete; admin-only product image upload is not sufficient to prove seller media isolation.
8. **Finance separation-of-duties needs matrix tests.** Seller earnings, commission ledger, payout request/review/approval, refund, and payment transitions need server/database enforcement, atomicity, idempotency, and audit events.
9. **Staff workspaces are not all implemented.** A role in the catalogue is not evidence that the role has a connected, permission-filtered workspace. Content/SEO, marketing, finance, and support must be checked against their permitted scope.
10. **Staging and release verification are blocked.** Only the production Supabase project is currently connected; migrations have not been applied to production. Do not run unvalidated migrations on production. A staging target and exact-commit Vercel/Netlify preview verification are release gates.

## Phase checklist

- [x] Identify current PR baseline and source commit.
- [x] Enumerate app routes, API handlers, migrations, and existing test files.
- [x] Record initial architectural gaps and high-risk paths.
- [x] Add a scoped moderator/admin database-boundary fix and regression assertions for the discovered role-scope issue.
- [x] Create the initial API route-to-permission matrix and document the remaining authorization gaps.
- [x] Migrate the five inventoried admin content/catalog handlers and reseller-link API to capability-based authorization; add regression assertions.
- [x] Fix provider callback reconciliation to use a service-role-only atomic database RPC and add static regression assertions.
- [x] Ensure public search returns only active, moderation-approved products and add regression coverage.
- [ ] Complete route/server-action/API-to-capability mapping; initial API matrix: `docs/architecture/route-permission-matrix.md`.
- [ ] Search remaining routes and server actions for legacy `profiles.role` checks; migrate each with tests.
- [ ] Verify moderator-scope and payment-reconciliation migrations on a disposable/staging database and run SQL transition tests.
- [ ] Inventory all RPCs, RLS policies, and Storage policies.
- [ ] Reconcile all signup/dashboard role choices against the canonical role model.
- [ ] Add or update integration tests for unauthenticated access, cross-account IDs, role escalation, payment callback replay/races, and fail-closed lookups.
- [ ] Validate migration sequence against a staging database.
- [ ] Verify a deployment preview for the exact release commit.
- [ ] Complete release gates in Architecture Document section 9.

## Delivery sequence

1. Complete Phase A inventory and reconcile authorization findings.
2. Close Phase B authorization gaps and add negative tests.
3. Complete Phase C seller/customer isolation and workflows.
4. Complete Phase D scoped staff workspaces and Super Admin governance.
5. Complete Phase E SEO, analytics, integrations, and operations.
6. Complete Phase F staging, security, rollback, and exact-commit release verification.

Update this file in the same PR whenever a phase item is completed, blocked, or discovered to be incorrect.
