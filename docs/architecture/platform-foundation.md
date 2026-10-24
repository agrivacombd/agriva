# AGRIVA Platform Foundation Architecture

Status: proposed implementation baseline. This document does not authorize production migrations or deployment.

## Goals

- Preserve current marketplace, category/SEO, orders, reseller referrals and commissions.
- Use one authentication system with multiple roles and optional business memberships.
- Enforce access in server routes and PostgreSQL RLS; hiding UI is not authorization.
- Add modules incrementally behind migrations and tests.
- Keep production unchanged until explicit release approval.

## Current baseline and constraints

The core schema currently has:
- `profiles.role` using the `user_role` enum: `farmer`, `reseller`, `admin`.
- `farms.owner_id` linked to `profiles.id`.
- `products.farmer_id` linked directly to `profiles.id`.
- Existing `orders`, `referrals`, and `commissions` tables.
- Category/subcategory taxonomy and product mapping added in a later migration.

This means adding company/enterprise values to a role enum alone is insufficient. Product ownership, membership, authorization and historical commerce records need a backwards-compatible migration plan.

## Target logical architecture

### Identity and access
- Supabase Auth remains the identity provider.
- `profiles` remains the personal profile.
- Introduce a role-assignment model only after auditing every existing role check and RLS policy. Avoid an unsafe enum replacement or role migration that can lock users out.
- Define permission helpers for server-side routes and RLS. Admin privileges must be checked on the server/database, never trusted from request payloads.
- A person may have multiple roles (for example, student and farmer).

### Seller/business domain
- `seller_accounts`: an individual-farmer, company, or enterprise seller identity; status and verification metadata.
- `seller_members`: maps users to seller accounts with explicit membership roles such as owner, manager, inventory, and orders.
- `seller_verifications`: review status and references to verification evidence; avoid exposing sensitive documents publicly.
- A farmer can be provisioned an individual seller account with a deterministic, auditable backfill.
- Company/enterprise products belong to the seller account, not to an arbitrary employee profile.

### Commerce compatibility
- Keep current product/category/stock/commission/order/referral behaviour working during migration.
- Introduce nullable `seller_account_id` or a compatible ownership relation first, backfill existing products, validate counts and ownership, then switch application reads/writes.
- Do not remove `farmer_id` until all callers, policies, reports, and historical references have been migrated and verified.
- Preserve order and commission history. Snapshot transaction-critical values where needed so future profile edits do not rewrite history.
- Enforce stock, price, commission and status transitions on trusted server/database paths.

### Role-specific modules (later phases)
- Student: learning resources, course progress, quizzes/projects; no special data table until the first concrete feature needs one.
- Agronomist: profile, qualification verification, advisory requests and moderation.
- Farmer: farms, crop cycles, input/output and expense records.
- Reseller: existing referral and commission flow, regression-tested.
- Company/enterprise: seller dashboard, team permissions, inventory and reporting.
- Admin: category/product moderation, seller verification and audit trail.

## Proposed delivery phases

### Phase 0 — audit and baseline
1. Map routes, APIs, database migrations, RLS policies and all role checks.
2. Record baseline behaviour for auth, marketplace, categories, product detail, orders, referral/commission and admin.
3. Check PR #30 separately; do not assume a preview page load proves authenticated workflows.
4. Confirm staging/production migration history and rollback/backup capability.

Exit criteria: baseline checklist and identified blockers are documented; no production changes.

### Phase 1 — access and seller foundation
1. Write and review a schema migration plan.
2. Add seller account and membership tables with indexes, constraints, RLS and least-privilege grants.
3. Backfill individual seller accounts for existing farmers in a transaction-safe, repeatable migration.
4. Add server-side permission helpers and tests for cross-account access.
5. Keep old product ownership fields until compatibility tests prove the new relation works.

Exit criteria: existing farmers still work; company membership isolation is tested; unauthorized reads/writes are denied.

### Phase 2 — marketplace/admin hardening
1. Validate product image upload, size/MIME checks, storage policies and orphaned upload cleanup.
2. Test admin product creation with an authenticated admin session.
3. Test draft/review/publish transitions, category mapping and SEO/sitemap behaviour.
4. Test integer stock and commission constraints against both API and database.
5. Resolve CI and hosting integration failures rather than suppressing them without evidence.

Exit criteria: end-to-end product creation and publication tests pass.

### Phase 3 — student, agronomist and farmer tools
Ship one module at a time with explicit data ownership, moderation and acceptance tests.

### Phase 4 — company/enterprise portal
Add onboarding, verification, member invitations, scoped permissions and seller-owned inventory/orders. Add branches/warehouses only when requirements justify them.

### Phase 5 — pilot and rollout
Run regression, RLS isolation, migration, backup/restore, monitoring and rollback checks. Release to production only after explicit approval.

## Security and operational invariants

- Never expose Supabase service-role credentials to the browser.
- Every private table has RLS and tested policies.
- Every privileged API verifies the authenticated user and permission server-side.
- Storage upload validates MIME and actual file type/size; public URLs are not proof of ownership.
- Seller membership changes and privileged admin actions should be auditable.
- Migrations must be additive first, repeatable where practical, and have a documented rollback/forward-fix plan.
- Production schema changes and deployments require explicit release approval.

## Acceptance checklist for each pull request

- [ ] TypeScript/lint/build and existing smoke tests pass.
- [ ] Migration applies cleanly to a disposable/staging database.
- [ ] RLS tests cover owner, member, unrelated user, anonymous user and admin.
- [ ] Existing farmer/reseller/order/commission flows pass regression tests.
- [ ] Authenticated end-to-end tests cover the new user journey.
- [ ] SEO/category routes and sitemap are not regressed.
- [ ] Rollback or forward-fix steps are documented.
- [ ] Production deployment is not triggered without explicit approval.
