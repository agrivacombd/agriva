# AGRIVA Super Admin Audit — Draft

**Scope:** Repository/static review of `main` plus the proposed Command Center branch. This is not a live authenticated production crawl, penetration test, or proof of the current production database schema.

## Current implementation state

- Command Center UI is proposed in draft PR #99: https://github.com/agrivacombd/agriva/pull/99
- The earlier UI-only head `fd137bc28a1a316bb1645b46d5e0435102014e24` passed CI (run 40409711290), but later audit and CSV-fix commits changed the branch. CI for the current final head has **not yet been confirmed**; do not treat the earlier pass as final validation.
- No merge, production deployment, database write, migration, role change, or publication was performed.
- Existing admin routes are separate modules; the Command Center is a navigation/overview layer, not yet a unified CRUD system.

## Route inventory observed on main

### Admin pages
- `/admin`
- `/admin/ai-content`
- `/admin/articles`
- `/admin/audit`
- `/admin/categories`
- `/admin/content-drafts`
- `/admin/content-studio`
- `/admin/harvest`
- `/admin/jobs`
- `/admin/opportunities`
- `/admin/orders`
- `/admin/products`
- `/admin/reports`
- `/admin/search-intelligence`
- `/admin/search-intelligence/opportunities`
- `/admin/settings`
- `/admin/transport`
- `/admin/users`

### Admin and business API routes observed
- `POST /api/admin/article/generate`
- `POST /api/admin/content-brief`
- `POST /api/admin/content-drafts/generate`
- `GET/PATCH /api/admin/content-opportunities`
- `POST /api/checkout`
- `POST /api/ai`
- `GET /admin/reports/orders.csv`
- `POST /admin/content-drafts/publish`
- SSLCommerz init/callback/IPN routes and a separate shared-secret payment webhook.

## Findings and recommended priorities

### P1 — Verify content-draft generation endpoint authorization
The visible prefix of `app/api/admin/content-drafts/generate/route.ts` contains AI/template generation helpers and a POST handler, but the fetched excerpt was truncated before the handler's authorization and persistence logic could be verified. Do not assume it is protected until the full handler is reviewed. Test unauthenticated, ordinary-user, and admin requests.

### P1 — Validate payment callback and status transitions end-to-end
Payment code is security-sensitive. The SSLCommerz init route checks authenticated ownership and pending state, but callback/IPN validation and idempotent order updates must be audited together against the provider's official verification protocol. Never trust browser redirect parameters alone to mark an order paid. Keep online payment disabled until sandbox-to-live validation is documented.

### P1 — Verify database/RLS and RPC authorization
Several admin actions call privileged RPCs, including `admin_update_product`, `admin_set_product_taxonomy`, `admin_set_user_role`, and `admin_update_site_setting`. Confirm each function's grants, security-definer/search_path behavior, caller-role checks, and audit logging in the correct Supabase project (`utytcoxpjnoanqffkqft`). Static route guards do not replace database authorization/RLS.

### P1 — Confirm publishing semantics
`POST /admin/content-drafts/publish` checks admin role and requires an approved draft, then changes the row status to `published`. Verify the public content query reads only published rows, the publication update is atomic, and audit logging records who published what. A status update is not sufficient if the public rendering pipeline uses a separate articles table or cache.

### P2 — CSV spreadsheet formula injection hardening — mitigation added, tests still needed
The orders CSV route now prefixes potentially dangerous leading formula/control characters before quoting and fails closed if the profile-role lookup errors. This is a defensive mitigation; add regression tests against leading whitespace, `=`, `+`, `-`, `@`, tab, and carriage return, and validate behavior in supported spreadsheet consumers.

### P2 — Standardize admin authorization/error handling
Admin pages commonly check `auth.getUser()` and `profiles.role`, but some paths ignore profile-query errors while others fail closed. Standardize a shared server-only `requireAdmin` helper and use consistent 401/403/redirect behavior. Ensure every Server Action repeats authorization inside the action, not only in the page.

### P2 — Input bounds, rate limits, and safe diagnostics
Apply payload-size and length limits to all AI/content endpoints; rate-limit costly generation routes; avoid returning raw database/provider errors to clients. `/api/ai` is public-facing and has a 2,000-character question limit, but should also have abuse/rate controls appropriate to cost and traffic.

### P2 — Make draft/live state explicit in every module
Product status, moderation, editorial approval, and publication are different states. Add explicit state badges, filters, timestamps, author/reviewer fields, and safe preview links. Do not make a draft public merely because an admin page links to it.

### P3 — Improve operational observability
Add a dashboard health check for critical RPCs, schema compatibility, payment callback readiness, and last successful background job. Do not expose secrets or sensitive customer data in health output. Record privileged actions in an append-only audit log and alert on role/payment/settings changes.

## Command Center navigation check

The following linked pages were present in the observed `main` tree: products, orders, categories, harvest, users, transport, content studio, content drafts, articles, AI content, search intelligence, opportunities, settings, audit, reports, and jobs. The Product SEO Studio link intentionally points to draft PR #98 because that route is not on `main` yet. The commission/payout tile points to the legacy `/admin` overview; it should be relabeled as a shortcut until a dedicated verified module exists.

## Validation checklist before approval

- [ ] Review the complete handler body of every API route and Server Action.
- [ ] Run CI on the exact final head SHA and inspect all jobs.
- [ ] Add unit/integration tests for admin/non-admin/anonymous access.
- [ ] Add CSV formula-injection tests.
- [ ] Verify RLS, grants, RPC definitions, and schema on the confirmed production Supabase project using read-only inspection first.
- [ ] Test publishing with draft/approved/published states and public rendering.
- [ ] Test payment callbacks in sandbox, including duplicate, invalid-signature, wrong-amount, wrong-order, and replay scenarios.
- [ ] Manually test mobile and desktop layout and every Command Center link.
- [ ] Review privacy, audit logging, rate limits, and error redaction.
- [ ] Obtain explicit approval before merge, deployment, or any production migration.

## Research references

- Next.js authentication and authorization: https://nextjs.org/docs/app/guides/authentication
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html


## Full site inventory — routes/tools that must not be omitted

The repository tree also contains public and authenticated experiences beyond `/admin`. These must be included in the full access map and not silently treated as admin features:

- **Core/public:** home, about/contact, privacy/terms, login/signup/auth callback, search, blog index/detail, learn index/detail, plant-disease/science learning, farms, buyer demands.
- **Marketplace & commerce:** marketplace index/product/category/subcategory, buy, cart, checkout, orders, reseller referral redirect, reseller dashboard/earnings, farmer dashboard/orders/products, sell-harvest.
- **Jobs & transport:** jobs index/detail, application, job posting, CV builder, transport page and booking workflow.
- **Agriculture tools:** tools index plus AI farm assistant, AI search intelligence, crop calendar, crop choice simulator, crop disease assistant, crop market price, crop profit calculator, farm cost calculator, farm diary, farm weather, fertilizer calculator, harvest date, irrigation water, seed rate; also standalone crop calendar/disease, market prices, soil/fertilizer planner and weather routes.
- **API endpoints:** admin article generation, content brief, content-draft generation, content-opportunities; public AI answer, crop disease, farmer products, health, search, checkout; SSLCommerz init/success/fail/cancel/IPN, payment webhook, reseller links, auth callback.
- **Database migrations:** the repository contains migrations 001–027 and later timestamped migrations covering core schema, marketplace/order/payment, commissions/payouts, search/content drafts, admin RPCs/settings/categories, transport, learning corrections, jobs, role memberships, RLS/performance and payment/payout integrity. They are repository history, **not proof those migrations have been applied to the production Supabase project**.

## Draft/live/tool completeness requirements

For every content, product, job, harvest, category, learning and site-setting module, map each entity's actual lifecycle from database and UI: draft, pending review, approved, published/active, rejected, paused/unpublished, archived/deleted where supported. Verify which states public pages and sitemap/search APIs actually expose. The command center must link to draft queues and preview/revision history, not just live pages.

For every agriculture tool, inventory: page route, component, API/dependency, data source, authentication requirement, input validation, error/empty state, mobile layout, analytics/privacy, and whether the result is persisted or only client-side. Tools are user-facing capabilities, not automatically admin-controlled modules; do not add privileged controls to them without a defined need and authorization model.

For every route and Server Action, record: anonymous behavior, regular-user behavior, admin behavior, database/RPC permissions, writes/side effects, cache/revalidation behavior, audit event, input bounds, abuse/rate limits, and tests. Use an explicit matrix so no route is silently skipped.

## Exhaustive audit checklist

- [ ] Enumerate every route from the complete repository tree, including dynamic routes, route handlers, Server Actions, middleware, cron/background tasks, and external webhooks.
- [ ] Enumerate all tables, views, RPC/functions, triggers, RLS policies, storage buckets, and environment-dependent integrations from migrations and read-only production metadata.
- [ ] Compare migration files to the confirmed production Supabase project; never infer applied state from filenames.
- [ ] Build an entity-by-entity live/draft/review/published state map and check public exposure.
- [ ] Audit every agriculture tool and its upstream data/API, rate/cost controls, privacy, accessibility, and mobile behavior.
- [ ] Check every Command Center link against an actual route or clearly marked external draft PR; label placeholder shortcuts honestly.
- [ ] Validate each sensitive operation against anonymous, normal-user, and admin sessions; inspect RPC grants and RLS.
- [ ] Verify payment callbacks/webhooks, idempotency, amount/order binding, replay handling and provider signature protocol.
- [ ] Verify admin audit logging, role changes, payout/payment/settings operations, CSV export safety, and error redaction.
- [ ] Run CI and tests against the exact final PR head; manually test mobile/desktop and all routes.
- [ ] Keep the work draft-only until explicit approval; no merge/deploy/migration or production writes without permission.
