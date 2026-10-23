# Safe product schema mismatch resolution plan

Status: review-only; no database writes, migration execution, merge, or deployment.

## Verified mismatch

The live `public.products` table lacks the following columns queried by current product/store/SEO code: `moderation_status`, `commission_percent`, `seo_title`, `seo_description`, `seo_keywords`, `image_url`, `brand`, `sku`, and seed-specific fields added by repository migrations 029/030. Live `products` has `reseller_commission_percent` and status enum values `draft | active | paused | sold_out`. Live `is_admin()` means role=admin; there is no verified `is_super_admin()` or `admin_permission_grants`.

## Safe decision

1. **Do not drop approval filters to make queries pass.** That could publish a product whose approval state is unknown.
2. **Do not silently substitute `status='active'` for `moderation_status='approved'`.** Repository history has no authoritative definition proving these are equivalent.
3. **Do not add `moderation_status` with a permissive default.** Existing rows could become public without a reviewed backfill, and publication semantics must be agreed first.
4. **Do not alias `commission_percent` to `reseller_commission_percent` in public product queries.** The former is used by current UI code but is not a confirmed product-level source; the latter is the live product column.
5. For optional SEO columns, migrations 029/030 are candidate additive changes, but must be reviewed as a complete ordered set, checked against live constraints/RPC signatures, and applied only after explicit production-change approval.
6. Until an authoritative publication source is confirmed, public product/store/sitemap/feed queries that cannot prove both approval and active status must fail closed (omit the product / return not-found or unavailable) rather than expose uncertain records.
7. Prepare a preflight SQL report (columns, constraints, policies, RPC overloads, migration history), then a separate additive/backfill/validation/rollback migration proposal. Require backup/restore plan, staging validation, counts before/after, and explicit approval before any application.

## Required decisions before migration

- Is `products.status='active'` alone sufficient to publish, or is moderation a separate workflow?
- What is the authoritative Super Admin identity and how is it protected from ordinary admins?
- Is product commission canonical `reseller_commission_percent` or a different field?
- Confirm the exact ordered migration set (029/030 and any missing predecessor) and whether RPC overloads conflict with live signatures.

## Verification checklist

- Compare live columns/enum values/indexes/check constraints/FKs/RLS policies and RPC signatures with migrations.
- Check existing product counts by status and any existing approval metadata before backfill.
- Validate all public product detail, storefront, sitemap, Merchant Center feed, metadata, JSON-LD paths against the chosen publication predicate.
- Run static regression tests plus `npm run typecheck`, `npm run lint`, `npm run test:seo`, `npm run test:storefront-pricing`, and build in CI.
- Verify no public response includes wholesale fields/prices; no B2B endpoint works unless the trusted RPC checks auth, verification, permission grant, and seller/product relationship.
- Do not deploy until schema mismatch, tests, security review, and explicit approval are complete.
