# AGRIVA B2B / Super Admin — Read-only schema inventory

**Date:** 2026-10-23  
**Branch:** `review/product-seo-schema-compatibility`  
**Scope:** repository migration/source review and design preflight. This is not a claim that every item was re-queried against live Supabase during this turn.

## Confirmed from canonical repository migrations

### Identity and authorization

- `supabase/migrations/001_agriva_core.sql` defines `public.user_role` as `farmer | reseller | admin`. It does not define a distinct `super_admin` role.
- `supabase/migrations/014_marketplace_production.sql` defines `public.is_admin()` by checking `profiles.role = 'admin'`. This helper therefore cannot be used as the Super Admin gate: it would authorize every Admin.
- `supabase/migrations/024_admin_product_user_management.sql` intentionally prevents self-role changes and prevents the ordinary admin role-management RPC from assigning `admin`. This is a useful privilege-escalation control to preserve.
- `admin_audit_log` was confirmed in the prior read-only schema audit with columns `id, admin_id, action, entity_type, entity_id, metadata, created_at`; current policy/grants and the exact live definition must be rechecked before adding new privileged RPCs.
- No authoritative Super Admin identity/bootstrap mechanism or existing normalized Admin permission-grant table was identified in the migration files inspected. This remains a blocking decision, not a gap to fill by assuming all admins are Super Admin.

### Product and category model

- The existing product category table was previously read-only inspected as `product_categories(id, name, slug, description, is_active, sort_order, created_at, updated_at)`. Categories are stored separately, but a normalized configurable attribute-definition model has not been confirmed.
- The universal category attribute schema must not use arbitrary SQL, dynamic column names, or executable validation expressions. Category fields need an allowlisted data type/operator model and an impact review when requiredness changes.
- Category configuration delegation must remain independent from product approval, B2B verification, user-role management, and wholesale price access.

### Order and pricing model

- `supabase/migrations/014_marketplace_production.sql` defines `public.marketplace_orders` with a single `product_id`, integer `quantity`, `unit_price numeric(12,2)`, `total_amount`, commission snapshot fields, payment/order status, shipping address, and timestamps.
- The same migration defines `finalize_marketplace_cod_order(...)`. It locks the product row, reads `products.price`, calculates total/commission, creates the order, and decrements stock in one function. Wholesale pricing must extend this trusted order path or its confirmed successor, not introduce a parallel checkout route.
- The canonical `products.stock` is numeric while `marketplace_orders.quantity` is integer in migration 014. Unit/pack and quantity semantics must be resolved before tier pricing is finalized.
- The existing order row has `unit_price`, so adding another price snapshot column may be redundant. If approved after code audit, an explicit pricing-mode and applied wholesale-tier reference may be sufficient; existing consumers and history/backfill must be checked first.
- No multi-item order/order-item model was established from the inspected migration 014; the current table shape is one product per order. Do not assume a cart/order-items table exists without inspecting the full migration chain and app code.

### B2B and private documents

- No existing B2B buyer verification or product wholesale-tier tables were identified in the migration sources inspected in this pass. Verify current live schema before treating this as definitive.
- The draft stores document storage paths only; the storage bucket must be private and access must be authorized/time-limited. The migration draft intentionally does not create bucket policies or expose application documents.
- Super Admin verification must not grant seller, reseller, Admin, or product-approval privileges automatically.

## Application consumer audit

The follow-up source-code audit is documented in [`docs/b2b-checkout-permission-consumer-audit.md`](./b2b-checkout-permission-consumer-audit.md). It confirms that the checkout API calls the existing `finalize_marketplace_cod_order` RPC and calculates price server-side in the database path; the client loops over cart items one request at a time, which creates a partial-order risk if a later request fails. It also confirms category CRUD and category assignment currently authorize with `is_admin()`, so the “Super Admin” comment on migration 027 does not enforce Super Admin-only access. This is repository evidence, not a live Supabase recheck.

## Live verification follow-up

The intended Supabase project was rechecked read-only on 2026-10-23. The verified migration drift, current role enum, category RPC authorization gap, storage inventory, checkout contract, and Security Advisor notices are recorded in [`docs/b2b-live-supabase-verification-2026-10-23.md`](./b2b-live-supabase-verification-2026-10-23.md). No SQL mutation or migration apply occurred.

## Review-only SQL artifact

Created: [`docs/drafts/b2b-permissions-wholesale-review-only.sql`](./drafts/b2b-permissions-wholesale-review-only.sql)

This artifact is deliberately outside `supabase/migrations/`. It proposes tables for:
- delegated permission grants with revocation history;
- B2B business applications and append-only verification events;
- private product wholesale quantity tiers.

It also documents the intended RPC authorization contract and checkout changes. It is **not ready to run**: the missing Super Admin source of truth is a blocking prerequisite, and order/quantity semantics and storage access still require verification. The file ends with `ROLLBACK` as an additional guard, but that does not make executing it appropriate.

## Blocking items before implementation SQL can be finalized

1. Establish a server-managed Super Admin identity/bootstrap source. Do not use `is_admin()` as a substitute and do not trust user-editable profile metadata.
2. Re-read the intended live Supabase project's schema, grants, policies, function definitions and migration history; confirm project identity before any schema-changing work.
3. Inspect current cart/checkout callers, order-status cancellation/refund paths, commission calculations and all consumers of `marketplace_orders.unit_price`.
4. Resolve integer order quantity vs numeric stock and define whether wholesale tiers are per product, pack size, or variant.
5. Inspect private storage bucket/policies and decide document verification/retention policy.
6. Inventory product category CRUD and form consumers before adding category attribute-definition tables.
7. Draft RPCs with fixed safe `search_path`, explicit `auth.uid()` checks, narrow EXECUTE grants, no direct table access, transactional audit events, and tests for direct API calls, self-approval, self-grant, revocation and price leakage.

## Safety record

No SQL was run. No live database/schema/permission/data was changed. No PR was merged and no production deployment was triggered.

## Confirmed product requirement: seller-managed wholesale prices, buyer-gated visibility

The product behavior requested for implementation is:

- **Who can set wholesale prices:** the verified company owner or an explicitly authorized company representative may propose wholesale quantity tiers for products owned by that company/account. A representative's authority must be server-verified and scoped to the relevant company; an ordinary buyer account must not gain seller pricing rights merely because it is B2B-approved.
- **Price-change approval:** adding or editing wholesale tiers is a product/pricing revision. It must follow the existing proposed product approval workflow; until approved, the currently approved wholesale tier remains effective. Deletion/deactivation also needs an auditable, permission-checked path.
- **Who can see wholesale prices:** only a logged-in buyer whose business account is verified/approved **and** whose account has an explicit active Super Admin-granted wholesale-view permission. Eligible account types include entrepreneur, shopkeeper/retailer, and enterprise/business buyer; the account label alone never grants access.
- **Everyone else:** anonymous visitors, regular retail customers, pending/rejected/suspended B2B accounts, and approved B2B accounts without the explicit permission see retail price only.
- **No leakage:** wholesale prices/tier data must not appear in anonymous or unauthorized HTML, client bundles/state, API/RPC responses, cache keys or cached responses, CSV/export, search metadata, Product/Offer JSON-LD, Open Graph, sitemap, or public product feeds. Never fetch wholesale prices to the browser and hide them with CSS.
- **Trusted checkout:** the database checkout transaction must re-check buyer verification and permission, product approval/publication, active tier, requested quantity/unit, and current effective dates; calculate the wholesale price server-side and snapshot the applied pricing mode/tier/price in the order. A revoked permission or suspended business account must not retain wholesale access on a later request. Existing orders retain their historical snapshot.
- **Seller isolation:** company owner/representative may only manage prices for products the company is authorized to sell. A representative grant must be revocable and audited. Neither buyer verification nor wholesale-view permission grants product ownership, Admin rights, or approval authority.
- **Super Admin only by default:** creating/revoking wholesale-view grants and verifying business accounts are Super Admin-only. Delegation to an Admin must be an explicit separate permission grant with audit trail; the live is_admin() helper is not sufficient.

These rules are the product acceptance criteria for implementation and security tests, not a claim that the feature is already implemented. Quantity units/pack semantics and the trusted Super Admin identity remain blockers before final executable SQL.

## Confirmed requirement: wholesaler public store / storefront

Each approved wholesaler/company should have a dedicated public storefront page that lists all of that wholesaler's publicly approved and active items. The storefront should show company/store name, logo or cover image when available, a seller-provided description, relevant location/contact details only when intentionally public, product categories, search/filter/sort, and product cards linking to canonical product pages. Do not expose private verification documents, internal business identifiers, reviewer notes, account permissions, or pending/rejected product revisions.

- Store identity/profile edits and product changes follow appropriate review/validation rules; pending edits must not replace currently approved public content.
- List only products that are approved for publication and `products.status='active'`. Do not remove approval checks as a workaround for the known missing `moderation_status` schema; first resolve the publication source-of-truth mismatch.
- A wholesaler store is not a wholesale-price access bypass. Public/anonymous visitors and retail users see retail prices only. Wholesale prices are returned only through a server-authorized path to buyers with current approved B2B verification **and** an active Super Admin-granted `marketplace.wholesale_prices.view` permission.
- Store product listings, page metadata, JSON-LD, Open Graph, sitemap and public APIs must not contain wholesale price tiers. Keep shared caching from leaking authenticated buyer pricing.
- Add a canonical store slug/URL, collision-safe slug handling, a store-level sitemap entry only for approved/public stores, and appropriate Store/Organization plus BreadcrumbList schema using verified facts only. Avoid fabricated ratings/reviews or claims.
- Tests: public store only shows active approved items; pending/unapproved items never leak; a wholesaler cannot list another seller's private/unapproved products; wholesale price data never appears in public storefront responses; store slug changes do not create redirect loops; empty stores have a useful state.

This is a documented product requirement, not an implemented live storefront. The existing product publication/schema compatibility blockers and Super Admin authorization decision must be resolved before executable migration or deployment.

## Super Admin seller-form feature visibility requirement

Company sellers and wholesalers need a simple default product-add form. Super Admin must be able to configure whether seller cohorts see optional sections such as SEO Studio, structured data, AI SEO assistance, advanced fields and category-specific attributes, and can delegate narrowly scoped management capabilities to selected Admins. This is UI configuration only; server-side validation, publication approval, pricing authorization and wholesale secrecy remain mandatory. Feature flags must be allowlisted, audited, server-derived, and fail closed. See the detailed design in `docs/b2b-permissions-and-wholesale-design.md`.
