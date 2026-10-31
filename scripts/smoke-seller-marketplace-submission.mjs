#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const form = readFileSync("components/seller/SellerProductForm.tsx", "utf8");
const route = readFileSync("app/api/seller/products/route.ts", "utf8");
const legacyRoute = readFileSync("app/api/farmer/products/route.ts", "utf8");
const sellerPage = readFileSync("app/seller/products/new/page.tsx", "utf8");
const sellerProductsPage = readFileSync("app/seller/products/page.tsx", "utf8");
const farmerPage = readFileSync("app/farmer/products/new/page.tsx", "utf8");
const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20261029120000_separate_seller_marketplace_from_harvest.sql", "utf8");
const permissionMigration = readFileSync("supabase/migrations/20261031120000_separate_marketplace_and_plant_market.sql", "utf8");

assert.match(form, /createSupabaseBrowserClient/, "seller form must use the cookie-aware Supabase browser client");
assert.match(form, /storage\.from\("product-images"\)\.upload/, "seller form must upload product images to Storage");
assert.match(form, /fetch\("\/api\/seller\/products"/, "seller form must submit to the seller-only endpoint");
assert.match(form, /image_url/, "seller form must submit the public image URL with product details");
assert.match(form, /MAX_IMAGE_SIZE/, "seller form must enforce an image size limit before upload");
assert.doesNotMatch(form, /রিসেলার কমিশন \(%\)/, "seller form must not offer a commission value overridden by the database");
assert.match(route, /findMarketplaceOrganizationWithAccess/, "product API must verify existing Marketplace module access");
assert.match(route, /organizations/, "product API must require a verified organization scope");
assert.match(route, /marketplace_channel:\s*"marketplace"/, "product API must store only Marketplace channel products");
assert.match(route, /status: "draft"/, "seller products must await moderation");
assert.match(route, /product-images/, "product API must validate product image URLs against the configured bucket");
assert.match(route, /storage\/v1\/object\/public\/product-images\//, "only public product-images URLs should be accepted");
assert.match(route, /validFileName[\s\S]*image\.search[\s\S]*image\.hash/, "seller image URLs must be limited to the seller folder and a UUID filename without query/hash");
assert.match(legacyRoute, /status: 410/, "legacy farmer product API must not create marketplace products");
assert.match(sellerPage, /findMarketplaceOrganizationWithAccess/, "seller product page must require Marketplace module access");
assert.match(sellerProductsPage, /findMarketplaceOrganizationWithAccess/, "seller product management page must require Marketplace module access");
assert.match(sellerProductsPage, /eq\("farmer_id", user\.id\)/, "seller product management must show only the signed-in seller's products");
assert.match(dashboard, /href: "\/seller\/products"/, "seller dashboard must link to seller product management");
assert.match(farmerPage, /redirect\("\/sell-harvest"\)/, "farmer product route must direct farmers to Sell Harvest");
assert.match(migration, /DROP POLICY IF EXISTS "products_farmer_insert"/, "migration must remove the broad farmer insert policy");
assert.match(permissionMigration, /products_marketplace_only_channel_check/, "Marketplace product table must reject Plant Market channel records");
assert.match(permissionMigration, /products_module_access_insert_guard/, "Marketplace product insert RLS must preserve organization-scoped module access");
assert.match(permissionMigration, /public\\.has_module_access\\('marketplace'/, "Marketplace product RLS must use the existing module grant");
assert.match(migration, /DROP POLICY IF EXISTS "Farmers can upload own product images"/, "migration must replace farmer-only product image uploads");
assert.match(migration, /storage\.foldername\(name\)/, "Storage policy must restrict uploads to the user's folder");

assert.doesNotMatch(permissionMigration, /marketplace_seller_permissions|plant_seller_permissions/, "seller authorization must not duplicate the module grant system");
console.log("Seller marketplace separation regression checks passed.");
