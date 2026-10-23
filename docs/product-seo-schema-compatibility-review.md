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

The live database does not currently expose the newer SEO overloads or `admin_set_seed_details`.

The migration history returned by Supabase includes migrations 001–028 and the listed security, checkout, buyer-demand, and transport migrations, but **does not include 029 or 030**.

## Intended migration sequence

1. `029_product_seo_schema.sql`
2. `030_seed_seo_and_reporting.sql`

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

Before applying migrations to any shared or production database, inspect the current branch's Product Add/Edit UI and all RPC call sites. Confirm the UI sends exactly the argument names/types in the new overloads and handles Postgres errors safely. Also inspect the public product detail route, metadata generation, JSON-LD, and sitemap so each referenced field is either present or safely optional.

## Recommended rollout

1. Apply 029 and 030 to a disposable/staging Supabase project only.
2. Run the staging checks above and the app's typecheck/build/tests.
3. Verify product create/edit, public detail rendering, JSON-LD, and sitemap with a draft test product.
4. Have a human review the diff and staging evidence.
5. Only after explicit approval, plan any production migration separately.

## Safety record

This document is a review artifact only. It does not apply migrations, alter data, change permissions, deploy production, or enable payments.
