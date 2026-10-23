# Product SEO schema compatibility review (read-only)

Date: 2026-10-23  
Repository: `agrivacombd/agriva`  
Target Supabase project: `dhqaepsbuwhbynagfxpf`  
Status: **Review only — no database changes performed**

## Findings from live read-only inspection

The live `public.products` table currently has these columns:

`id, farmer_id, name, slug, description, price, stock, reseller_commission_percent, status, created_at, updated_at, category`.

It does **not** currently have the columns introduced by repository migrations 029 and 030.

Live RPC signatures are still the original forms:

- `admin_create_product(p_name, p_description, p_price, p_stock, p_commission_percent, p_status, p_category)`
- `admin_update_product(p_product_id, p_name, p_description, p_price, p_stock, p_commission_percent, p_status)`

The live database does not currently expose the newer SEO overloads or `admin_set_seed_details`. It does expose `admin_set_product_category(p_product_id uuid, p_category text)`.

The migration history returned by Supabase includes migrations 001–028 and the listed security, checkout, buyer-demand, and transport migrations, but **does not include 029, 030, 031, or 032**.

Additional live-schema mismatch found by inspecting the application code: the product detail route and sitemap filter by `moderation_status`, and the product detail route also selects `commission_percent`; neither column exists on the live `products` table as inspected. The current live schema has `reseller_commission_percent` instead. These mismatches may cause public product pages and sitemap queries to fail even after 029/030 are applied. Do not assume these are safe to ignore.

The Admin Product Add/Edit page calls the SEO-enabled `admin_create_product` and `admin_update_product` overloads and calls `admin_set_seed_details`; these calls will fail against the current live schema/function signatures. On edit it also calls `admin_set_product_category`, which exists in the live DB. The public product route references fields from both 029 and 030. This confirms the mismatch is an application/database compatibility issue, not only missing optional SEO metadata.

## Intended migration sequence and additional migrations

1. `029_product_seo_schema.sql` — SEO fields and RPC overloads.
2. `030_seed_seo_and_reporting.sql` — seed fields and RPC.
3. `031_google_site_integrations.sql` — creates `site_public_integrations`.
4. `032_more_site_verification_providers.sql` — adds verification/tracking columns to `site_public_integrations`.

Migrations 031 and 032 are relevant to the current branch's site-integration UI/API. They must not be applied blindly: first inspect all dependent UI/API code and confirm whether the target project is intended to receive those features. Migration 032 depends on the table from 031.

Do not run these until the preflight checks below pass. Do not edit or re-create already-applied migrations.

## Preflight checks required before applying

Run read-only checks in the target project for:

- `public.product_categories`: confirm `name` and `is_active` exist, and check category uniqueness/semantics used by the RPC.
- `public.admin_audit_log`: confirm `admin_id, action, entity_type, entity_id, metadata` exist and the admin FK is valid.
- `public.is_admin()`: confirm it exists, is SECURITY DEFINER with a locked search_path, and correctly checks the authenticated profile role.
- Current function grants and definitions for both original RPCs; preserve their signatures for backward compatibility.
- Existing product rows and any existing SKU values before adding a unique index (SKU is a new column in migration 029, so this should initially be empty if the migration is applied as written).
- RLS policies and grants on `public.products`; do not weaken them to make the new UI work.

## Migration review notes

### 029 — product SEO fields and RPC overloads

Adds `seo_title, seo_description, seo_keywords, image_url, brand, sku`, a partial unique SKU index, length constraints, and admin-only overloads of `admin_create_product` and `admin_update_product`.

Checks to perform in a staging database:
- New overloads are callable by `authenticated` and revoked from `public, anon`.
- Calls by a non-admin authenticated user fail.
- The original RPC signatures remain available and behave as before.
- Category validation matches the real `product_categories` schema.
- Duplicate SKU, invalid lengths, negative price/stock, and invalid commission are rejected.
- Audit rows are written only for successful admin actions.

### 030 — seed-specific product fields

Adds `crop_name, seed_variety, pack_size, germination_rate, sowing_season, suitable_regions, seed_expiry_date` and `admin_set_seed_details`.

Checks to perform in staging:
- The function is callable by `authenticated`, revoked from `public, anon`, and rejects non-admin users.
- Germination rate boundaries and field-length constraints are enforced.
- Existing non-seed products remain valid because the new fields are optional.
- Audit logging works and failed updates do not create misleading audit records.

## Application compatibility gate

Application inspection completed for `app/admin/products/page.tsx`, `app/marketplace/[productId]/page.tsx`, and `app/sitemap.ts` on `fix/admin-real-data-and-payment-integrity`.

Findings and gates:
- Admin create/edit sends the new SEO arguments, then invokes `admin_set_seed_details`; these require migrations 029/030.
- Edit additionally calls the existing `admin_set_product_category` RPC. Confirm its signature and side effects in staging; avoid redundant category updates if the SEO update RPC already stores `category`.
- Public product detail selects the SEO and seed columns, plus `moderation_status` and `commission_percent`. The SEO/seed columns are supplied by 029/030, but the latter two were not found in the live products schema. Find the authoritative migration/source of these columns and reconcile `commission_percent` vs `reseller_commission_percent` before release.
- Sitemap selects `slug, updated_at` and filters `status='active'`, `moderation_status='approved'`. The missing `moderation_status` column is a likely runtime query failure on the live DB.
- Product schema JSON-LD uses product price, stock, brand, SKU, seed attributes and canonical URL. Validate generated JSON-LD against a real staging row and ensure only approved, public products are indexed.
- The admin form has separate validation paths for create/edit; test date validation, empty values, SKU duplicates, and partial RPC failure. Create/edit currently make multiple RPC calls, so a later RPC failure may leave the product partially updated; consider making these writes atomic in a single RPC before production use.


## Additional read-only checks completed

- `product_categories` exists with `id, name, slug, description, is_active, sort_order, created_at, updated_at`; both `name` and `slug` have unique constraints.
- `admin_audit_log` exists with `id, admin_id, action, entity_type, entity_id, metadata, created_at`; `admin_id` references `profiles(id)` with `ON DELETE SET NULL`.
- `admin_set_product_category(p_product_id uuid, p_category text)` exists, is SECURITY DEFINER, checks `auth.uid()` and `public.is_admin()`, updates `products.category`, and writes an audit row. Its category check currently tests category existence but does not require `is_active = true`; migration 029's new RPC does require active categories. Keep the behavior difference in mind and test it.
- Live product RLS policies reported: `products_admin_read`, `products_farmer_delete`, `products_farmer_insert`, `products_farmer_update`, and `products_public_active`. `product_categories_public_read` and `audit_admin_read` also exist. Policy names alone do not prove safety; inspect each USING/WITH CHECK expression before changing policies.
- Product constraints include nonnegative price/stock, commission 0–100, unique slug, and a farmer foreign key. The commission column is `reseller_commission_percent`, not `commission_percent`.
- The live `is_admin()` and `admin_set_product_category` functions are SECURITY DEFINER. Their live function-level `proconfig` and execute grants still need a dedicated check; do not infer the configured search_path from the session setting.

## Current decision: stop before a schema-changing fix

The repository code expects `moderation_status` and `commission_percent`, while the live DB does not have them. There is no confirmed authoritative migration in the inspected branch that establishes these columns. Automatically adding them or removing the approval filter would invent business semantics and could accidentally expose unapproved products. Therefore, no app compatibility patch or migration should be applied until the intended moderation workflow and commission-column source are confirmed from the canonical schema/migration history.

## Recommended rollout

1. Resolve the missing `moderation_status` and `commission_percent` schema/source mismatch first; determine the correct migration order from repository migration history rather than guessing.
2. Inspect the full definitions and grants for `admin_set_product_category`, `product_categories`, `admin_audit_log`, and the relevant product RLS policies.
3. Apply the required migrations to a disposable/staging Supabase project only, in verified dependency order (029 → 030; 031 → 032 only if site-integration features are intended).
4. Run staging SQL checks plus app typecheck/build/tests.
5. Verify create/edit, partial-failure behavior, public detail rendering, JSON-LD, and sitemap with safe test records.
6. Have a human review the diff and staging evidence.
7. Only after explicit approval, plan any production migration separately.

## Safety record

This document is a review artifact only. It does not apply migrations, alter data, change permissions, deploy production, or enable payments.
