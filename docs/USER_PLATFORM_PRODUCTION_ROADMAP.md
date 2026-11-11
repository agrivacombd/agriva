# AGRIVA User Platform & Production Readiness Roadmap

Status: audit plan; documentation only. No production behavior or database changes are made by this document.

## Product requirements

- Signup/login with email + password and phone OTP.
- Every account has a private profile and durable, user-owned records for farm/crop diary, tool history and saved results, marketplace/cart/orders/wishlist, preferences and notifications.
- One designated Super Admin can manage the platform end-to-end.
- Public production launch only after security, payment, recovery and user-journey checks pass.

## Initial schema inventory (read-only inspection)

Existing public schema includes `profiles`, `farms`, `farm_diary`, `crop_cycles`, farm finance tables, `products`, `orders`, `marketplace_orders`, carts, commissions/payouts, harvest listings, buyer demand, transport bookings/quotes, site settings, content and admin audit tables. RLS is enabled on the inspected tables. Existing migrations include auth/profile trigger, checkout/cart, admin product/user management, site settings/categories, crop disease detections, crop cycles, farm finance, buyer demand, transport and admin transport verification.

Important gaps to verify in code and policy:
- Current `profiles.role` enum is `farmer`, `reseller`, `admin`; it does not currently express a generic `user` or explicit `super_admin`. Do not add roles until every policy, route guard and role assignment path is inventoried.
- Phone OTP is a product requirement but provider configuration, UX, recovery and rate limits must be checked before enabling it.
- User-owned tables for farm data exist; tool history/saved tool results, wishlist, notifications and preference storage need a route/schema-by-schema inventory before deciding whether to reuse or add tables.
- Existing admin pages cover overview, users, products, orders, settings, categories, content, reports, harvest and transport. Menu presence is not proof every CRUD/action is complete.
- Production marketplace currently needs real-user verification of product add/edit/publish and public listing; demo/sample catalog must not be mistaken for real inventory.

## Workstreams and acceptance criteria

### P0 — Account, identity and data isolation
- [ ] Email/password signup, verification, login, logout, password reset and session refresh work on desktop/mobile.
- [ ] Phone OTP sign-in works end-to-end with configured provider, throttling, abuse protections and recovery; no secrets in client code.
- [ ] Profile is created reliably for each auth user; signup metadata cannot self-assign admin/super-admin.
- [ ] Profile edit, logout-all/sessions policy, account deletion/export and privacy notice are documented and tested.
- [ ] Every private row is scoped to `auth.uid()` in RLS and server authorization; user A cannot read/write user B data.
- [ ] Role changes and privileged actions are server/database enforced, not merely hidden in UI.

### P1 — Personal dashboard and durable feature data
- [ ] Farms, crop cycles, diary, expenses and sales save, reload and edit correctly.
- [ ] Each tool that promises history saves a user-owned record; results can be revisited and deleted. Tools that do not save are clearly labelled.
- [ ] Wishlist, cart, orders, profile preferences and notifications persist across devices/sessions where appropriate.
- [ ] Storage policies protect uploaded profile/farm/product images; validate file type/size and access.
- [ ] Empty, loading, offline/error and retry states are handled.

### P2 — Admin and marketplace operations
- [ ] Super Admin identity is provisioned securely out-of-band; public signup cannot promote itself.
- [ ] Admin overview metrics reconcile with database data.
- [ ] Product CRUD: image upload, validation, price/stock, category, draft/publish/pause/sold-out and audit trail.
- [ ] Orders: ownership, state transitions, cancellation/refund rules, stock consistency and notifications.
- [ ] User management: search, view, suspend/reactivate and role controls; destructive actions require confirmation and audit logging.
- [ ] Site settings, homepage/content, categories, harvest listings, buyer demand and transport moderation persist and are authorized.
- [ ] Admin activity log records actor, action, target and timestamp without logging secrets or sensitive payment credentials.

### P3 — Checkout and payments
- [ ] Cart prices/stock are re-read server-side and order creation is atomic or safely idempotent.
- [ ] Partial multi-item failure cannot silently leave an ambiguous cart/order state.
- [ ] SSLCommerz IPN verifies gateway signature/validation, order reference, amount, currency and expected state; repeated callbacks are idempotent.
- [ ] Browser success redirect alone never marks an order paid.
- [ ] COD settings are enforced server-side; refunds/cancellations reconcile stock and commissions.
- [ ] Sandbox tests cover success, failure, timeout, duplicate callback and tampered amount/order IDs.

### P4 — Security, reliability and release
- [ ] Review every SECURITY DEFINER function, execute grants, search_path, input validation and caller identity.
- [ ] Review RLS policies for profiles, farm data, tool history, carts, orders, products, settings and admin audit tables.
- [ ] Run dependency audit and prioritize exploitable production dependencies; keep lockfile reproducible.
- [ ] Add automated unit/integration/e2e tests for auth, user isolation, product CRUD, checkout and admin permissions.
- [ ] Verify backup and restore procedure, monitoring/error alerts, rate limits, secrets, domain/redirect URLs and privacy/legal pages.
- [ ] Run a small beta with test accounts; do not use real payments until sandbox and reconciliation pass.

## Suggested release gates

1. **Audit:** map every route, table, RLS policy, server action/RPC and admin menu to an acceptance test.
2. **Implement:** ship small reviewed PRs, starting with auth/profile and data isolation.
3. **Preview QA:** use separate test accounts (ordinary user, farmer/seller, Super Admin) and sandbox payment credentials.
4. **Production readiness review:** all P0 and payment/security gates pass; backup/rollback prepared.
5. **Controlled launch:** invite a small group, monitor errors/orders, then widen access.

## Safety boundaries

- This roadmap does not authorize production database mutations, payment-provider changes, production deployment, or PR merge.
- Never commit service-role keys, OTP secrets, gateway secrets, passwords, or real customer data.
- Do not grant Super Admin via user-editable metadata or client-side role updates.
