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
