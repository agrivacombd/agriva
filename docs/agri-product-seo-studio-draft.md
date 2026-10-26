# AGRIVA Agricultural Product SEO Studio — Draft

## Research basis

This implementation borrows general ecommerce patterns (structured product identity, category, clear imagery, unique title/description, useful product attributes, and an admin preview) rather than copying another store's branding.

References:
- Google Search Central, Product structured data: https://developers.google.com/search/docs/appearance/structured-data/product
- Google Search Central, Product snippets: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Shopify, Product listing optimization: https://www.shopify.com/blog/product-listing-optimization

Google documents structured data as an eligibility aid, not a ranking guarantee. Hashtags are stored for social distribution and are not a Google product-ranking shortcut. Search terms must read naturally and describe the actual product.

## Existing AGRIVA marketplace audit (repository-level)

- Existing admin product management at `/admin/products` edits name, description, price, stock, commission, status and category; it does not provide a complete product-creation/SEO workflow.
- Existing farmer upload form is minimal and saves a draft pending moderation.
- Existing product detail route is `/marketplace/[productId]`; it already emits basic Product JSON-LD, metadata, category breadcrumbs and stock/price.
- Public product detail and category indexability checks require `status = active` and `moderation_status = approved`; samples are noindex. The new upload workflow preserves moderation and saves new products as pending.
- Existing taxonomy is agriculture-focused: seeds, fertilizer, crop protection, tools/equipment, produce, animal feed.
- Existing image display was a placeholder. This draft supports public image URLs with previews; direct image upload/Storage bucket integration is not part of this first pass.

This is a repository-code audit, not a live crawl or a verified production database audit. No live/draft inventory has been changed.

## Upload workflow

1. Product identity: name, brand, SKU, category/subcategory, type/variety, price, stock, unit, origin, packaging.
2. Agriculture-specific information: crop suitability, composition, usage instructions, safety/registration details. Chemical/agrochemical claims must come from the manufacturer label or verified registration; never invent dosage or safety claims.
3. Media: one primary image plus additional images using public HTTP(S) URLs.
4. Search presentation: title, meta description, URL slug, natural-language keywords and optional hashtags.
5. Readiness checklist and SERP preview.
6. Save as draft by default. Requesting activation cannot bypass the quality checklist or moderation; records remain moderation-pending.

## SEO data and guardrails

- Unique slug and SKU (when provided); slug remains stable after publication.
- Server-side admin authorization and an audited database function.
- The server computes a checklist state; a checklist score is not a Google score.
- Product detail pages consume stored title/description, images, brand, SKU, crop suitability, composition, usage and safety data.
- Product JSON-LD includes the actual image URLs, brand/SKU when supplied, price, currency and stock availability.
- Only approved, active products should be indexable; no fake ratings/reviews are generated.
- Use specific, helpful product descriptions. Avoid keyword stuffing, duplicate copy, unsupported yield/health claims and misleading claims about certification.
- Keep price, stock and availability aligned between page, checkout and structured data.
- Search Console / Merchant Center feed setup, automated keyword volume data, image file uploads, product variant modeling, redirects, and performance reporting remain follow-up work.

## Draft-only safety

Migration `20261027210000_agri_product_seo_fields.sql` adds fields and an admin-only creation RPC. It has not been applied to any database. Review RLS, migration compatibility, constraints and RPC privileges; run CI and test against a disposable/staging database before any production approval. No deployment or publication is part of this change.
