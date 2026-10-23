# AGRIVA — Super Admin Permissions & B2B Wholesale Design

**Status:** Design/review artifact only. This document is not an executable migration. No database changes, permission changes, data changes, PR merge, or production deployment have been performed.

## Goals

1. Make Super Admin the default and exclusive authority for category/attribute configuration and B2B buyer verification.
2. Allow Super Admin to delegate only the category-configuration section to specific Admin profiles through a narrow permission.
3. Show wholesale prices only to authenticated, currently approved B2B buyers.
4. Keep retail pricing and public SEO output independent from private wholesale pricing.
5. Keep all approvals, permission grants, and pricing decisions server-authoritative and auditable.

## 1. Role and permission matrix

| Capability | Retail user | Pending/rejected B2B | Approved B2B | Admin (no grant) | Admin with category-config grant | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| View retail price | Yes | Yes | Yes | Yes | Yes | Yes |
| Read wholesale price | No | No | Yes, when active | No | No by virtue of this grant | Yes, for administration |
| Apply for B2B | Yes | Yes | Already approved | Optional separate buyer account | Optional separate buyer account | Optional separate buyer account |
| Approve/reject/suspend B2B | No | No | No | No | No | Yes |
| Configure categories/attributes | No | No | No | No | Yes, only if granted | Yes |
| Grant/revoke category-config permission | No | No | No | No | No | Yes |
| Approve product revisions | No | No | No | Only if separately authorized by existing product-review policy | Not implied by category grant | Yes, subject to product workflow |
| Change security code/database schema | No | No | No | No | No | No; developer-reviewed |

**Important:** B2B verification is a capability attached to the buyer account, not an Admin role. Category configuration permission does not confer B2B approval, product approval, role management, or wholesale-price access.

## 2. Permission model

Proposed permission key: `marketplace.category_config.manage`.

Preferred implementation:
- Add a normalized permission grant table (or integrate with an existing authoritative permission system only after inventory confirms one exists).
- Suggested fields: `id uuid`, `user_id uuid references profiles(id)`, `permission_key text`, `granted_by uuid references profiles(id)`, `created_at timestamptz`, `revoked_at timestamptz null`, `reason text`.
- Unique active grant per `user_id, permission_key`; prevent a grantor from granting their own permission.
- Only Super Admin can grant/revoke this permission. Use server-side role checks and audit every grant/revoke.
- Permission checks must be performed by every protected server action/RPC and protected page data loader. Client navigation visibility is only a usability feature.
- Default deny. Revocation takes effect on the next server authorization check. Avoid long-lived authorization caches.
- Before implementation, confirm how the existing system represents Super Admin vs Admin; do not assume `profiles.role='admin'` alone distinguishes them. If no canonical Super Admin role exists, define a secure bootstrap procedure outside a user-editable profile field.

## 3. B2B application and verification model

Proposed separate table `public.b2b_business_profiles`:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references public.profiles(id)`
- `business_type text not null check in ('entrepreneur','business','enterprise','wholesaler','other')`
- `legal_name text not null`
- `business_registration_id text null`
- `contact_name text not null`
- `contact_phone text not null`
- `business_address jsonb not null` (strict allowlist of address keys)
- `document_storage_paths text[] not null default '{}'` (private bucket only; no public URLs)
- `verification_status text not null check in ('pending_verification','approved','rejected','suspended') default 'pending_verification'`
- `submitted_at timestamptz not null default now()`
- `reviewed_by uuid null references public.profiles(id)`
- `reviewed_at timestamptz null`
- `decision_reason text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints and decisions:
- Enforce at most one current business application/profile per user unless a verified product requirement calls for multiple legal entities.
- Keep an append-only `b2b_verification_events` history (application ID, actor, previous/new status, reason, timestamp). Do not overwrite the only record of a prior rejection or suspension.
- A Super Admin must not approve their own application. All review RPCs derive actor from `auth.uid()`; never trust a client-provided reviewer ID.
- Applicants can read/update only their own application while it is pending or rejected; only Super Admin can read review documents and decide. Define whether a rejected application must be edited/re-submitted or a new application created, preserving history.
- Documents are private, access is time-limited and authorized, uploads are size/type-checked, and retention/deletion rules are defined before launch. Do not collect documents not needed for verification.
- Uploaded files alone are not proof of authenticity; document verification needs a documented business process.
- B2B status does not grant seller, reseller, or Admin privileges automatically.

## 4. Wholesale price model

Proposed table `public.product_wholesale_prices`:
- `id uuid primary key default gen_random_uuid()`
- `product_id uuid not null references public.products(id) on delete restrict`
- `min_quantity numeric not null check (min_quantity > 0)`
- `max_quantity numeric null` (null means no upper bound)
- `unit_price numeric not null check (unit_price >= 0)`
- `currency text not null default 'BDT'`
- `is_active boolean not null default true`
- `valid_from timestamptz null`
- `valid_until timestamptz null`
- `created_by uuid not null references public.profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:
- Do not overwrite `products.price`; that remains the retail price.
- Prevent overlapping active quantity tiers for the same product and effective period; ensure tier boundaries are consistent.
- Only allow price management to an authorized role/path; price changes to public products must follow the product revision/approval workflow.
- The exact price/quantity data model must be validated against current cart/order-item schema before writing SQL. If product variants exist or are planned, key prices to a variant rather than product alone.
- Public catalog, anonymous API, metadata, JSON-LD, Open Graph, and sitemap must never return wholesale prices.
- Wholesale-price reads require an authenticated session and a server-side check that the buyer's current B2B status is approved and not suspended. Do not expose the table through broad direct SELECT grants; use a narrowly granted RPC or server endpoint with locked `search_path`.
- Checkout must re-check approval, active product state, minimum quantity, tier and effective dates, then compute the amount server-side.
- Order items should persist unit price, currency, pricing mode (`retail`/`wholesale`), applied tier, and product snapshot. Existing order schema must be inspected before deciding exact column names or migration strategy.

## 5. Proposed RPC contract (not executable SQL)

- `submit_b2b_application(...)`: derive user from `auth.uid()`; validate fields; create/update pending application; never accept reviewer/status from client.
- `super_admin_review_b2b_application(application_id, decision, reason)`: only Super Admin; reject self-approval; lock application row; validate transition; update status and append event/audit atomically.
- `super_admin_grant_permission(user_id, permission_key, reason)`: only Super Admin; allowlisted permission keys; no self-grant; audit.
- `super_admin_revoke_permission(grant_id, reason)`: only Super Admin; revoke immediately and audit.
- `admin_manage_category_configuration(...)`: require Super Admin or explicit `marketplace.category_config.manage` grant; use safe attribute types and validation operators; audit before/after; never execute arbitrary SQL.
- `get_wholesale_prices(product_ids, quantities)`: require current approved B2B status; return only eligible prices for requested products/quantities; no unbounded dump endpoint.
- `create_order(...)`: re-evaluate account eligibility and price tier in the same trusted server transaction; ignore client-submitted totals/price modes.

Every SECURITY DEFINER function must use a fixed safe search_path, schema-qualified objects, explicit auth checks, narrow EXECUTE grants, and transaction-safe audit writes. Prefer a trusted server-side function for checkout if that matches the existing architecture; do not create duplicate checkout pathways.

## 6. RLS and private data requirements

- Enable RLS on all new private tables.
- Anonymous users cannot read B2B applications, documents, grants, wholesale prices, or pending product revisions.
- Applicants may read only their own permitted application fields; document access is narrower than ordinary profile access.
- Only Super Admin can list/review all B2B applications or mutate permission grants.
- Category-config delegates can only use the category configuration endpoints; no table-wide grant that accidentally exposes B2B applications or wholesale prices.
- Prefer no direct client SELECT policy on wholesale prices; use the narrowly authorized RPC/server endpoint.
- Test RLS independently from UI hiding and RPC checks.

## 7. Cache, public SEO and price leakage

- Retail public pages and Product/Offer JSON-LD always use `products.price` only.
- Authenticated wholesale pricing responses must be private/no-store or correctly partitioned by authenticated user and verification state. Never rely on a shared cache to distinguish B2B users.
- On B2B suspension/revocation, deny subsequent reads and checkout immediately; previously placed orders retain their immutable price snapshot.
- Ensure logout/account switching cannot leave a wholesale price in client cache or hydrated page data.
- Search, recommendations, analytics events, logs, error messages, and exports must not leak private prices or verification documents.

## 8. Audit and data minimization

Record actor, target, action, time, reason, and relevant IDs for:
- permission grant/revocation;
- B2B application submit/update/review/suspend/reinstate;
- wholesale price create/update/disable;
- category/attribute configuration change;
- wholesale order price snapshot.

Avoid putting uploaded document contents, identity numbers, phone numbers, or complete proposed product payloads in audit metadata. Define retention and access controls for documents and verification fields.

## 9. Implementation sequence and blocking questions

1. Read-only inventory: confirm canonical Super Admin identity/role, existing permission tables, profile IDs/roles, order and order-item schemas, cart/checkout RPCs, storage buckets, and current product revision plan.
2. Finalize table/column names to avoid duplicating existing concepts.
3. Draft forward-only migration(s) and RPC definitions; test on disposable/staging project only after explicit staging authorization.
4. Add Super Admin permission UI and category configuration section.
5. Add B2B application form, private document upload, verification queue, and event history.
6. Add private wholesale price management, authorized read path, checkout revalidation, and order price snapshots.
7. Add tests for RLS, direct API attempts, self-approval, self-grant, role escalation, cache leakage, price tiers, concurrent checkout, and revocation.
8. Reconcile public pages/SEO and run staging smoke tests.

## 10. Acceptance criteria

- A normal Admin never sees or accesses Marketplace Configuration without an explicit active grant.
- A category-config delegate cannot grant permissions, verify B2B accounts, approve products, or read wholesale prices unless separately authorized by a distinct policy.
- Only Super Admin can approve/reject/suspend B2B accounts; self-approval is rejected.
- Pending/rejected/suspended B2B accounts never receive wholesale prices through UI, API/RPC, cache, exports, or checkout.
- Retail prices and public Product/Offer schema remain unchanged by private wholesale prices.
- Checkout calculates wholesale price and tier server-side and persists the applied price snapshot.
- All privileged actions are audited; revocation takes effect on the next request.
- No new migration is applied to any database until explicitly authorized.

## Non-actions

This is a design document only. It does not apply migrations, change live permissions, alter data, merge a PR, or deploy production.

## 8. Non-negotiable wholesale privacy and SEO boundary

- **Retail price is the only price eligible for public SEO.** Public product pages, Product/Offer JSON-LD, Open Graph/Twitter metadata, canonical pages, XML sitemap, Merchant Center/feed exports, search indexes, and AI crawler-facing public content may expose only the normal retail `products.price`.
- Wholesale prices and quantity tiers must never be included in public HTML, hydration/RSC payloads, public API responses, client-side state, page source, metadata, JSON-LD, public feeds/exports, sitemap URLs/labels, or public caching layers. Do not render wholesale data and hide it with CSS.
- A public product's schema `offers.price` must be exactly the retail price shown to ordinary visitors. Do not emit alternate wholesale `Offer` entries, wholesale `PriceSpecification`, or B2B price ranges in structured data.
- Public Store pages may be indexed only as a storefront/product-discovery page. Their product list and metadata must be based on approved + active products and public retail fields. Wholesale values are not a ranking signal and must not be placed in SEO text, keywords, hidden content, schema, or AI discovery summaries.
- B2B price access must be implemented through a separate authenticated server-side response that checks both current business verification status and the explicit active `marketplace.wholesale_prices.view` permission. Do not reuse public product loaders, public caches, or SEO data loaders for this response.
- Server authorization is required on every read and checkout; hiding a UI control is not access control. Checkout must revalidate approval and permission, calculate the eligible tier server-side, ignore client-submitted prices, and store the actual charged price in the order snapshot.
- Add regression tests that fail if public product/store/SEO/feed/sitemap code starts querying or serializing wholesale fields. Do not enable indexing or launch B2B pricing until these tests and the live-schema compatibility checks pass.

## 9. Super Admin-controlled seller product-form complexity

Company sellers and wholesalers must be able to add products through a simple, low-friction form. SEO and advanced tools are optional for sellers and must not be forced into the default add-product flow.

- Super Admin alone manages feature visibility policy by seller cohort/role/account and may grant or revoke a narrowly scoped capability such as `marketplace.product_fields.seo.manage`, `marketplace.product_fields.advanced.manage`, and `marketplace.product_fields.category_attributes.manage` for explicitly selected Admins or seller groups.
- Super Admin may configure which form sections are visible to a seller cohort: essential product details, images, SEO Studio, schema/structured data, AI suggestions, seed/agriculture-specific fields, advanced inventory/pricing, and optional marketing fields.
- Default company/wholesaler form should be simple: product name, category, description, retail price, stock/quantity, images, and only business-required fields. SEO, JSON-LD, AI recommendations and advanced options can be hidden or shown as optional sections by policy.
- Hiding a section is a presentation preference, not permission to bypass validation. All required fields, price limits, ownership, category rules, publication approval and server-side authorization are enforced independently on server/RPC paths.
- Super Admin configuration must be validated against an allowlist of section/field keys; no arbitrary component names, SQL, or executable configuration. Unknown keys fail closed to hidden.
- Effective settings are calculated server-side from the authenticated actor, their approved account cohort, and explicit active grants. Do not trust a client-supplied role, cohort, or visibility map. A user cannot grant themselves features or alter another seller's settings.
- Persist changes with actor, target scope, before/after values, timestamp and reason in the admin audit log. Revocation applies on the next request. Prevent last-Super-Admin lockout and require explicit confirmation for broad cohort-wide changes.
- Seller-facing form visibility must not hide wholesale prices from public SEO controls: SEO output always uses retail `products.price` only, regardless of which fields a seller can see.
- Acceptance tests: default seller form remains simple; granted feature shows only allowed sections; revoked feature disappears immediately; seller cannot self-enable sections; hidden sections cannot bypass server validation; SEO schema/feed/sitemap never includes wholesale price.
  
This is a design requirement, not an implemented permission system. Trusted Super Admin identity/source-of-truth and live schema compatibility remain prerequisites for executable migration and production rollout.
