# AGRIVA — Live Launch Master Plan

**Status:** Planning baseline; not evidence that every feature is implemented or production-ready.  
**Repository:** `agrivacombd/agriva`  
**Production safety rule:** No production database migration, destructive change, PR merge, or production deployment without explicit user approval after the change and validation results are presented.

## Goal and definition of done

AGRIVA is ready for public launch only when the following end-to-end journeys work in a production-like staging environment, all required security checks pass, and launch approval is explicitly given:

1. A user can register/sign in, recover access, sign out, and reach only their permitted workspace.
2. Admin can safely manage users, roles, product categories, products, orders, settings, reports, seller verification, and moderation.
3. An authorized seller can create, edit, submit, publish (if permitted), inventory-manage, and archive a product with images, category, price, unit, stock, and delivery details.
4. A buyer can discover/search/filter products, view details, add to cart, complete checkout, see order status, and receive notifications.
5. Order stock, payment status, commission, cancellation, refund, and audit history remain consistent under retries and errors.
6. Any payment is marked paid only after server-side provider verification against the stored order, amount, currency, and transaction state.
7. Role-based routes and server actions reject unauthorized access even when called directly; RLS and grants are tested.
8. Mobile and desktop UX, accessibility basics, performance, error states, backups, monitoring, and rollback procedures are verified.
9. Production secrets, email/SMS delivery, domain, analytics/monitoring, and legal/support content are configured.
10. A named launch owner accepts the remaining risks and explicitly authorizes release.

## Work phases and exit gates

### Phase 0 — Establish the truth (audit and release baseline)
- Inventory main branch, open PRs, deployment state, workflows, dependency manifests/lockfiles, environment variables (names only), Supabase migrations, RLS policies, storage policies, auth configuration, payment routes, and current user journeys.
- Classify each feature as: implemented and verified, implemented but unverified, partial/UI-only, missing, or blocked by credentials/provider.
- Reproduce the install, lint, typecheck, tests, and production build in a clean environment. Confirm the supported Node/package-manager versions and commit a reproducible lockfile if absent.
- Run migrations against a disposable local/staging database from an empty state; do not use production for exploratory testing.
- Resolve CI failures and identify whether legacy preview providers/checks are still required.
- **Exit gate:** a written audit with owners, priorities, reproducible commands, test results, and no unknown migration chain.

### Phase 1 — Security and platform foundations
- Verify Next.js/React and all dependencies against current supported security releases; upgrade deliberately and test compatibility.
- Review server/client boundaries, secrets, cookies/session handling, auth callbacks, CSRF exposure, rate limiting, input validation, error leakage, and logging of personal data.
- Verify Supabase RLS and table grants together; audit SECURITY DEFINER functions for pinned search_path, qualified objects, narrow EXECUTE grants, and explicit authorization checks.
- Review Storage upload/read policies, MIME/size constraints, file paths, and ownership.
- Establish staging/prod environment separation, backup/restore drill, migration procedure, rollback plan, and monitoring.
- **Exit gate:** critical/high security findings fixed or explicitly blocked from launch; clean migration test and backup restore evidence.

### Phase 2 — Authentication, roles, and account lifecycle
- Keep existing email/password login and recovery working; configure reliable production SMTP and verification.
- Add phone number + SMS OTP only after provider configuration, delivery tests, anti-abuse limits, CAPTCHA where appropriate, and budget/operational ownership are ready.
- Treat Gmail as an email address unless a separately approved Google OAuth sign-in is implemented; never ask users for their Google password.
- Link email/phone identities only after verified ownership; prevent accidental duplicate accounts and handle recycled phone numbers safely.
- Define and enforce role/permission matrix: visitor, buyer, farmer/seller, reseller, student, agronomist, enterprise/company, moderator/support, admin. Do not grant roles from user-controlled form fields.
- Verify protected routes, server actions, APIs, and database access for every role. Add safe admin role assignment, role-change audit log, disable/suspend, recovery, and logout.
- **Exit gate:** role matrix and negative authorization tests pass; no user can elevate their own role; logout/recovery/identity-linking flows tested.

### Phase 3 — Admin panel as operational control centre
- Standardize admin navigation and visible logout; show signed-in identity and access level.
- Users: search/filter, role assignment, seller verification, suspend/reactivate, account detail, audit trail.
- Products: list/search/filter, create/edit/review/publish/unpublish/archive, category/subcategory, SKU/slug, price/unit, stock, images, seller ownership, featured status, moderation reason.
- Taxonomy: category and subcategory lifecycle, safe deletion/retirement rules, product reassignment safeguards.
- Orders: searchable order details, status transition rules, item snapshots, shipping, payment, cancellation/refund states, and history.
- Finance: commission/payout queues, reconciliation, immutable references, CSV reports and permission checks.
- Platform: content moderation, report handling, settings, announcements, audit log, operational health indicators.
- Every mutation needs server-side validation, permission enforcement, success/failure feedback, revalidation, and an audit record where appropriate.
- **Exit gate:** each admin function passes happy-path, validation-failure, unauthorized, and retry tests.

### Phase 4 — Product catalogue and seller workflows
- Build one canonical product model and align seller product forms, admin forms, APIs, queries, and taxonomy.
- Support multiple images, upload validation, image ordering/cover, drafts, pending review, published, rejected, archived states.
- Make ownership explicit. If multiple seller accounts are introduced, add seller membership and a safe backfill while preserving compatibility with current farmer ownership until verified.
- Add inventory adjustment history and prevent negative/oversold stock; define units, price precision, availability, minimum order quantity, and delivery area.
- Test seller can edit only their own items; admin can moderate all; public users only see approved/published products.
- **Exit gate:** seller and admin product lifecycle works on mobile and desktop with storage/RLS/ownership tests.

### Phase 5 — Marketplace discovery and checkout
- Verify search, categories, filters, sorting, product detail, related items, seller trust information, empty/loading/error states.
- Validate cart persistence and server-side price/stock recalculation; never trust client-supplied totals.
- Test multi-item checkout atomicity, address validation, delivery charges, duplicate-submit prevention, idempotency, order snapshots, stock reservation/decrement/restoration.
- Define cancellation, partial/full refund, out-of-stock, failed payment, and COD flows.
- **Exit gate:** end-to-end buyer journey and concurrency/retry cases pass against staging.

### Phase 6 — Payments, delivery, commissions, and notifications
- Keep online payments disabled until provider sandbox and server-side callback/IPN verification are complete.
- Verify transaction identifier, stored order ID, exact amount/currency, expected pending state, provider signature/status, idempotency, and safe retry behavior before marking paid.
- Browser success redirects are not proof of payment. Reconcile provider events and order records.
- Test COD separately. Test shipment/status updates, cancellation/refund, reseller attribution, commission calculation, payout approval, and immutable payment references.
- Configure email/SMS/WhatsApp or other notifications only for channels with verified provider access and consent; failures must not corrupt orders.
- **Exit gate:** payment sandbox reconciliation, webhook/IPN security, duplicate-event, failure, refund, and commission tests pass.

### Phase 7 — User workspaces and AGRIVA value-adds
- Farmer workspace: profile/farm information, durable farm diary, reminders, crop activity history, orders and seller inventory.
- Agronomist workspace: verified profile, consultation availability, advice history and report/complaint process.
- Student learning: content/catalogue, progress persistence, moderation and clear distinction between educational content and professional advice.
- Reseller workspace: attributed orders, commission ledger, payout requests and status.
- Enterprise/company workspace: verified organization, team permissions, bulk catalogue/order workflows only if validated demand justifies launch scope.
- AI tools: server-side authorization, rate limits, safe fallback, clear limitations, source/provenance for market-price data; no fabricated “live” prices or diagnosis certainty.
- **Exit gate:** each released tool persists data, respects role access, has error/loading states, and is tested; unfinished tools are clearly disabled or marked as preview.

### Phase 8 — UX, content, SEO, and operational readiness
- Bangla-first, responsive mobile layouts, accessible forms, readable errors, low-bandwidth image handling, empty states and loading feedback.
- Validate metadata, canonical URLs, sitemap/robots, structured data where appropriate, product image alt text, and indexation of only public/approved pages.
- Publish accurate About, Contact/support, privacy, terms, returns/refunds, shipping, seller rules, and payment information appropriate to the actual business.
- Configure domain/HTTPS, email sender/domain authentication, error monitoring, uptime checks, analytics with privacy consideration, and support escalation.
- **Exit gate:** mobile/browser matrix, content/legal review, SEO checks, and monitoring alerts verified.

### Phase 9 — Release candidate and pilot
- Deploy a release candidate to staging only; apply migrations only to staging first.
- Run CI, lint, typecheck, unit/integration tests, production build, migration replay, RLS/role tests, payment sandbox, upload tests, end-to-end browser flows, accessibility smoke checks, and mobile testing.
- Seed test users for each role and representative products/orders; test direct URL access and forged requests.
- Conduct a limited pilot with test/approved users, record defects, fix and retest.
- Prepare launch checklist, rollback steps, backup confirmation, support rota, and known-issues register.
- **Exit gate:** all launch-blocking defects closed, evidence recorded, no critical/high unresolved security/payment issues.

### Phase 10 — Production launch and stabilization
- Present release summary, migrations, risks, test evidence, rollback plan, and exact deployment target for explicit approval.
- Only after approval: deploy the approved commit, run approved production migrations in sequence, verify health and critical smoke tests, and confirm domain/auth/payment callbacks.
- Keep online payments disabled if provider verification or reconciliation is not fully ready.
- Monitor errors, login failures, product upload, checkout, payment callbacks, stock, and support reports closely after launch.
- Roll back application or disable affected functionality if critical errors appear; database rollback must follow a tested, safe plan.
- **Exit gate:** production smoke tests pass, business owner confirms, monitoring is stable, and handover/support documentation is complete.

## Priority labels
- **P0 — Launch blocker:** auth bypass/role escalation, data exposure, broken migrations, unsafe payment confirmation, corrupt orders/stock, no rollback.
- **P1 — Core launch:** admin users/roles, product upload/moderation, catalogue, checkout/order management, COD and/or fully verified payment path, support/contact.
- **P2 — Important follow-up:** advanced analytics, enterprise bulk tools, expanded learning/AI features, richer notifications.
- P2 features must not delay the core launch unless explicitly selected as a launch requirement; unfinished features must not be presented as functional.

## Required test matrix
For every role (anonymous, buyer, farmer/seller, reseller, student, agronomist, enterprise, admin), test:
- Allowed and denied routes/actions/API/database operations.
- Authentication, expired session, logout, password recovery and identity verification.
- Product read/write ownership, upload abuse, unpublished product visibility.
- Order creation, duplicate submit, invalid price/stock, cancellation, payment failure/retry and refund.
- Responsive layouts, empty/error/loading states, and safe handling of malformed inputs.

## Operating rules
- Work on feature branches and reviewable PRs; do not commit directly to main.
- Keep changes small enough to test and revert.
- Do not claim a feature is fixed or verified without test evidence.
- Do not paste secrets into code, issues, logs, or chat.
- No production DB change, production migration, PR merge, or production deployment without explicit user approval after the change/test summary.
- External providers (SMTP, SMS, payment, domain) may require account access, verified sender/domain, costs, and user action; mark these as blockers rather than pretending they are configured.

## First execution sequence
1. Verify current main, all open PRs, CI, Vercel deployments, and current production configuration status (read-only).
2. Finish Phase 0 audit with exact commands/results and prioritize P0 items.
3. Fix P0 security/build/migration blockers on isolated branches with tests.
4. Deliver auth/roles, then admin and product lifecycle in small PRs.
5. Complete checkout/payment/operations and all core role journeys.
6. Run release-candidate staging matrix, pilot, and present a launch approval package.
7. Release only after explicit approval; monitor and stabilize.
