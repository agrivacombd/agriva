# AGRIVA Marketplace and Plant Market separation

## Identity and authorization

Both markets use the existing Supabase Auth identity (auth.users.id / profiles.id). Seller approval is deliberately not inferred from signup metadata or the legacy seller / organization role membership.

- marketplace_seller_applications and marketplace_seller_permissions govern Marketplace access.
- plant_seller_applications and plant_seller_permissions govern Plant Market access.
- A user may hold both permissions, but each application is reviewed independently.
- The admin review screen is /admin/seller-applications.
- Admin queue API: GET /api/admin/seller-applications/{market}/queue.
- Admin decision API: PATCH /api/admin/seller-applications/{market}/{applicationId} with status approved or rejected and an optional review_note.
- Admin permission revocation: PATCH /api/admin/seller-permissions/{market}/{userId} with status revoked.
- Plant Market product moderation: /admin/plant-market-products with GET/PATCH /api/admin/plant-market-products.
- Approved seller roles are mirrored into the existing user_role_memberships table for dashboard navigation; the permission tables remain the authorization source.
- The APIs use the existing catalog.moderate admin capability. Revoking one market's permission pauses only that market's active listings; reactivation requires fresh moderation.

## Catalogues

- Marketplace keeps the existing public.products table to preserve existing Marketplace order, cart, reseller attribution and product URL compatibility.
- Plant Market uses the separate public.plant_market_products table.
- Marketplace image uploads use product-images; Plant Market uploads use plant-product-images.
- Public catalogue queries require status = active. Seller writes are forced to draft by database triggers.
- The Plant Market catalogue does not keyword-filter or query public.products.

## Routes

- Marketplace seller acquisition: /sell-on-marketplace
- Plant Market seller acquisition: /sell-on-plant-market
- Marketplace seller dashboard and product form: /seller/products, /seller/products/new
- Plant Market seller dashboard and product form: /plant-seller/products, /plant-seller/products/new
- Plant Market product detail: /plant-market/{slug}

## Migration and deployment

Apply supabase/migrations/20261031120000_separate_marketplace_and_plant_market.sql to the intended Supabase environment before deploying the application branch. Do not deploy the new application code before the migration is applied; the new routes query the new permission and Plant Market tables.

Legacy Marketplace memberships with a non-null granted_by and sellers who already have an active, previously moderated Marketplace product are backfilled as approved to avoid breaking existing live listings. Self-selected legacy seller / organization memberships without an active product do not become permissions automatically; those accounts must complete the Marketplace application/review flow. No legacy account is automatically granted Plant Market permission.

## Deliberate follow-up

The current production checkout and order model references public.products. Plant Market now has its own isolated product catalogue and detail pages, but its independent cart, checkout, order, payment, refund and seller order dashboard are not part of this change. Do not route Plant Market product IDs into the Marketplace checkout. Implement a dedicated Plant Market order lifecycle before enabling Plant Market purchase buttons.

## Verification

Run npm run test:plant-market, npm run test:seller-marketplace-submission, npm run test:api-role-hardening, npm run lint, and npm run build after installing the repository's pinned dependencies and applying the migration to a test database.
