# AGRIVA B2B / Super Admin — checkout and permission consumer audit

**Date:** 2026-10-23  
**Branch:** `review/product-seo-schema-compatibility`  
**Scope:** source-code and migration review only. No live database query or mutation was performed in this pass.

## Confirmed application call paths

### Checkout is a single-product order API loop, not a bulk cart RPC

- `app/checkout/page.tsx` loads the active cart and iterates its items, issuing one `POST /api/checkout` request per product. It clears the active cart only after all requests succeed.
- `app/api/checkout/route.ts` authenticates the user, validates integer quantity 1–100, validates shipping details, enforces COD settings server-side, optionally resolves reseller attribution, and calls `finalize_marketplace_cod_order`.
- The API currently does **not** accept a trusted buyer-selected price. The database RPC is the appropriate single point to calculate retail/wholesale pricing under row locks.
- Partial-order risk exists in the current multi-item client loop: if one product order succeeds and a later product fails, earlier orders already exist while the cart is not cleared. This is existing behavior and must be addressed or explicitly accounted for before adding wholesale checkout; do not create a second parallel checkout path.
- Cart and checkout pages display `cart_items.unit_price` or current `products.price` client-side. This is presentation only and must not become the trusted price source.
- The checkout API currently returns order id, total, commission, attribution flag and payment method. It does not return a wholesale tier identifier or pricing mode.

### Existing checkout invariants to preserve

- `finalize_marketplace_cod_order` is the trusted order path called by the API; its SQL definition in migration 014 locks the product, calculates from database product price, records the order and commission snapshot, and decrements stock atomically.
- The current API only permits COD and explicitly rejects online payment.
- The checkout extension must revalidate the buyer's approved B2B status at order time, choose a server-authorized tier for the requested quantity, lock/revalidate product and tier, preserve existing reseller attribution/commission behavior, and snapshot the actual unit price and pricing mode in the existing order row.
- Do not expose wholesale price through public product queries, cart API responses, server-rendered HTML, metadata, JSON-LD, OG tags, sitemap, exports, or logs. Wholesale pricing needs a privileged authenticated RPC or server-only query with a narrow response shape. Do not grant clients direct table access to the tier table.

## Confirmed category permission conflict

- `app/admin/categories/page.tsx` uses `requireAdmin()`, which only checks `profiles.role === 'admin'`.
- Migration `025_admin_site_settings_categories.sql` grants category create/update through `admin_save_product_category` to any authenticated caller that passes `public.is_admin()`.
- Migration `027_admin_product_category_assignment.sql` likewise allows any Admin to assign a category through `admin_set_product_category`. Its comment says “Super Admin”, but the actual authorization checks only `is_admin()`; the comment is not a security boundary.
- Therefore the requested Super Admin-only category configuration is **not implemented** in the inspected code/migrations. UI hiding alone is insufficient. Both page-level access and the SECURITY DEFINER RPC must enforce the same trusted Super Admin/delegated-permission decision.
- A delegated grant must be checked against a server-side active grant for the exact allowlisted permission key `marketplace.category_config.manage`, and the target account must still be an Admin. Revocation should take effect immediately. Do not reuse a broad `is_admin()` helper for this permission.
- The current product form also reads active categories for its select. Reading active category names for product selection can remain public/ordinary-admin-safe; creating, renaming, deactivating or reordering categories is the privileged operation.

## B2B verification and price leakage guardrails

- B2B approval is not an existing buyer role. The source role enum is `farmer | reseller | admin`; verification must be a separate business-account state and must not automatically change role.
- Super Admin review must be server-enforced, reject self-approval, require a decision reason, record an append-only verification event and admin audit event atomically, and protect business documents behind private storage policies.
- A verified business account should see wholesale prices only in a dedicated authenticated response and only for active/approved-to-purchase products and valid tiers. Unverified users should not be able to infer the tiers through errors, counts, export endpoints, caching, or public schema markup.
- Checkout must ignore any client-supplied price, tier id, “verified” boolean, or pricing mode as authority. It may accept a requested quantity; the server decides eligibility and price.
- Existing `marketplace_orders.unit_price` and `total_amount` likely provide the historical monetary snapshot. Add a `pricing_mode` / tier reference only after all order, reporting, cancellation, refund, settlement and commission consumers are audited. Do not duplicate price columns without a demonstrated need.
- Quantity tiers cannot be finalized until pack/unit semantics are resolved: current product stock is numeric, while order quantity is integer and API limits it to 1–100.

## Concrete implementation order

1. **Identity/bootstrap decision:** document a trusted, non-user-editable Super Admin source of truth and recovery procedure. Never infer Super Admin from ordinary Admin role or profile metadata.
2. **Schema truth check:** in the intended Supabase project only, read migration history, current role enum, function definitions/grants, RLS, tables, storage buckets and policies. This pass is source-code-only and does not claim live verification.
3. **Category permission patch design:** centralize server-side `requireAdmin` plus `has_admin_permission` checks; guard both UI route and `admin_save_product_category` / `admin_set_product_category` RPCs; keep product category assignment distinct from category configuration.
4. **B2B application/review RPC design:** private document storage, explicit state machine, self-approval prevention, reason, event log and audit in one transaction.
5. **Wholesale tier model:** define product/pack/variant and non-overlapping quantity/effective-time rules. Store tier changes as product revisions subject to approval.
6. **Single checkout path:** extend `finalize_marketplace_cod_order` atomically; retain attribution, stock and commission behavior; add tests for verified/unverified buyers, changed/revoked verification between browse and checkout, tier boundaries, concurrent stock, failed checkout and partial multi-item checkout.
7. **Leakage and authorization tests:** anonymous, ordinary authenticated, Admin, delegated Admin and Super Admin tests across direct REST/table access, RPC, page HTML, metadata, JSON-LD, sitemap, cache, reports and exports.
8. **Staging review:** run type/lint/build and DB integration tests in staging only. No migration apply, merge or production deployment without explicit authorization.

## Safety record

- This document is a source review, not a live Supabase audit.
- No SQL was executed; no live database/schema/permission/data was changed.
- No migration was added under `supabase/migrations/`.
- No PR was merged and no production deployment was triggered.
