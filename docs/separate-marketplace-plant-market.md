# AGRIVA Marketplace and Plant Market separation

## Identity and authorization

Both markets use the same Supabase Auth account. Authorization reuses AGRIVA's existing identity and module-access system; no parallel seller-permission or seller-application tables are introduced.

- Marketplace sellers apply through `module_access_applications` with module `marketplace` and applicant type `business`. Approval verifies the business organization and grants organization-scoped `user_module_grants`.
- Plant Market sellers apply through the same application workflow with module `plant_market` and applicant type `gardener`. Approval verifies `gardener_profiles` and grants global Plant Market access.
- A user may have both grants. Approval, expiry and revocation remain independent per module.
- Seller application entry: `/account/verification?module=marketplace` or `/account/verification?module=plant_market`.
- Admin identity review: `/admin/identity-verification`.
- Admin seller grant management: `/admin/seller-applications` (redirects to the existing module review flow and lists the active module grants).
- Admin revocation uses the SECURITY DEFINER RPC `admin_revoke_market_access`; Marketplace revocation is organization-scoped, Plant Market revocation is global-scoped.
- Revoking a module's final create grant pauses only that module's active listings. It does not revoke the other module's grant.

## Catalogues and existing commerce

- Marketplace keeps `public.products`, its existing cart/order/reseller/payment relationships and product IDs.
- The Marketplace table is constrained to `marketplace_channel = 'marketplace'`; its insert/update RLS guards require a verified organization and Marketplace module grants. Seller deletion is not exposed; moderation remains admin-controlled.
- Plant Market uses the physically separate `public.plant_market_products` table. Its writes require verified `gardener_profiles` plus the Plant Market module grant.
- Plant Market images use the separate `plant-product-images` Storage bucket; identity evidence remains private in `identity-verification`.
- Public catalogue queries show only active products. Seller submissions are forced to draft by the database trigger and require admin moderation.
- A one-time compatibility backfill grants only existing Marketplace seller/organization role members and owners of existing Marketplace products a verified legacy Marketplace organization plus read/create/update grants. It never grants Plant Market access.
- The migration aborts if legacy non-Marketplace channel rows are found in `public.products`; it will not silently relabel or delete them.

## Routes

- Marketplace seller acquisition: `/sell-on-marketplace`
- Plant Market seller acquisition: `/sell-on-plant-market`
- Shared identity workflow: `/account/verification`
- Marketplace seller dashboard and product form: `/seller/products`, `/seller/products/new`
- Plant Market seller dashboard and product form: `/plant-seller/products`, `/plant-seller/products/new`
- Plant Market product detail: `/plant-market/{slug}`
- Plant Market moderation: `/admin/plant-market-products`

## Migration and deployment

The repository now includes the existing module-access foundation and identity-verification migrations required by the seller workflow, followed by `20261031120000_separate_marketplace_and_plant_market.sql`.

Apply and verify the migrations on an isolated Supabase test project first. Before production deployment, inspect the actual production project's migration ledger; do not assume the module-access or identity-verification schema is already present. The separation migration checks that no Plant Market-channel rows remain in `public.products` and fails safely if it finds any.

The existing Marketplace products, carts, orders, reseller attribution and payment tables are not renamed or copied. The migration adds only a channel guard and independent Plant Market catalogue, RLS, storage and module-revocation behavior.

Before applying to production, run a manual legacy Plant Market candidate audit against `public.products` using the previous Plant Market keyword set (Bengali: গাছ, চারা, বীজ, ফুল, ফল, টব, মাটি, কম্পোস্ট, বাগান, ইনডোর, ক্যাকটাস, সাকুলেন্ট, নার্সারি; English: plant, tree, sapling, seedling, seed, flower, fruit, pot, soil, compost, garden, gardening, indoor, cactus, succulent, nursery, orchid). This list is intentionally an audit hint, not an automatic classifier: review category, seller and order history before moving any listing. Do not delete or re-key a Marketplace product that is referenced by existing orders. The production data migration must preserve historical order references and pause any reclassified legacy Marketplace listing.

## Deliberate follow-up

Plant Market now has an isolated product catalogue and detail pages, but its independent cart, checkout, order, payment, refund and seller order dashboard are not part of this change. Do not route Plant Market product IDs into the Marketplace checkout. Implement and test a dedicated Plant Market order lifecycle before enabling Plant Market purchase buttons.

## Verification

Run `npm run test:module-access`, `npm run test:identity-verification`, `npm run test:plant-market`, `npm run test:seller-marketplace-submission`, `npm run test:api-role-hardening`, `npm run lint`, and `npm run build` after applying the migrations to an isolated test database.
