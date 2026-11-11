# AGRIVA — Rebuilt Platform Architecture & Delivery Blueprint

**Status:** Proposed source-of-truth blueprint for implementation.  
**Review date:** 2026-10-24.  
**Release rule:** This document does not authorize merging, production database changes, or deployment.

## 1. Product vision

AGRIVA should become a trusted Bangladesh-first agriculture platform combining:
1. Agriculture marketplace and seller operations.
2. Farmer farm/crop/expense/harvest records.
3. Student learning, quizzes and career resources.
4. Verified agronomist/advisory workflows.
5. Reseller referrals and commissions.
6. Company/enterprise seller accounts with teams and inventory.
7. Source-aware market prices, weather and AI-assisted tools.
8. Admin moderation, verification, analytics and audit.

Do not build all modules in one release. Stabilize the existing marketplace and security foundation first, then add modules behind explicit acceptance criteria.

## 2. Current-state baseline observed from source

- Next.js App Router, React, Supabase Auth/Postgres/Storage, Vercel deployment.
- `app/login/page.tsx` currently signs in with `signInWithPassword({ email, password })`; it has no phone identifier path.
- `profiles.role` currently uses `farmer | reseller | admin`.
- `farms.owner_id` and `products.farmer_id` are profile-linked.
- Marketplace category/subcategory taxonomy exists in migrations; PR #30 contains further admin taxonomy and product creation work.
- Commerce includes orders, reseller referrals/commissions, COD and SSLCommerz route foundations.
- Farm Diary and Crop Market Price currently have component-local state in the reviewed UI. AI Farm Assistant/Crop Disease UI contains heuristic/local response behaviour; presence of an endpoint does not prove complete production integration.
- Multi-item cart/atomic checkout is in a draft PR and must be validated on staging.
- Main pins Next.js 14.2.31 / React 18.3.1; no package lockfile was present in the inspected main tree. Resolve current security advisories and create reproducible CI installs before feature work.
- A static scan flagged `CREATE POLICY IF NOT EXISTS` in migration 013; validate the full migration chain on a clean disposable database before treating it as a confirmed runtime defect.
- Production migration state and full authenticated end-to-end behaviour were not independently confirmed by this source review.

Feature status must be recorded as one of: **verified production**, **partially working**, **local prototype**, **draft**, or **planned**. Never infer production readiness from a page returning HTTP 200.

## 3. Recommended information architecture

### Public site
- Home, category and subcategory landing pages.
- Product listing/detail, search and filters.
- Seller public profile and verification indicator.
- Agriculture knowledge hub, guides and articles.
- Jobs/learning pages where reviewed and privacy-safe.
- Market price/weather pages with source and last-updated time.
- Clear contact, policy, delivery, returns and seller terms.

### Authenticated user workspace
- Profile and security settings.
- Role/workspace switcher (only roles/memberships the user actually holds).
- Buyer orders and saved items.
- Role-specific dashboards.
- Notification centre and account activity.

### Role-specific workspaces
- Student: courses, learning progress, quizzes, projects and career resources.
- Agronomist: verified credentials, advisory requests, answer drafts, citations, feedback and moderation.
- Farmer: farm profile, crop cycles, input/expense ledger, harvest, listings and buyer demand.
- Reseller: existing referral links, attributed orders and commissions.
- Business owner/team: catalogue, inventory, orders, staff, seller profile and reports.
- Admin: products/categories, moderation, seller verification, reports, system settings and audit log.

## 4. Login and account recovery — Gmail/email AND phone

### User experience
Provide one login page with:
- **Email/Gmail + password** tab.
- **Phone number + SMS OTP** tab.
- Optional Google sign-in only after Google OAuth is configured and callback URLs are verified.
- Forgot password, email verification, resend verification and sign-out/session expiry states.
- Bangladesh phone input with country code default `+880`, while allowing other supported countries; normalize to E.164 before sending to Supabase.
- Accessible loading, validation and translated Bangla/English errors that do not reveal whether an account exists.

“Gmail” should mean an email address (including Gmail), not a separate Gmail password. AGRIVA must never ask for a user's Google password.

### Recommended authentication model
- Continue using Supabase Auth as the single identity provider.
- Email/password remains available. Use verified email for sign-up/recovery and configure production SMTP (the default hosted email sender is rate-limited).
- Phone login should initially use **SMS OTP**, after enabling Supabase phone auth, configuring an SMS provider, allowlisting redirect/site URLs, and setting OTP limits/CAPTCHA and monitoring.
- Do not silently create a second profile when a user enters a phone number that may belong to an existing email account.
- Phone and email identities should be associated with the same user only through a secure, verified linking flow. Do not link based on unverified email/phone claims.
- Phone-number + password can be considered later only with a verified phone and MFA/risk controls; phone numbers can be recycled.
- Recovery for phone-only accounts needs an explicit verified recovery path. Encourage linking a verified email as a recovery method.
- Configure rate limits, CAPTCHA/abuse detection, short OTP validity, resend cooldown, session revocation, secure cookies and alerting.
- Admin/business-owner actions, payout changes, role changes and sensitive account changes should require recent authentication and preferably MFA.
- Test both existing accounts and new signups. Keep account/profile creation idempotent so auth callbacks/retries do not create duplicates.

### Login acceptance tests
- Existing email/password account can still sign in.
- Verified phone can receive and verify OTP.
- Wrong/expired/reused OTP fails; cooldown/rate limits work.
- Email and phone for one person do not accidentally create duplicate profiles.
- Unverified phone/email cannot claim another identity.
- Redirect `next` is restricted to safe same-site relative paths.
- Password reset, verification, logout, session refresh and protected-route redirects work.
- Admin/business routes reject unauthorized users server-side and at RLS.
- SMS provider failure is handled gracefully and email login remains available.

## 5. Core logical architecture

```text
Next.js public site + role dashboards
              |
Server actions / API route handlers
              |
Shared authorization + validation + rate limiting
              |
Supabase Auth ---- Postgres (RLS) ---- Supabase Storage
              |
Domain modules:
Identity | Seller/Teams | Catalog | Orders/Payments
Farm Records | Learning | Advisory | Market Data | AI
              |
External providers:
SMS/Email | Payment gateway | Weather/market sources | AI provider
```

### Identity and access tables
- `profiles`: personal profile linked 1:1 to Auth user.
- Prefer a carefully designed `user_role_assignments` or equivalent for multi-role users, but only after auditing all existing enum checks, APIs and RLS policies. Do not blindly replace the existing enum.
- Permission checks are centralized in server-side helpers and mirrored/enforced by database RLS/grants.
- Never trust role, owner ID, price, commission, payment status or seller ID sent by the browser.

### Business tenancy
- `seller_accounts`: individual farmer/company/enterprise seller, public profile, status and verification state.
- `seller_members`: user-to-business membership with scoped owner/manager/catalogue/orders/finance permissions.
- `seller_verifications`: review status, reviewer and private evidence references; evidence must not be public.
- Add `seller_locations`/warehouses only when multi-branch requirements are validated.
- A user authenticates as a person; a business is a separate workspace. Membership is required to access business data.

### Product ownership migration
- Add nullable `seller_account_id` while retaining `farmer_id`.
- Backfill a deterministic individual seller account for every current farmer/product; preserve product counts and ownership.
- Dual-read/write or compatibility mapping only as a temporary controlled transition.
- Validate products, orders, referrals, commissions and policies before switching all queries.
- Remove legacy `farmer_id` only in a later, separately reviewed migration after no callers remain.
- Preserve transaction history and historical commission facts.

## 6. Commerce and payment invariants

- Server calculates final price, discount, delivery charge, commission and currency.
- Checkout is transactional/atomic for multi-item orders; stock is locked or conditionally decremented to prevent overselling.
- Idempotency keys prevent repeated checkout/payment callbacks from duplicating orders or charges.
- Provider success redirect is never proof of payment.
- SSLCommerz validation must match transaction ID, stored order, amount, currency and expected state; updates are idempotent and risk flags are handled.
- Keep online payment disabled until sandbox tests pass for success, fail, cancel, duplicate IPN, mismatch, timeout and reconciliation.
- COD order flow and reseller attribution/commission must pass regression tests.
- Never store card secrets; log minimal payment events and restrict access.

## 7. AGRIVA value-add opportunities

Prioritize only value that can be kept accurate and useful:

### High value / near-term
1. **Bangla-first onboarding and role chooser** with a guided “what do you want to do?” flow. Role choice is not a privilege grant; sensitive roles require verification.
2. **Verified seller profiles and trust signals**: verification date/status, clear contact rules, return/delivery policies, complaint/report action.
3. **Seller response and product quality signals**: accurate stock status, updated date, fulfilment metrics only when enough reliable data exists.
4. **Farm expense and crop diary persistence**: secure cloud sync, export and reminders.
5. **Price observations with provenance**: market, date/time, unit, source, submitter and moderation status. Clearly distinguish user-submitted data from verified source feeds.
6. **Low-bandwidth/mobile-first UX**: compress images, accessible forms, resilient loading, save drafts, clear Bangla errors.
7. **Trustworthy search**: category/product/seller search, spelling tolerance, filters and transparent no-result suggestions.
8. **Notifications**: order status, stock reminders, crop diary reminders and advisory replies; user controls and unsubscribe/preferences.

### Medium-term differentiators
- Agronomist directory with qualification verification, advisory requests, reviewed answers and citations.
- Student learning tracks, quizzes, progress and practical project showcase.
- Buyer demand board that connects verified demand to farmer harvest listings without exposing private phone numbers by default.
- Reseller attribution dashboard with transparent commission calculation and payout status.
- Enterprise bulk catalogue import, staff permissions and stock/order reports.
- Weather/crop-calendar reminders only when the data source, geography, units and freshness are explicit.
- AI farm assistant that answers in Bangla, asks clarifying questions, cites approved content/source, indicates uncertainty and escalates high-risk plant-protection questions to a verified agronomist.

### Avoid until validated
- Claiming AI can diagnose a crop with certainty.
- Showing “live market price” without a live verified source.
- Fake ratings, unsupported “verified” badges or ungrounded rankings.
- Unreviewed pesticide dosage recommendations.
- Complex loyalty/points/crypto features before core commerce is reliable.
- Building a separate login system per role or separate profile for every role.

## 8. Feature data and safety design

- Farm diary/crop records: per-user/per-farm ownership, RLS, timestamps, export/delete.
- Market prices: market, commodity, variety, price, unit, observed_at, source_type, source reference, submitted_by, verification status and moderation audit.
- Advisory: request owner, assigned verified agronomist, response citations, status, user feedback and moderation history.
- AI: server-side provider key, bounded input/output, per-user/IP rate limits, quotas, safe failure, audit metadata and no sensitive data in logs.
- Uploads: size and actual file-type/signature checks, generated object paths, authorization and orphan cleanup.
- Jobs/CV: private applications, minimal contact exposure, explicit export/delete and retention policy.
- Notifications: preference/consent, delivery status and no sensitive content in public URLs.

## 9. Delivery phases

### Phase 0 — audit and reproducible baseline
- Inventory routes, API handlers, migrations, RLS/grants, env vars and external integrations.
- Label each feature verified/partial/prototype/draft/planned.
- Fix dependency security, add lockfile and use deterministic CI install.
- Test session refresh and protected routes.
- Apply all migrations to a disposable staging database; fix syntax/order problems there.
- Confirm hosting provider/check requirements and restore working preview deploys.

**Exit:** baseline build/tests pass; no production change.

### Phase 1 — authentication and access
- Design email + phone OTP login UX and account-linking/recovery rules.
- Configure provider only in staging; test SMS cost/rate limits and CAPTCHA.
- Audit existing role checks; define centralized permissions.
- Test RLS with anonymous, owner, member, unrelated user, reseller and admin.

**Exit:** existing email login unchanged; phone OTP works in staging; no account duplication or privilege escalation.

### Phase 2 — marketplace/admin/checkout
- Canonicalize overlapping taxonomy/product PRs.
- Complete authenticated admin product creation, image upload and publish workflow.
- Fix and test atomic cart/checkout, stock contention and commissions.
- Keep payment disabled until provider validation and reconciliation tests pass.

**Exit:** authenticated E2E and commerce regression pass.

### Phase 3 — seller foundation
- Add seller_accounts/memberships and private verification flow.
- Backfill existing farmers, validate counts/ownership, preserve old fields.
- Build seller workspace switcher and member invitations.
- Test cross-business isolation.

**Exit:** old farmer and reseller workflows still work; company isolation proven.

### Phase 4 — student/agronomist/farmer tools
- Persist Farm Diary and crop records.
- Add source-aware market observations.
- Build learning progress and agronomist verification/advisory.
- Connect AI tools only after provider, quota, source and safety design is accepted.

### Phase 5 — enterprise
- Business onboarding, team roles, catalogue, inventory, orders and reports.
- Add warehouses/bulk APIs only when proven needed.

### Phase 6 — pilot and release
- Staging migration rehearsal, regression, backup/restore, monitoring and rollback/forward-fix.
- Pilot with a small group of consenting users.
- Production migration/deployment only after explicit approval.

## 10. Required engineering standards

- No service-role secrets in browser bundles, committed files or logs.
- Every exposed private table has RLS and reviewed grants.
- Prefer SECURITY INVOKER; where SECURITY DEFINER is needed use empty/pinned search_path, schema-qualified objects, narrow EXECUTE grants and explicit ownership checks.
- Public AI/upload/search/correction endpoints need rate limits and abuse controls.
- Every migration has validation and rollback/forward-fix notes; never use production as a test database.
- CI must run deterministic install, lint, typecheck, build, smoke tests and migration tests.
- Keep preview and production environments separated.
- Monitor auth failures, payment state mismatches, upload errors and API abuse.
- Track acceptance tests and feature status in PRs.

## 11. Release checklist

- [ ] Lockfile committed; clean install and CI pass.
- [ ] Supported patched framework/dependency versions confirmed against current advisories.
- [ ] All migrations apply on clean staging and representative upgrade schema.
- [ ] Email login, phone OTP, recovery, session refresh and safe redirects pass.
- [ ] Account linking cannot take over an unverified identity.
- [ ] RLS/grants tested for all user and tenant types.
- [ ] Existing farmer, reseller, order, stock and commission flows pass regression.
- [ ] Authenticated product image/create/publish workflow passes.
- [ ] Checkout idempotency and stock contention tests pass.
- [ ] Payment mismatch/replay cannot mark an order paid.
- [ ] Prototype tools clearly distinguish local/demo vs persisted/live data.
- [ ] SEO canonical URLs, category pages and sitemap pass with staged products.
- [ ] Preview deployment and authenticated E2E are working.
- [ ] Backup/restore and rollback/forward-fix rehearsed.
- [ ] Production release has explicit owner approval.

## 12. Official technical references

- Supabase password auth: https://supabase.com/docs/guides/auth/passwords
- Supabase phone sign-in: https://supabase.com/docs/guides/auth/phone-login
- Supabase email OTP: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase identity linking: https://supabase.com/docs/guides/auth/auth-identity-linking
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase database function security: https://supabase.com/docs/guides/database/functions
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication
- OWASP Multi-Tenant Security: https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
- OWASP Authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- SSLCommerz developer docs: https://developer.sslcommerz.com/docs.html
