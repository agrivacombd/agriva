# AGRIVA live Supabase verification — B2B / Super Admin / product SEO

**Verified:** 2026-10-23  
**Project:** `dhqaepsbuwhbynagfxpf` (`supabase-coral-clock`, ACTIVE_HEALTHY, Postgres 17.11)  
**Method:** read-only project metadata, migration history, catalog queries, and Supabase Security Advisor.  
**No DDL/DML was executed.** No migration, data, permission, or storage policy was changed.

## Live facts confirmed

### Migration drift blocks the current Product SEO Studio

The live migration history includes migrations 001–028 and the October 22 security/checkout hardening migrations, but does **not** include repository migrations 029, 030, 031 or 032.

Live `public.products` columns are:
`id, farmer_id, name, slug, description, price, stock, reseller_commission_percent, status, created_at, updated_at, category`.

The live schema does not currently have the SEO columns expected by the admin product form (SEO title/description/keywords, image URL, brand, SKU) or seed attributes (crop name, seed variety, pack size, germination rate, sowing season, suitable regions, seed expiry). The current Admin product form calls the SEO-enabled `admin_update_product` overload and `admin_set_seed_details`; the public product detail and sitemap code also reference fields/filters not present in the inspected live product schema (including `moderation_status` and `commission_percent`). Those query paths are at risk of failing against this live schema.

**Do not fix this by blindly applying 029–032.** Migration 029/030 are the repository’s intended SEO/seed field sources, but the missing `moderation_status` / product-level `commission_percent` need an authoritative migration/source and semantic review first. Existing `reseller_commission_percent` is the current product commission field; `marketplace_orders.commission_percent` is an order snapshot and must not be confused with a product column. Removing approval filters would risk publishing unapproved products.

### Super Admin-only category configuration is not enforced

Live `profiles.role` is enum `farmer | reseller | admin`. There is no `is_super_admin` function and no confirmed live `admin_permission_grants` table. `is_admin()` returns true for every profile with role `admin`.

Both live SECURITY DEFINER RPCs:
- `admin_save_product_category(uuid,text,text,text,boolean,integer)`
- `admin_set_product_category(uuid,text)`

authorize with `auth.uid() is not null AND public.is_admin()`. The migration comment calling product category assignment “Super Admin” does not add a Super Admin check. Therefore the desired Super Admin-only category configuration is currently a real authorization gap, not just a UI issue.

**Safe blocker:** do not expose category mutation to ordinary Admins or deploy an unbootstrapped Super Admin check. First select a trusted server-managed bootstrap mechanism and the designated initial Super Admin identity. No user-editable profile metadata may be used as an authority source. Until that decision is implemented, keep the feature in review and do not claim the live system is Super Admin-gated.

### Current storage and B2B state

The live storage bucket inventory returned one private bucket, `crop-disease-photos`, with user-folder-scoped policies. No dedicated B2B business-document bucket/policy is present in the inspected bucket inventory. Do not store verification documents in a public bucket or re-use crop-disease-photo paths.

Live relevant tables include `profiles`, `products`, `product_categories`, `marketplace_orders`, and `admin_audit_log`, all with RLS enabled. No live tables named `admin_permission_grants`, `b2b_business_profiles`, or `product_wholesale_prices` were found. B2B must remain a separate verification state, not an invented role or a client-editable flag.

### Existing checkout contract

The live COD RPC locks the active product, uses the database product price, snapshots `unit_price`, `total_amount`, commission percentage/amount and decrements stock in the transaction. A six-argument wrapper rejects unvalidated reseller attribution and delegates to the seven-argument trusted implementation. Any wholesale implementation must extend this path transactionally, ignore client prices and tier claims, revalidate buyer approval at checkout, and preserve stock/reseller/commission behavior.

The current web checkout loops over cart items and creates separate orders. If one item succeeds and a later one fails, a partial order can remain while the cart is not cleared. Wholesale work should not create another independent checkout path; either implement a bulk atomic checkout or explicitly design robust partial-order recovery/idempotency.

### Security Advisor

The live Security Advisor reports:
- 6 SECURITY DEFINER functions executable by `anon`;
- 27 SECURITY DEFINER functions executable by `authenticated`;
- leaked-password protection disabled.

These are **review findings, not proof that all 33 functions are exploitable**. Some anonymous functions (`get_public_site_settings`, search tracking, referral resolution) are intentionally public; admin/checkout functions must be assessed by their internal authorization and least-privilege grants. Do not bulk-revoke all EXECUTE grants without caller inventory and regression tests. Enable leaked-password protection through the appropriate Auth settings after staging/impact review.

Advisor reference: https://supabase.com/docs/guides/database/database-linter#security-definer-functions

## Next implementation order (updated)

1. Decide the initial Super Admin bootstrap authority/identity. No trusted identity was inferred from project ownership or profile data.
2. Reconcile live migration history with repository migrations 029/030 and resolve the provenance of `moderation_status` and product `commission_percent`.
3. Prepare a **new review-only compatibility migration plan** with preflight assertions, explicit function grants/revokes and RLS tests. Do not apply it to production.
4. Implement Super Admin checks at both server-rendered category UI and SECURITY DEFINER RPC layer; implement delegated permission as a separate allowlisted grant, checked against active Admin role.
5. Design B2B applications, private document access, verification event/audit transaction, and wholesale tier schema.
6. Extend the single trusted checkout path, address multi-item partial-order/idempotency risk, and test price leakage across REST, RPC, metadata, JSON-LD, sitemap, cache, exports and order reports.
7. Run staging tests and security advisor before requesting any merge or deployment approval.

## Safety record

This is an actual read-only verification of the intended Supabase project, not a simulation. The project metadata and live catalog were read; no SQL mutation, migration apply, role grant, storage change, PR merge, or production deploy occurred.
