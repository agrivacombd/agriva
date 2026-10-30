# Agriva Product SEO Studio

## Scope in this feature branch

- Adds `/admin/product-studio` for admin-only product creation with product identity, category, price/stock, agriculture-specific attributes, image URLs/alt text, SEO title/description, search phrases and editor-supplied FAQ.
- Adds `POST /api/admin/product-seo`, protected by the existing `catalog.create` admin capability. The database RPC independently verifies `public.is_admin()`.
- New products are always created as `draft`. The SEO readiness checklist is an editorial aid; it does not publish products or guarantee Google indexing/rankings.
- Adds optional product SEO fields and a dedicated admin creation RPC in migration `20261030160000_product_seo_studio.sql`.
- Extends the public product route to read stored metadata, brand/SKU, image gallery/alt text, factual attributes and editor-authored FAQ. It falls back to the legacy select when the new columns are not yet available.
- Existing `app/sitemap.ts` already selects only products whose status is `active`; new draft records are therefore excluded until a separately authorized publishing workflow activates them.

## Required migration

Apply `supabase/migrations/20261030160000_product_seo_studio.sql` to a disposable/staging database first. It is additive and does not update existing product rows or change their status. Do not apply it to production without explicit approval.

## Current limitations / follow-up

- Image input currently accepts public HTTPS image URLs. Direct upload, multi-file storage management, image resizing/WebP conversion and per-image alt text are not included in this first implementation.
- The editor provides manual SEO content fields and a deterministic checklist. No AI provider or model API is configured here, so AI copy generation is intentionally not claimed or simulated.
- The catalogue's existing status/moderation workflow remains authoritative. This feature does not bypass moderation or grant publishing permissions.
- A full SEO edit/review screen for already-existing products, historical slug-to-slug 301 redirect storage, Google Search Console integration, Merchant Center feed, Core Web Vitals telemetry and bulk audit remain follow-up work.
- FAQ content is displayed on the public product page. Product and Offer structured data use actual product facts; no fabricated ratings/reviews are emitted.

## Verification

Run:
- `npm run lint`
- `npm run build`
- `npm run test:marketplace-seo`
- `npm run test:product-seo-studio`

The new smoke test checks source-level contracts only. It is not a substitute for a staging database migration test, authenticated browser test, structured-data validator or live Google crawl.
