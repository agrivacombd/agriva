# Product SEO next-step findings

Date: 2026-10-23
Target: `dhqaepsbuwhbynagfxpf`
Scope: read-only source and live schema audit. No database writes or migrations.

## Confirmed from canonical migrations

- `001_agriva_core.sql` defines `public.products.reseller_commission_percent` as the product commission field.
- `014_marketplace_production.sql` defines `public.marketplace_orders.commission_percent` for an order's commission snapshot. This is not a products column.
- `024_admin_product_user_management.sql` updates product commission through `reseller_commission_percent`.
- The repository search and live schema inspection did not find an authoritative migration defining `products.moderation_status`.
- Current product statuses are the enum `draft | active | paused | sold_out`; the original public product policy reads active products (and owners' own products).

## Concrete compatibility defects

1. `app/marketplace/[productId]/page.tsx` selects `commission_percent` from `products`. Canonical schema says it should not expect this column. The product detail query can fail.
2. The same route filters on `moderation_status = approved`, and `app/sitemap.ts` does the same. That column has no confirmed canonical schema source. These filters can cause the public product lookup and product sitemap query to fail.
3. The admin Add/Edit page selects SEO and seed fields and calls newer RPC overloads that are not present in live DB until migrations 029/030 are applied.
4. The current UI's product status choices already include `active`, so do not invent a separate approval column or silently remove an approval gate without product-owner confirmation.

## Safe implementation decision

- Do not add `moderation_status` or replace the current status enum based on guesswork.
- Do not use `commission_percent` as a products field; the authoritative product field is `reseller_commission_percent`.
- Before changing public listing/detail/sitemap behaviour, confirm whether `status = active` is the complete publication gate or whether a separate moderation workflow is intended.
- Before enabling the SEO form against live data, apply migrations 029/030 only after staging validation and explicit approval. They add SEO and seed fields/RPCs, but do not resolve the missing moderation field.
- Keep migration 031/032 out of the SEO rollout unless the site-integration feature is explicitly in scope; 032 depends on 031.
- Do not weaken RLS, expose unpublished products, or use service-role credentials in the browser to work around schema mismatches.

## Validation checklist for the code change

- Product detail uses only canonical product columns and produces Product/Breadcrumb JSON-LD from real stored values.
- Sitemap includes only genuinely public products and gracefully handles query errors.
- Admin RPC signatures match deployed migrations and remain admin-only with audit logging.
- Typecheck, lint, existing SEO smoke test, and build pass before any deployment.
- Test with staging data; do not use fabricated ratings, reviews, certifications, or agronomic claims.
