# AGRIVA Product Approval Workflow — Staging-Safe Schema & Implementation Plan

**Status:** Design proposal only. No migration, live database mutation, production deployment, or product data change has been performed.

## 1. Confirmed constraints and existing compatibility risks

- `public.products` currently uses `status` values `draft | active | paused | sold_out`; it also has `reseller_commission_percent`.
- A live `moderation_status` column was not found in the audited schema, while `app/marketplace/[productId]/page.tsx` and `app/sitemap.ts` filter on `moderation_status = 'approved'`.
- The admin product UI calls SEO/seed RPC signatures associated with migrations 029/030. These fields/functions were not present in the audited live schema.
- Do not treat `status='active'` alone as proof of approval. Do not remove approval filters as a workaround.
- Existing product updates should never overwrite the approved row before review. A pending edit must not change public content, price, stock, schema markup, or sitemap data.

## 2. Recommended data model: immutable product revisions

Prefer a separate `public.product_revisions` table over adding only a moderation column to `products`. This supports both new products and edits while keeping the currently approved product row untouched until an Admin approves the exact revision.

### Proposed columns

| Column | Proposed type | Purpose |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | Revision identifier |
| `product_id` | `uuid null references public.products(id) on delete restrict` | Existing product for an edit; null for a new product awaiting approval |
| `submitted_by` | `uuid not null references public.profiles(id)` | Authenticated submitter |
| `revision_number` | `integer not null` | Monotonic revision number per existing product; new-product revisions begin at 1 |
| `proposed_data` | `jsonb not null` | Complete, validated proposed product snapshot |
| `status` | `text not null` with CHECK in `pending, approved, rejected, superseded` | Revision review lifecycle |
| `submitted_at` | `timestamptz not null default now()` | Submission timestamp |
| `reviewed_by` | `uuid null references public.profiles(id)` | Admin reviewer |
| `reviewed_at` | `timestamptz null` | Review timestamp |
| `rejection_reason` | `text null` | Actionable reason returned to submitter |
| `approved_product_id` | `uuid null references public.products(id)` | Product row created/updated by approving a new-product revision |
| `created_at` | `timestamptz not null default now()` | Auditability |

Implementation details:
- Treat submitted revision snapshots as immutable. A correction creates a new revision rather than rewriting an existing submitted snapshot.
- Enforce a single pending revision per existing product with a partial unique index on `product_id WHERE status='pending' AND product_id IS NOT NULL`. For new products (`product_id IS NULL`), use an explicit draft/session identifier or idempotency key and a separate uniqueness rule; do not rely on a nullable unique index to prevent duplicates.
- Add appropriate indexes for `status, submitted_at`, `product_id, revision_number`, and `submitted_by`.
- `proposed_data` must be validated against an allowlist of product fields in server-side RPC code. Never accept protected fields such as role, farmer ownership, moderation status, approval metadata, or arbitrary database columns from the client.
- Prefer explicit typed RPC parameters or strict JSON-key/type allowlists; validate numeric price/stock/commission ranges, allowed product status, slug/SKU uniqueness, text lengths, URL scheme, and seed details. Reject unknown keys.
- Store only data needed for a proposed product. Do not store payment secrets or private integration credentials in the snapshot.

### Why this design preserves the published revision

For an edit, the revision row stores the proposed values; the existing `products` row remains unchanged and continues serving public requests. Approval atomically applies the revision snapshot to the canonical `products` row and records review metadata. Rejection leaves the public row untouched. For a new product, the canonical product row is created only on approval (or remains non-public until approval if a separately reviewed product-creation strategy is selected).

## 3. Lifecycle and state rules

1. **New product:** create a pending revision; no public product row is created before approval.
2. **Edit an approved product:** create a pending revision linked to the existing product. Continue serving the old approved product row.
3. **Pending edit:** prevent concurrent pending revisions for the same product, or explicitly supersede the prior pending revision when a new one is submitted.
4. **Approve:** in one database transaction, re-check reviewer authorization, ensure revision is still pending, validate current target state and uniqueness constraints, apply the snapshot to `products`, set revision status to approved, set reviewer/time, and write `admin_audit_log`.
5. **Reject:** require a non-empty, bounded reason; mark the revision rejected with reviewer/time and audit log. Do not alter the canonical product row.
6. **Resubmit after rejection:** create a new revision with a new ID; preserve the rejected revision for history.
7. **Pause / sold out / unpublish:** keep operational `products.status` separate from review status. Approval never automatically changes a product to active if the submitted/approved operational status is paused, draft, or sold_out.
8. **Stale review protection:** include the base product `updated_at` (or a version/hash) in the submitted snapshot. At approval, detect if the canonical product changed since submission and require a fresh review instead of overwriting newer data.
9. **Admin edits:** use the same revision-and-approval path by default; if an emergency direct edit is required, define a separately permissioned and audited exception.

## 4. Authorization, RLS, and RPC boundaries

- Enable RLS on `product_revisions`.
- Submit/read own revisions only for authorized submitters; do not expose all proposed data to anonymous users or unrelated farmers/resellers.
- Admin review queue and full revision data are admin-only.
- Revoke direct `INSERT/UPDATE/DELETE` privileges on revision lifecycle fields from `anon` and ordinary `authenticated` clients as appropriate. Route state transitions through narrow RPCs.
- Any `SECURITY DEFINER` RPC must use a locked `search_path`, schema-qualified object references, explicit `auth.uid()` checks, and an explicit `public.is_admin()` check for approve/reject. Grant execution only to intended roles; review existing grants rather than assuming defaults.
- Do not trust a client-provided `reviewed_by`, status, submitter, product owner, or approved product ID.
- Write audit entries for submit, approve, reject, supersede, and exceptional administrative actions. Audit records should identify revision ID and product ID and avoid logging sensitive payloads unnecessarily.
- Keep each approval operation transactional so product update, revision state transition, and audit event cannot partially succeed.

## 5. Public read, SEO, and sitemap contract

Public product detail, category/listing queries, structured data, Open Graph metadata, and sitemap should all use the same publication contract:
- canonical product exists in `products`;
- `products.status = 'active'`;
- there is a durable, authoritative approval state for that canonical product.

With the revision-table design, do not infer approval from the existence of a pending revision. The safest options are:
1. add a canonical approval marker/approved revision reference to `products` as part of a reviewed migration; or
2. maintain a dedicated publication record that points to the approved revision and is updated atomically on approval.

Choose one source of truth and use it consistently in all public queries. Do not add a filter for an uncreated column and assume it works. If an approval query errors, fail closed (show no unverified products), while surfacing operational errors to logs/monitoring.

The approved public snapshot alone should feed Product/Offer JSON-LD. Pending proposed title, price, image, SKU, or seed claims must never leak into metadata, schema, page HTML, search results, or sitemap. Do not fabricate reviews, ratings, certifications, or agricultural performance claims.

## 6. Staging rollout plan (no production actions)

### Phase A — read-only compatibility inventory
- Confirm the exact deployed migration history and current live columns/RPC signatures in the intended Supabase project.
- Resolve migration 029/030/031/032 prerequisites and the missing `moderation_status` / `commission_percent` references before changing application behavior.
- Confirm current public product query paths and every place that reads or writes product rows.
- Record baseline RLS, function grants, constraints, and sample query plans. Do not touch the other Supabase project.

### Phase B — draft schema and RPC migration
- Prepare a new, forward-only migration that creates revision storage, constraints/indexes, RLS policies, and narrowly granted submit/approve/reject RPCs.
- Make the migration idempotency and ordering explicit; do not silently edit already-applied migration files.
- Keep it as a reviewed file/PR only until explicit approval to apply it to a staging database.

### Phase C — application changes
- Replace direct writes from Product SEO Studio with “Save draft” / “Submit for review” revision RPCs.
- Add Admin queue and revision comparison view; approval/rejection requires confirmation and rejection reason.
- Ensure approval updates the canonical product row and review metadata atomically.
- Keep public routes reading only canonical approved product data; preserve old public version during pending edits.
- Revalidate marketplace detail/listing/category pages and sitemap after approval, not after a pending submission.
- Use a separate staging environment and test data; never point staging UI at production credentials.

### Phase D — tests and acceptance gates
- New pending product is not public and is absent from sitemap.
- Pending edit does not change the old public title, description, price, stock, image, JSON-LD, canonical URL, or sitemap timestamp.
- Approval changes public content atomically and includes it in the sitemap.
- Rejection preserves the old public content and records the reason.
- A rejected revision can be resubmitted as a new revision.
- Non-admin cannot approve/reject, set reviewer fields, or read another user's private revisions.
- Duplicate SKU/slug and stale revision conflicts are handled without partial writes.
- A product paused/sold_out remains non-orderable regardless of approval state.
- RPC failure or missing schema fails closed; no sample/demo product is indexed as real inventory.
- CI/lint/typecheck and migration tests pass; staging smoke tests verify queries and RLS.

### Phase E — release decision
- Review diff and test evidence; confirm staging project identity.
- Obtain explicit authorization before applying any migration, changing real data, merging a PR, enabling online payments, or deploying production.
- Production rollout, if separately approved later, should include a backup/rollback plan and monitoring for public-query errors.

## 7. Open design decisions before implementation

1. Who may submit a product revision: farmer/owner, Admin only, or both?
2. Should a new product's canonical row be created only at approval (recommended), or created as a non-public draft?
3. Should a second edit while one is pending be blocked, or supersede the pending revision?
4. Should SEO completeness be advisory or a hard submission gate? Do not treat a score as a Google ranking guarantee.
5. Should any low-risk metadata edit avoid re-review? Default recommendation: no bypass until field-level policy is defined.

## Explicit non-actions

This document is a proposal only. No SQL migration was applied, no Supabase data or schema was changed, no PR was merged, and no production deployment was run.
