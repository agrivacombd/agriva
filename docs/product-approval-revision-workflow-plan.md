# AGRIVA Product Approval Workflow — Master Implementation Plan

**Status:** Design proposal only. No migration, live database mutation, production deployment, PR merge, or product data change has been performed.

## 1. Confirmed constraints and existing compatibility risks

- `public.products` currently uses `status` values `draft | active | paused | sold_out`; it also has `reseller_commission_percent`.
- A live `moderation_status` column was not found in the audited schema, while `app/marketplace/[productId]/page.tsx` and `app/sitemap.ts` filter on `moderation_status = 'approved'`.
- The admin product UI calls SEO/seed RPC signatures associated with migrations 029/030. These fields/functions were not present in the audited live schema.
- Do not treat `status='active'` alone as proof of approval. Do not remove approval filters as a workaround.
- Existing product updates must never overwrite the approved row before review. Pending edits must not change public content, price, stock, schema markup, images, or sitemap data.

## 2. Product revision data model

Use a separate `public.product_revisions` table for new product submissions and edits. A new product's canonical `products` row is created only after approval; an edit stores a proposed snapshot while the existing approved row remains unchanged.

Proposed fields:
- `id uuid primary key default gen_random_uuid()`
- `product_id uuid null references public.products(id) on delete restrict` (null for new products)
- `submitted_by uuid not null references public.profiles(id)`
- `revision_number integer not null`
- `proposed_data jsonb not null` (complete validated snapshot)
- `status text not null check in ('pending','approved','rejected','withdrawn')`
- `submitted_at timestamptz not null default now()`
- `reviewed_by uuid null references public.profiles(id)`
- `reviewed_at timestamptz null`
- `rejection_reason text null`
- `approved_product_id uuid null references public.products(id)`
- `base_product_updated_at timestamptz null` (stale-edit protection)
- `idempotency_key uuid not null` (prevents duplicate submission retries)
- `created_at timestamptz not null default now()`

Design constraints:
- Submitted snapshots are immutable. Corrections create a new revision; do not rewrite a submitted snapshot.
- Enforce at most one pending revision per existing product with a partial unique index. New-product submissions need a non-null idempotency key and a suitable uniqueness constraint; nullable product IDs alone cannot prevent duplicates.
- Add indexes for review queue (`status, submitted_at`), product history (`product_id, revision_number`), and submitter (`submitted_by`).
- Validate an explicit allowlist of fields and types server-side; reject unknown keys and protected fields such as owner, reviewer, status, moderation state, approval metadata, and arbitrary database columns.
- Validate price/stock/commission ranges, category validity, slug/SKU uniqueness, text lengths, allowed URL schemes, image metadata, and category-specific requirements.
- Do not store credentials, payment secrets, or unrelated personal data in revision snapshots.

## 3. Revision lifecycle and approval rules

1. New product: submit a pending revision; no public canonical product row before approval.
2. Edit: create a pending revision; preserve the currently approved canonical row until approval.
3. Concurrent pending edit: block a second pending revision for the same product. The owner may explicitly withdraw the pending revision with an audit event and submit a replacement. Never silently overwrite or supersede a revision under review.
4. Approval: in one transaction, re-check reviewer authorization, pending status, target product/version, category and uniqueness constraints; create/update the canonical product; mark revision approved; record reviewer/time and audit event.
5. Rejection: require a bounded, actionable reason; mark rejected and preserve the canonical product unchanged.
6. Resubmission after rejection: create a new revision ID and preserve the rejected revision.
7. Operational status remains distinct from approval. Approval must not activate a draft, paused, or sold-out product automatically.
8. Stale review protection: compare `base_product_updated_at` or a version/hash at approval. If stale, block approval and require a fresh revision/review.
9. Every content change requires review initially, including SEO metadata. Do not add low-risk bypasses until a field-level policy is separately reviewed.
10. Admin edits use the same revision path by default. Any emergency bypass must be separately permissioned and audited.
11. Use idempotency keys and transactional constraints so retry/double-click cannot create duplicate products or apply an approval twice.

## 4. Authorization, RLS, and audit

- An authenticated farmer/product owner may submit revisions for their own products. Admins may submit on behalf only through a permission-checked and audited path.
- Ownership is checked server-side inside RPCs, not only in UI.
- Enable RLS. Submitters can read their own revisions; Admin review queue and all review actions are admin-only. Anonymous users and unrelated users must never read pending proposed data.
- Revoke direct lifecycle-field writes from client roles as appropriate; use narrow RPCs for submission, withdrawal, approval, and rejection.
- Any `SECURITY DEFINER` RPC must lock `search_path`, schema-qualify objects, check `auth.uid()`, call explicit admin authorization for review actions, and grant execution only to intended roles.
- Never trust client-supplied submitter, owner, reviewer, status, or approved product ID.
- Audit submit, withdraw, approve, reject, and exceptional admin actions. Include revision/product IDs and avoid unnecessarily logging the full product payload.
- Product write, revision transition, and audit event must commit or roll back together.

## 5. Publication contract and SEO

Choose one durable approval source of truth (canonical approval marker/reference or dedicated publication record) and use it consistently. Public detail pages, listings, category pages, JSON-LD, Open Graph, and sitemap must only expose canonical product data that is approved and has `products.status='active'`. Never infer approval from a pending revision. Missing schema or query errors must fail closed and be logged/monitored, not silently bypassed.

Only approved canonical values may feed Product/Offer JSON-LD. Pending title, price, stock, image, SKU, category, or agricultural claims must not leak into public HTML, metadata, search listings, or sitemap. Do not fabricate ratings, reviews, certifications, germination rates, yield, or other performance claims.

### SEO technical health checks

- Validate canonical URLs, duplicate URLs, index/noindex and sitemap consistency.
- Validate Product/Offer and BreadcrumbList structured data against the canonical approved snapshot.
- Check image URL, alt text, broken links, and metadata completeness.
- If a public slug changes, create a controlled 301 redirect from the previous slug, prevent redirect loops, and retain correct canonical tags.
- Unpublish, pause, sold-out, and delete are distinct actions. Preserve URL and history where appropriate; remove non-public products from sitemap and ensure non-orderable states cannot be purchased.
- Add Search Console/analytics integrations only through explicit configuration and permission review; never fabricate performance metrics.
- SEO readiness score is advisory and not a ranking guarantee. Hard gates are valid product identity, ownership/category/status, non-negative price/stock, and required marketplace/category-policy fields. SEO title, meta description, keywords, FAQ, and alt-text recommendations are warnings unless explicitly required by policy.

## 6. Product form and category-aware fields

Base fields should include product name, category, description, price, stock, status, SKU where applicable, brand/manufacturer where known, pack/unit size, cover image, image alt text, slug, SEO title, meta description, and language settings.

Use category-specific fields instead of forcing one universal form:
- Seeds: crop, variety, pack size, germination details only when seller-provided and supported, sowing season/regions when accurate, expiry/lot details when applicable.
- Fertilizer/agro-inputs: composition, package size, and applicable registration/compliance details.
- Tools/equipment: model, dimensions, material, warranty where applicable.
- Other categories: category-specific specifications and requirements.

Do not make irrelevant fields required. Policy/legal requirements must be configured by category and verified rather than assumed.

### Media lifecycle

- Validate upload type, size, storage path, and access permissions.
- Keep revision images separate from the current public image until approval.
- On rejection/withdrawal, clean up orphaned staged files safely after a retention window; do not delete files referenced by an approved product.
- Ensure image URLs used by public pages and structured data are stable and accessible.

## 7. Bilingual and AI SEO Studio

- Support Bangla and English product content; define whether localized pages have separate slugs and metadata.
- Implement correct canonical/hreflang relationships only when both language variants genuinely exist and are indexable.
- AI can suggest titles, descriptions, translations, FAQs, keywords, and alt text, but suggestions are drafts until reviewed.
- Clearly distinguish seller-provided facts from generated text. Never invent certifications, ratings, reviews, germination rate, yield, safety claims, or agronomic performance.
- Flag unsupported claims, duplicate content, keyword stuffing, translation uncertainty, and missing required facts.
- Preserve the before/after diff for AI changes; never auto-publish AI-generated content.
- Provide preview of Google-style snippets and social cards, with a note that search engines may rewrite snippets.

## 8. SEO performance and operations dashboard

- Track Search Console impressions, clicks, queries, landing pages, and CTR only when integration data is available.
- Track page views and inquiry/order conversion using a consent-aware analytics approach and existing privacy requirements.
- Show missing/invalid schema, broken images, sitemap/query failures, stale revisions, approval queue age, and RPC failures.
- Mark unavailable data as unavailable; never display guessed metrics.
- Add operational logs/alerts for failed public product queries and sitemap generation without logging secrets or full private revision payloads.

## 9. Rollout plan — draft only

### Phase A: read-only compatibility inventory
- Confirm exact deployed migration history and current live columns/RPC signatures in the intended Supabase project.
- Resolve migrations 029/030/031/032 prerequisites and missing `moderation_status` / `commission_percent` references before application changes.
- Inventory every product read/write path, RLS policy, function grant, constraint, and query.
- Confirm the correct Supabase project identity; do not touch another project.

### Phase B: migration and RPC draft
- Prepare a new forward-only migration for revision storage, indexes, constraints, RLS, and narrowly granted RPCs.
- Do not silently edit already-applied migration files. Document migration ordering and rollback/recovery limitations.
- Keep SQL as a review artifact until explicitly authorized for staging application.

### Phase C: application draft
- Replace direct writes with Save Draft / Submit for Review revision RPCs.
- Add an Admin queue, revision comparison, rejection reason, and confirmation steps.
- Keep public routes on the canonical approved snapshot only.
- Revalidate product pages, listings, and sitemap only after approval or relevant public state change.
- Ensure staging credentials and test data are isolated from production.

### Phase D: tests and acceptance gates
- New pending product is not public and is absent from sitemap.
- Pending edit does not change old public name, description, price, stock, image, JSON-LD, canonical URL, or sitemap entry.
- Approval updates canonical data atomically; rejection leaves it unchanged.
- Withdrawal and resubmission preserve audit history.
- Non-admin cannot approve/reject, set reviewer fields, or read another user's revisions.
- Duplicate slug/SKU, idempotent retry, stale revision, and concurrent approval conflicts produce no partial writes.
- Paused/sold-out products remain non-orderable regardless of approval.
- Slug changes create safe redirects and no loops.
- Revision image stays private until approval; rejection cleanup does not remove approved media.
- Bilingual canonical/hreflang output is valid only for existing language variants.
- AI-generated unsupported claims are flagged; no AI text publishes without review.
- Schema/query failure fails closed and emits a useful operational signal.
- CI, lint, typecheck, migration tests, RLS tests, and staging smoke tests pass.

### Phase E: release decision
- Review code diff, migration plan, test evidence, backups, rollback/recovery plan, and staging project identity.
- Obtain explicit authorization before applying any migration, changing real data, merging a PR, enabling online payments, or deploying production.
- Production rollout, if later approved, needs monitoring and a defined rollback/recovery plan.

## 10. Implementation order

1. Schema compatibility inventory and publication source-of-truth decision.
2. Revision table/RPC draft, RLS, audit, idempotency, stale revision handling.
3. Admin review queue and farmer revision submission UI.
4. Public query/schema/sitemap contract and slug/media lifecycle.
5. Category-aware fields and bilingual metadata.
6. AI draft assistant and claim validation.
7. SEO/performance dashboard and alerts.


## 11. Super Admin-controlled configuration and permission-gated Admin panel

- Treat Super Admin as the only role that can create/edit/delete marketplace categories, define category attributes, mark fields required/optional, configure validation rules from a safe allowlist, and change category-level policy.
- Keep these controls in a dedicated **Marketplace Configuration** section. It is hidden from all users except Super Admin by default.
- Super Admin may explicitly grant a narrowly scoped permission (for example, `marketplace.category_config.manage`) to selected Admin profiles. Only then should that section appear in the permitted Admin's own profile/admin panel.
- Permission is enforced server-side on every read/write and in RPC authorization; hiding navigation or checking a client-side role is not security. Default deny, least privilege, auditable grants/revocations, and immediate permission revocation are required.
- Do not let delegated Admins grant this permission to themselves or others, change roles, modify security-sensitive validation code, or bypass product approval.
- Use controlled attribute types and validation operators (text, number, boolean, enum, measurement, date, URL, etc.). No arbitrary SQL, executable expressions, or client-defined database column names.
- Keep sensitive/legal/compliance rules, authorization logic, pricing visibility, and database schema changes developer-controlled and reviewed. Super Admin can configure business metadata only within the supported safe options.
- Audit category/attribute changes with actor, timestamp, before/after values, and reason. Changes to a category's fields must not silently invalidate existing products; show an impact preview and require a migration/backfill plan where needed.
- Product approval/revision workflow remains separate from category configuration. A permission to manage categories does not imply permission to approve products or verify B2B accounts.

## 12. B2B buyer accounts and wholesale pricing

### Buyer account application and verification

- Add a distinct **B2B / Wholesale** buyer account type for entrepreneurs, registered businesses, enterprises, and eligible trade buyers. Ordinary retail customers remain retail accounts.
- B2B applicants submit business type, legal/business name, contact details, business address, and appropriate supporting documents/registration identifiers where applicable. Collect only necessary information, protect documents from public access, and define retention/access rules.
- Initial state is `pending_verification`; only a Super Admin can approve, reject, suspend, or revoke B2B wholesale eligibility. Admins cannot approve their own application or elevate an account without explicit separately granted permission; default policy is Super Admin-only verification.
- Keep verification status distinct from the user's normal account role and product seller permissions. Approval grants wholesale-buyer eligibility, not Admin access, seller privileges, or product-approval rights.
- Store reviewer, decision timestamp, reason, and an audit event. Rejection should include an actionable reason; resubmission creates a new review event. Suspended/revoked accounts immediately lose wholesale-price access.
- Verify documents through an approved operational process; do not treat a user-entered business name or uploaded document alone as proof of verification.

### Price model and visibility

- Retail price is the default public/customer price. Wholesale pricing is shown only to authenticated accounts whose B2B verification is currently approved and active.
- Unverified, pending, rejected, suspended, anonymous, and retail accounts must never receive wholesale prices through page HTML, API/RPC responses, search results, structured data, metadata, cached responses, exports, or client-side payloads.
- Model wholesale pricing explicitly rather than replacing the retail price. Support product-level wholesale price and, if required, tiered quantity breaks (minimum order quantity, quantity range, unit price, effective dates). Use a clear currency/precision policy and validate wholesale prices against configured business rules.
- If no wholesale price is configured, show the retail price or a clear “contact for wholesale pricing” state only to verified B2B users; never invent a wholesale discount.
- Use server-authoritative price selection for cart, checkout, order totals, and order creation. Re-check B2B eligibility and price at checkout; never trust a price or buyer-type value submitted by the browser.
- Persist the applied unit price, pricing mode (retail/wholesale), quantity tier, and relevant product/price snapshot on each order item so later price edits do not rewrite historical orders. Recalculate safely if quantity changes, and ensure discounts, commissions, tax, delivery, cancellation, and refund logic use the correct price basis.
- Product schema markup and public SEO pages expose only retail pricing. Never put B2B-only prices in public Product/Offer JSON-LD, public page source, sitemap, Open Graph, or anonymous APIs.
- Avoid shared-cache leakage: vary or disable caching for authenticated price responses; test account switching and logout/login in the same browser.
- Product approval applies to retail and wholesale price changes. Proposed wholesale price edits remain private in the pending revision and only take effect after approval.

### B2B acceptance tests

- Anonymous and retail users see retail price only.
- Pending/rejected/suspended B2B applicants cannot retrieve wholesale price by calling APIs/RPCs directly.
- Approved B2B users see wholesale price only where a valid wholesale price/tier is configured.
- Revoking B2B status immediately blocks new wholesale-price reads and checkout; existing order snapshots remain intact.
- Cart/checkout recomputes eligibility, minimum quantity, tier, and total on the server.
- Product JSON-LD, sitemap, public page HTML, and anonymous responses never expose wholesale prices.
- Super Admin verification actions and permission changes are audited; delegated Admin cannot self-approve or self-grant access.
- Retail and wholesale orders preserve the correct price basis, quantity tier, commission, cancellation, and refund calculations.

## 13. Updated delivery order

1. Finish read-only schema/RPC compatibility inventory and resolve publication source of truth.
2. Draft role/permission matrix, Super Admin-only configuration authorization, and B2B verification state model.
3. Draft category/attribute configuration and B2B pricing tables/RPCs as review-only migrations; no application to live database.
4. Implement revision-based product submission and Admin approval queue.
5. Implement permission-gated Marketplace Configuration UI and dynamic category form.
6. Implement B2B application, Super Admin verification queue, and server-authoritative wholesale price visibility/checkout.
7. Align public product pages, retail-only structured data, sitemap, cart/order snapshots, and cache policy.
8. Add RLS/RPC authorization tests, price-leak tests, role-escalation tests, concurrency tests, and staging-only end-to-end tests.
9. Review all diffs and obtain explicit authorization before staging DB application, PR merge, or production deployment.

## Explicit non-actions

This plan is documentation and design only. No SQL migration was applied, no Supabase schema or data was changed, no PR was merged, and no production deployment was run.
