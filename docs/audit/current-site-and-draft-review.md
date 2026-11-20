# AGRIVA Current-Site and Draft-Feature Technical Review

Review date: 2026-10-24  
Scope: repository default branch `main`, open draft pull-request metadata and selected diffs, current application routes/components/migrations, official security/payment documentation.  
Important: this is a source review, not a penetration test or proof that the connected production database has every migration applied. No production database change or deployment was performed.

## Executive decision

Do not merge the open feature drafts as a batch. They are overlapping, many are based on different draft branches, and several require schema/runtime proof that is not yet documented. First establish a known-good dependency baseline and migration/test pipeline; then merge narrowly scoped PRs in dependency order.

The highest-priority risks are:
1. Dependency baseline: `main` pins Next.js 14.2.31 and React 18.3.1; there is no committed package lockfile in the repository tree. Official May 2026 Next.js guidance says all Next.js 13.x/14.x versions are affected by that release's security advisories and recommends 15.5.18 or 16.2.6. The draft security PR proposes Next 15.5.28 and React 19.2.9, but it must be independently validated with a deterministic lockfile, build, audit and regression tests before merge.
2. Payment integrity: the current SSLCommerz IPN route validates transaction status/transaction ID but the reviewed main-branch code does not compare the validated amount and currency to the stored order before marking it paid. The success callback redirects to an order URL and must never itself be treated as proof of payment. Keep online payment disabled until the complete provider validation flow passes sandbox tests.
3. Data integrity: current roles are only farmer/reseller/admin, and products are owned through `farmer_id`. Company/enterprise accounts require business ownership and membership, not merely new role labels.
4. Marketplace/checkout: the cart/atomic multi-item checkout PR is still draft and its own description reports that there are no real test users/products/orders in the connected project, the migration has not been applied there, and Vercel deployment was rate-limited. It is not ready to release based on code presence alone.
5. Tool truthfulness: several tools are client-side prototypes rather than persistent or live-data services. Farm Diary keeps entries in React component state; Crop Market Price keeps observations in component state and does not fetch official live market prices; AI Farm Assistant and Crop Disease Assistant UI code currently returns heuristic/local responses rather than a connected personalized AI workflow. These must be labelled accurately until persistence/provider integration is tested.
6. Database security: some historical SECURITY DEFINER functions use `search_path = public`; a hardening migration later changes the path for existing SECURITY DEFINER functions. The exact applied state must be confirmed, and future functions should use `search_path = ''`, schema-qualified names, least-privilege EXECUTE grants and explicit ownership checks. Review table grants as well as RLS policies.
7. Release process: Vercel is the intended app deployment target, while GitHub also shows failing Netlify preview checks for project `agrivaai`. Determine whether Netlify is a legacy integration or a required target; do not blindly suppress checks. Vercel logs show deployment-rate limits, which blocks reliable preview validation until resolved.

## Current repository capabilities (observed in main)

The current tree includes:
- Public site, articles/learning, marketplace/category/product routes and sitemap-related code.
- Auth/profile and farmer/reseller dashboards.
- Farm diary, crop cycle/finance migrations, calculators, crop calendar, weather, irrigation, seed-rate and harvest-date tools.
- AI question/search endpoints, crop-disease endpoint, search intelligence and admin AI/content tools.
- Marketplace order, reseller referral/commission, payout, COD and SSLCommerz route foundations.
- Buyer demand board, harvest listing and transport partner workflows.
- Admin areas for products, categories, users, orders, settings, audit, reports, content and moderation.
- Taxonomy migration 20261024001000 and an open draft PR #30 for dynamic category/subcategory management and admin product creation.

Presence of a route or component does not prove it is database-backed, accurate, accessible to the right role, or production-ready. Each feature needs an explicit status: live and verified, live but partial, local prototype, or planned.

## Open draft review and recommended sequencing

### PR #16 — dependency/security upgrade
Recommended first technical PR after rebase onto current main. It proposes Next.js 15.5.28 and React 19.2.9. Require:
- Commit a deterministic package lockfile and use `npm ci` in CI.
- Run typecheck, lint, build, smoke tests and `npm audit` on the resolved tree.
- Check App Router, middleware/session refresh, route handler signatures and React compatibility.
- Review current security advisories and choose a currently patched supported version; do not treat a one-time version number as a permanent guarantee.
- Keep the PR narrowly scoped; avoid combining application feature changes with dependency changes.

### PR #19 — admin bootstrap, marketplace operations, payment integrity
This branch is based on the dependency-upgrade branch, not directly on main. Rebase after the security baseline is resolved. Review first-admin bootstrap as a one-time privileged operation with strict owner allowlist, atomic “no existing admin” check, audit log and no public ability to grant admin. Payment work must remain separate from admin bootstrap where possible.

### PR #28 — cart and atomic multi-item checkout
High business priority, but not release-ready. Its own PR notes state there are no real test accounts/products/orders, the migrations have not been applied to the connected Supabase database, and deployment was rate-limited. Before merge:
- Create a disposable/staging Supabase project and seed only synthetic test data.
- Apply migrations from a clean database and test upgrade from the current schema.
- Verify cart ownership, active-cart uniqueness, stock locking/contention, all-or-nothing checkout rollback, repeated request/idempotency, seller fulfillment splits and commission invariants.
- Test COD checkout using a real authenticated staging account.
- Validate the RLS and grants for both `carts` and `cart_items`.
- Avoid running production migrations until explicitly approved.

### PR #27 — Plant Science Academy / correction workflow
Useful educational feature. Before merge, test public report abuse/rate limits, PII handling, moderation permissions and the exact-text replacement flow. Approved corrections should have immutable audit history, versioning, preview/diff, rollback and content-owner approval; do not allow a public reporter to directly change published learning material.

### PRs #25–26 — Jobs marketplace and CV builder
Treat as a separate product domain. Job posting/application data includes personal/contact information and approximate location; require moderation, retention/deletion policy, spam controls, application ownership checks and safe contact exposure. CV browser-local storage is not account sync and may be lost or exposed on shared devices; clearly label it and offer explicit export/delete. Do not imply applications are attached to an account unless server persistence is implemented.

### PRs #20–24 and #30 — taxonomy, SEO, product forms
These changes overlap. Avoid merging every branch separately without rebase and deduplication. Select one canonical implementation that:
- Preserves stable slugs and legacy category compatibility.
- Has uniqueness/foreign-key constraints and validates category/subcategory parentage.
- Keeps empty taxonomy pages noindex and out of the sitemap.
- Publishes category pages only when real active/approved products exist.
- Uses admin-only audited RPCs with pinned search_path, narrow grants and validated inputs.
- Tests product-to-category mapping and canonical redirects against seeded data.
- Tests image upload size, actual MIME/signature, authorization, orphan cleanup and publication workflow.

### PRs #17–18 and #31 — audit/architecture docs
Use these as review artifacts, but reconcile their claims with the current main branch and live schema before considering them authoritative. PR #31 is documentation-only and intentionally does not change production.

### Other drafts
PRs #21–22 (seller product form/retail launch), #23–24 (taxonomy/SEO), #14 (homepage quick-start), #5 (sell harvest link), and #3 (Supabase cookie refresh) overlap with other work or depend on the current main branch. Rebase, identify the smallest independent scope, and test each change against the same staging baseline. PR #3 is particularly relevant because session refresh must be verified in middleware and authenticated server routes, not just by a successful public page load.

## Architecture target

### Identity and permissions
- Keep one Supabase Auth identity.
- Keep `profiles` for personal information.
- Model user capabilities as assignable roles/permissions, allowing a person to be both student and farmer.
- Do not trust role values submitted by the browser or rely on hidden UI.
- Centralize server authorization helpers, and enforce database RLS/grants for direct Data API access.

### Business tenancy
Add a business domain in stages:
- `seller_accounts`: seller type `individual_farmer | company | enterprise`, status, public business profile, verification state.
- `seller_members`: user-to-seller membership with owner/manager/catalogue/orders/finance roles.
- `seller_verifications`: restricted evidence references, reviewer, status and timestamps.
- Optionally later `seller_locations` or `warehouses` if multiple branches become a confirmed requirement.

A personal login is not the same thing as a seller account. A company owner and employees authenticate as individuals; access to company data is derived from verified active membership. A user can belong to more than one business if permitted.

### Product and order migration
- Add a nullable `seller_account_id` relation first; keep `farmer_id` during compatibility.
- Backfill individual seller accounts for existing farmers using deterministic mapping and a repeatable migration.
- Validate product counts, ownership mappings, orders and commission relationships.
- Switch read/write paths to seller accounts only after compatibility tests pass.
- Remove legacy ownership only in a later, separately approved migration.
- Preserve historical order/commission facts and make payment/order transitions idempotent.

### Role modules
- Student: learning resources, quizzes, course progress, internships/jobs.
- Agronomist: verified credentials, advisory queue, reviewed answers, citations and feedback.
- Farmer: farm/crop records, input and expense ledger, harvest, market sales.
- Reseller: existing referral/commission model.
- Company/enterprise: seller dashboard, catalog, stock, staff, orders and reports.
- Admin: moderation, seller verification, audit, taxonomy and system settings.

Do not create every future table in one large migration. Add a table when its first concrete feature and access model are defined.

## Feature-truth matrix

- Farm Diary: current UI state is held in component memory; not durable. Persist only after auth, farm ownership and RLS tests exist.
- Crop Market Price: current component holds observations in memory and does not establish a verified official price feed. Label user-entered data with source/date/market/unit and moderation state.
- AI Farm Assistant: current component uses local heuristic responses and a delay; not a connected context-aware model.
- Crop Disease Assistant: current UI is heuristic text matching; the server crop-disease endpoint exists separately and needs authenticated/rate-limited end-to-end integration and safety review.
- Calculator tools: local calculations are suitable as prototypes; validate units, decimal/zero inputs and Bangla/local units before presenting agricultural recommendations.
- Marketplace category pages: taxonomy migration is present in main, but PR #30 is still draft; verify actual product mapping and SEO output on staging.
- Checkout: current single-product COD path exists; multi-item cart PR is separate and unmerged.
- SSLCommerz: keep disabled until amount, currency, transaction ID, order ownership, provider validation status and risk level are all checked against the stored order, with idempotent updates.

## Security design requirements

- Apply RLS to every exposed table and explicitly review table grants; policies do not revoke broad grants by themselves.
- Prefer SECURITY INVOKER. When SECURITY DEFINER is necessary, use `SET search_path = ''`, schema-qualify all objects, revoke EXECUTE from PUBLIC/anon unless needed, grant only to the intended role and perform explicit ownership checks.
- Do not put service-role keys in browser code, public env vars, logs or committed files.
- Protect upload endpoints with size/type/signature validation, generated object keys and owner/admin authorization.
- Add rate limits and abuse controls to public AI, image-analysis, search and public correction-report endpoints; enforce quotas server-side.
- Avoid leaking raw database/provider errors to public clients.
- Use audit events for role changes, seller membership changes, product publication, payouts and payment status changes.
- Ensure tenant-scoped cache keys and server queries include verified membership context.

## Payment integrity requirements

Before enabling online payments:
1. Create the order with a server-calculated amount and immutable currency.
2. Create the provider session server-side with unique transaction/idempotency IDs.
3. Treat browser success/fail/cancel URLs as display callbacks only.
4. Verify IPN with SSLCommerz Validation API.
5. Compare verified status, transaction ID, amount, currency, stored order ID and expected payment state; inspect risk flags and hold high-risk transactions.
6. Update payment and order state idempotently in a transaction; reject replay or mismatched notifications.
7. Log a minimal payment event without storing card secrets.
8. Test duplicate IPNs, mismatched amount/currency, failed/cancelled payments, callback before/after IPN, network timeout and reconciliation.
9. Keep COD as the only enabled method until all the above pass in sandbox and the business approves launch.

## Delivery plan and gates

### Gate 0 — inventory
- Enumerate all routes, API handlers, server actions, DB tables, RLS policies, migrations and external integrations.
- Label each tool as verified/live, partial, local prototype or planned.
- Confirm the actual production migration state using a read-only, authorized method.

### Gate 1 — stable baseline
- Security dependency update with lockfile.
- CI uses reproducible installs, lint/typecheck/build/smoke tests.
- Fix session refresh and route authorization.
- Restore a reliable preview workflow; decide whether Netlify is legacy or required and resolve Vercel deployment quotas.

### Gate 2 — commerce integrity
- Finish taxonomy/admin PR in a single canonical branch.
- Finish cart/atomic checkout on staging.
- COD regression, inventory contention, RLS and commission reconciliation tests.

### Gate 3 — account/business foundation
- Role/permission inventory and seller account schema.
- Additive migration, backfill, RLS tests and dual-read/write compatibility.
- No destructive removal of `farmer_id` until verified.

### Gate 4 — tools and learning
- Persist Farm Diary and crop records.
- Add source-aware market price observations.
- Connect AI tools to server-side providers with quota, citations, safety handling and feedback.
- Ship student and agronomist modules incrementally.

### Gate 5 — company/enterprise
- Business onboarding and verification.
- Staff invitations and role scopes.
- Seller-owned product/order/inventory/reporting.

### Gate 6 — production release
- Staging migration rehearsal, backup/restore, security regression, monitoring and rollback/forward-fix plan.
- Explicit production approval required for each production migration/deployment.

## Minimum release checklist

- [ ] Clean install via lockfile and all CI checks pass.
- [ ] Every migration applies on a fresh staging database and upgrades a representative prior schema.
- [ ] Tests cover anonymous, owner, member, non-member, reseller, admin and disabled/suspended seller.
- [ ] Existing farmer, reseller, order, stock and commission paths pass regression.
- [ ] Cart checkout is atomic and idempotent under concurrency.
- [ ] Payment mismatches and duplicate callbacks cannot mark an order paid twice or incorrectly.
- [ ] AI and upload routes have bounded input, rate limits and safe failure behavior.
- [ ] Prototype tools are clearly labelled and do not imply persistent/live data.
- [ ] SEO URLs, canonical metadata and sitemap are verified against real staged products.
- [ ] Preview deployment and authenticated E2E are working.
- [ ] Backup/restore and rollback/forward-fix procedures are rehearsed.
- [ ] Production changes are explicitly approved.

## Research references

- Next.js May 2026 security release: https://vercel.com/changelog/next-js-may-2026-security-release
- Next.js authentication/authorization guide: https://nextjs.org/docs/app/guides/authentication
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase database function security: https://supabase.com/docs/guides/database/functions
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- OWASP Multi-Tenant Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- SSLCommerz developer docs: https://developer.sslcommerz.com/docs.html


## Additional migration syntax finding

A static scan of `supabase/migrations/013_inventory_commission_orders.sql` shows `CREATE POLICY IF NOT EXISTS`. The documented PostgreSQL `CREATE POLICY` syntax does not include `IF NOT EXISTS`. Treat this as a likely fresh-database migration failure until proven otherwise on a disposable database. Prefer an explicit `DROP POLICY IF EXISTS ...` followed by `CREATE POLICY ...`, or a guarded `DO` block that checks the catalog. Do not patch production directly; validate the full migration chain on a clean staging database first. Reference: https://www.postgresql.org/docs/current/sql-createpolicy.html


## Authentication UX finding and decision

The inspected `app/login/page.tsx` uses `signInWithPassword({ email, password })` and only renders an email/password form. It does not currently offer a phone-number sign-in path in that page. The revised architecture therefore specifies:
- Preserve email/password sign-in (Gmail is simply an email address; AGRIVA must never ask for a Google password).
- Add phone-number SMS OTP as a second sign-in method after staging configuration of Supabase phone auth and an SMS provider.
- Normalize phone numbers to E.164, defaulting the UI to Bangladesh +880 while supporting other countries where needed.
- Avoid silent account duplication or automatic linking based only on an unverified email/phone. Link identities only through a verified flow.
- Add rate limits, CAPTCHA, OTP cooldown/expiry, account recovery, and abuse monitoring. Phone-number/password alone is not the default recommendation because phone numbers can be recycled; if added later, require verification and stronger MFA/risk controls.
- Keep provider configuration and SMS costs separate from code changes; do not claim phone login is live until the provider and authenticated end-to-end tests succeed.

Official references:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/phone-login
- https://supabase.com/docs/guides/auth/auth-identity-linking
