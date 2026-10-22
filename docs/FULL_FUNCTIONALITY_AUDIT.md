# AGRIVA Full Functionality Audit

Baseline: `main` at the time this audit branch was created. This is a code-level audit, not a live production penetration test. Items marked "verify" require tests against a safe staging project and realistic test accounts.

## Priority legend
- **P0**: security, money, data integrity, or release blocker
- **P1**: core user workflow incomplete or unreliable
- **P2**: reliability, performance, usability, or operational improvement

## 1. Authentication and profiles

- [x] `/auth` redirects to `/login`; the old role-selector demo is explicitly disabled (`app/auth/page.tsx`).
- [x] Signup trigger creates a `profiles` row and defaults roles to farmer unless metadata is farmer/reseller (`supabase/migrations/002_auth_profile_trigger.sql`).
- [ ] **P0 — Verify role escalation protection.** The trigger prevents self-admin assignment in a limited condition, but RLS and RPC grants must also prevent changing another user's role/profile fields.
- [ ] **P1 — Profile management gap to verify.** Initial route inventory did not reveal a dedicated `/profile` or `/account` page. Confirm whether users can edit their own full name, phone, address, avatar and preferences.
- [ ] **P1 — Role terminology mismatch.** UI describes Farmer/Buyer in product scope, but database/admin code uses farmer/reseller. Define a canonical role model and migrate UI, authorization checks, and database constraints consistently before adding role-specific flows.
- [ ] Verify signup, email confirmation, login, logout, password reset, session refresh, blocked/disabled account handling and profile creation failure.
- [ ] Verify a user cannot read or mutate another user's profile, addresses, carts, orders, farm records or private data.

## 2. Farmer and buyer dashboards

- [x] `/dashboard` authenticates the visitor and reads their profile name/role (`app/dashboard/page.tsx`).
- [ ] **P1 — Dashboard is currently a general landing view.** Verify and complete role-specific dashboard navigation, profile edit, order history, seller listings, sales/stock status and relevant empty/error/loading states.
- [ ] Verify every linked route is functional for each role and unauthorized roles are redirected server-side, not merely hidden in the UI.
- [ ] Verify mobile and low-bandwidth behavior.

## 3. Marketplace, cart and checkout

- [x] Checkout page requires a signed-in user, reads an active cart and checks the public COD setting (`app/checkout/page.tsx`).
- [x] Checkout API checks authenticated user, validates product ID/quantity/address, and enforces the server-side COD setting (`app/api/checkout/route.ts`).
- [ ] **P0 — Transaction integrity.** Review the complete checkout RPC and SQL migrations for atomic stock validation/decrement, server-authoritative prices, duplicate submissions/idempotency, order ownership, and rollback behavior.
- [ ] **P1 — Multi-item order behavior.** The client loops over cart items and creates orders one at a time, then clears the cart. Test partial failure (some orders created, later item fails) to avoid duplicate/retry and orphaned-cart states; prefer an atomic server-side cart checkout.
- [ ] Verify product visibility, stock/quantity limits, stale cart prices, disabled/deleted products, seller status, order totals and delivery fees.
- [ ] Verify cart quantity update/remove, empty-cart states, refresh persistence and concurrent checkout.
- [ ] Verify order lifecycle transitions are constrained and authorized; customers/sellers must not set paid/delivered/refunded status arbitrarily.

## 4. Payments

- [x] SSLCommerz initialization checks gateway configuration and requires a pending order (`app/api/payment/sslcommerz/init/route.ts`).
- [x] IPN calls the gateway validation endpoint and checks transaction ID (`app/api/payment/sslcommerz/ipn/route.ts`).
- [ ] **P0 — Payment validation completeness.** Verify validated amount, currency, transaction status, bank transaction ID, and order payment reference against the stored order before marking paid.
- [ ] **P0 — Payment update authorization.** Review use of user-session Supabase client in server-to-server IPN; ensure a verified gateway callback can update only its matching order through a narrowly scoped trusted function, with replay/idempotency protection.
- [ ] **P0 — Order ownership.** Payment initialization must reject anonymous callers and require the authenticated buyer to own the order; verify behavior for legacy orders with null `buyer_id`.
- [ ] Verify success/fail/cancel callbacks cannot mark orders paid based only on a browser redirect.
- [ ] Keep online payment disabled until sandbox and live end-to-end tests pass. Never use production credentials in CI.

## 5. Admin panel and permissions

- [x] Admin pages inspected use a server-side auth check and require `profiles.role = 'admin'` for the page itself.
- [x] Admin user role action excludes admin assignment and self-role changes in the UI/server action (`app/admin/users/page.tsx`).
- [ ] **P0 — Every mutation must enforce admin privileges in database/RPC too.** UI checks alone are not authorization. Audit grants, RLS, SECURITY DEFINER functions and search_path settings for every admin action.
- [ ] Verify admin-only routes and APIs for users, products, harvest, orders, transport, settings, reports, content and AI tools.
- [ ] Verify admin mutations write actor, target, timestamp, action and outcome to audit logs.
- [ ] Verify least-privilege role changes, account suspension/reactivation, product moderation, refund/dispute flow, settings validation and CSV export authorization.
- [ ] Verify admin pages handle query parameters correctly under Next.js 15 async `searchParams`.

## 6. Supabase database, RLS and migrations

- [ ] **P0 — Review all policies table-by-table:** profiles, farms, products, carts, cart_items, marketplace_orders, payment records, reseller attribution, site settings, reviews, notifications and audit logs.
- [ ] **P0 — Review SECURITY DEFINER functions:** confirm fixed `search_path`, minimal EXECUTE grants, no user-controlled dynamic SQL, explicit actor/role checks and safe ownership checks.
- [ ] Check migration ordering, fresh-project bootstrap, idempotence where intended, foreign keys, unique constraints, non-negative stock/quantity/amount checks and transaction boundaries.
- [ ] Verify all expected migrations are applied to staging before release; do not run unreviewed schema changes directly on production.
- [ ] Review RLS init-plan/multiple-permissive-policy/unused-index notices individually; do not blindly drop indexes or rewrite policies without query-plan and behavior tests.
- [ ] Add staging integration tests for anon, normal user, farmer/reseller, and admin roles.

## 7. Security, dependency health and CI

- [ ] **P0 — Release gate:** run `npm audit` from a reproducible lockfile and triage each vulnerability; current CI install reported 11 vulnerabilities (3 moderate, 8 high) on the audited dependency set.
- [ ] Add and commit a lockfile; use `npm ci` in CI for reproducible installs.
- [ ] Add automated tests for authorization, checkout tampering, payment replay, invalid input, rate limits and critical API responses.
- [ ] Review secrets and environment variable use; ensure service-role keys never reach client bundles/logs.
- [ ] Fix or explicitly justify React Hook dependency and image optimization warnings.
- [ ] Test production build, smoke tests and staging end-to-end flows before merge/deploy.
- [ ] Use a staged release and rollback plan; no production deploy until checks and review pass.

## 8. Performance and accessibility

- [ ] Measure key routes with realistic data and mobile throttling; inspect database query count, pagination, caching and image sizes.
- [ ] Add pagination to large admin/user/order/product lists and avoid unbounded queries.
- [ ] Verify keyboard navigation, labels, focus management, form errors and Bangla/English text rendering.
- [ ] Verify server errors are logged safely without exposing secrets or personal data.

## Immediate next steps

1. Unblock and pass the Next.js 15 dependency-upgrade build on its isolated PR; do not merge until the complete CI suite passes.
2. Audit checkout SQL/RPC and SSLCommerz validation before feature work because these paths affect money and inventory.
3. Audit profile/RLS and admin RPC permissions, then implement the smallest isolated fixes with tests.
4. Build a staging end-to-end test matrix for farmer, buyer/reseller and admin roles.
