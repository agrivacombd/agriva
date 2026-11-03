# AGRIVA Admin Control Center — Implementation Plan

## Status

- Working branch: `feat/admin-control-center-foundation`
- Base branch: `main`
- This document records the Phase 0 repository audit and implementation guardrails.
- No production database or deployment has been changed.

## Current architecture verified in the repository

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Supabase Auth + PostgreSQL through `@supabase/ssr` and `@supabase/supabase-js`.
- Admin page layout already calls `requireAdminPage("dashboard.read")`.
- `lib/admin/authz.ts` has a capability allow-list, server-side `auth.getUser()`, profile-role check, and deny-by-default high-risk capabilities.
- Marketplace products are stored in `public.products`; public detail route is `/marketplace/[productId]` and resolves the product by slug, with UUID fallback/redirect.
- Plant Market has its own `public.plant_market_products` table and public detail route `/plant-market/[slug]`.
- Plant Market seller submission already validates a verified Gardener identity and a separate `plant_market` module grant; new listings start as `draft`.
- Plant Market moderation already exists at `app/api/admin/plant-market-products/route.ts`, but it is a review queue (approve/reject/suspend), not a complete catalogue editor.
- Marketplace admin editing already exists at `app/admin/products/page.tsx` for name, description, price, stock, commission, taxonomy and status. It does not expose the custom slug.
- The current admin articles page reads `article_drafts`; it is not yet a unified published-article CMS.
- Existing smoke tests cover admin authorization, product RPC contracts, Marketplace SEO, Plant Market separation, seller submission, and related security boundaries.

## Phase 0 findings / risks

1. Do not merge Marketplace and Plant Market product tables. Their seller verification, permissions, routes and business rules are deliberately separate.
2. Keep product UUIDs immutable. Slugs are public URL identifiers only.
3. Slug edits must be collision-checked in the database, preserve slug history, and create a redirect from the old public URL. Application-only uniqueness checks are insufficient.
4. Admin product updates must preserve seller ownership and order references. Prefer audited database RPCs for privileged mutations.
5. Existing Plant Market moderation API is not enough for editing active listings; add a distinct full-editor workflow rather than overloading the moderation queue.
6. Normalize admin authorization through `lib/admin/authz.ts`; do not introduce role checks in client components.
7. Public product pages, canonical metadata, JSON-LD and sitemap must all use the current canonical slug.
8. Keep financial operations (refunds, payouts, payment reconciliation) outside ordinary catalogue edit permissions.
9. Do not create duplicate tables for existing seller grants, applications, products, categories or audit records until the live schema is inventoried.

## Target architecture

### Application layers

- **Presentation:** public pages and protected `/admin` pages.
- **Application services:** domain-specific validation and use cases (CMS, Marketplace, Plant Market, SEO, media, orders).
- **Authorization:** centralized server-side capabilities, plus database RLS and narrowly scoped RPC authorization.
- **Persistence:** existing Supabase tables, constraints, indexes, RLS policies, migrations and tests.
- **Integrations:** Supabase Storage, AI providers, weather/payment providers; secrets remain server-side.

### Domain boundaries

- CMS: pages, articles, categories, revisions and publication.
- Marketplace: `products`, Marketplace taxonomy, seller organization grants.
- Plant Market: `plant_market_products`, Gardener verification, Plant Market module grants.
- Commerce: existing orders, payments, commissions and payouts.
- Platform: admin capabilities, audit log, media, SEO metadata, redirects and site settings.

### Product editor contract

Both Marketplace and Plant Market editors should support:

- Name, custom slug, description and category fields.
- Main image and gallery, with storage ownership validation.
- Price, unit and inventory fields appropriate to that product domain.
- Seller identity shown read-only by default; ownership transfer requires a separate high-risk permission.
- Draft/pending/active/paused/rejected/archived lifecycle appropriate to the existing schema.
- SEO title/description and canonical URL where supported.
- Revision/audit trail, actor, timestamp and changed-field summary.
- Preview and public URL link.

The two domains must use separate APIs, validations, permissions and slug namespaces.

### Slug lifecycle

- Generate an initial slug from the product name, but allow admins to override it.
- Normalize Unicode consistently (NFC/NFKC decision documented in implementation), lowercase where applicable, trim separators, and reject empty/invalid values.
- Enforce a unique constraint per public route namespace in PostgreSQL.
- On a published slug change, atomically save the previous slug and add a redirect record.
- Resolve redirects before returning 404; reject loops and conflicting redirect destinations.
- Keep UUIDs unchanged; do not cascade slug changes into order/product foreign keys.
- Update canonical metadata, Open Graph URL, Product JSON-LD and sitemap output.

## Implementation sequence

### V1 foundation
1. Consolidate admin navigation and capability-aware links.
2. Add complete Marketplace product editor with editable slug and database-enforced redirect/history.
3. Add complete Plant Market product editor as a separate domain.
4. Add revision/audit records for catalogue mutations.
5. Add tests for permissions, duplicate slugs, redirect behaviour and public canonical URLs.

### V1 CMS
6. Unify public blog with database-backed published articles.
7. Add article create/edit/review/publish, custom slug, revisions and redirects.
8. Add controlled homepage section builder and preview.

### Platform expansion
9. SEO and media library.
10. Sellers, orders and operational dashboards.
11. AI, agriculture, jobs, Green Living and analytics modules.

## Definition of Done

A module is complete only when server-side authorization, database constraints/RLS, validation, audit history, public rendering, SEO/canonical behaviour, error states, responsive UI and regression tests all pass.

## Database/deployment gate

The connected Supabase accounts currently expose no project under the Primary account. The other account exposes projects named `supabase-coral-clock`, `agriva-identity-approval-test` (inactive), and `agriva-guest-checkout-e2e`; none can safely be assumed to be the live AGRIVA production database.

Therefore this phase does not apply SQL, alter live data, or deploy. Before database migrations are applied, identify the correct AGRIVA Supabase project and inspect its live schema/migration history. Apply changes through reviewed migrations and verify RLS/security advisors and regression tests.
