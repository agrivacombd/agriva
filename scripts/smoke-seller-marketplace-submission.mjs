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

assert.match(form, /createSupabaseBrowserClient/, "seller form must use the cookie-aware Supabase browser client");
assert.match(form, /storage\.from\("product-images"\)\.upload/, "seller form must upload product images to Storage");
assert.match(form, /fetch\("\/api\/seller\/products"/, "seller form must submit to the seller-only endpoint");
assert.match(form, /image_url/, "seller form must submit the public image URL with product details");
assert.match(form, /MAX_PRODUCT_IMAGES/, "seller form must enforce a maximum image count");
assert.doesNotMatch(form, /MAX_IMAGE_SIZE/, "seller form must not impose an app-specific file-size limit");
assert.match(form, /Product listing wizard/, "seller form must use a guided multi-step wizard");
assert.match(form, /CATEGORY_FIELDS/, "seller form must show category-specific product fields");
assert.match(form, /seller_profile/, "seller form must submit optional profile business/licence data");
assert.match(form, /profiles/, "seller form must auto-fill business data from the seller profile");
assert.match(route, /product_attributes: productAttributes/, "seller route must persist structured product attributes");
assert.match(route, /trade_license_expiry/, "seller route must validate optional licence expiry data");
assert.doesNotMatch(form, /রিসেলার কমিশন \(%\)/, "seller form must not offer a commission value overridden by the database");
assert.match(route, /user_role_memberships/, "product API must verify persisted role membership");
assert.match(route, /in\("role", \["seller", "organization"\]\)/, "product API must require seller or approved organization membership");
assert.match(route, /status: "draft"/, "seller products must await moderation");
assert.match(route, /product-images/, "product API must validate product image URLs against the configured bucket");
assert.match(route, /storage\/v1\/object\/public\/product-images\//, "only public product-images URLs should be accepted");
assert.match(route, /validFileName[\s\S]*image\.search[\s\S]*image\.hash/, "seller image URLs must be limited to the seller folder and a UUID filename without query/hash");
assert.match(legacyRoute, /status: 410/, "legacy farmer product API must not create marketplace products");
assert.match(sellerPage, /in\("role", \["seller", "organization"\]\)/, "seller product page must require seller or organization membership");
assert.match(sellerProductsPage, /in\("role", \["seller", "organization"\]\)/, "seller product management page must require seller or organization membership");
assert.match(sellerProductsPage, /eq\("farmer_id", user\.id\)/, "seller product management must show only the signed-in seller's products");
assert.match(dashboard, /href: "\/seller\/products"/, "seller dashboard must link to seller product management");
assert.match(farmerPage, /redirect\("\/sell-harvest"\)/, "farmer product route must direct farmers to Sell Harvest");
assert.match(migration, /DROP POLICY IF EXISTS "products_farmer_insert"/, "migration must remove the broad farmer insert policy");
assert.match(migration, /membership\.role IN \('seller', 'organization'\)/, "database insert and storage policies must enforce seller or approved organization membership");
assert.match(migration, /DROP POLICY IF EXISTS "Farmers can upload own product images"/, "migration must replace farmer-only product image uploads");
assert.match(migration, /storage\.foldername\(name\)/, "Storage policy must restrict uploads to the user's folder");

assert.ok(migration.includes("m.role IN ('farmer', 'seller', 'organization')"), "database moderation guard must recognize approved organization sellers");
console.log("Seller marketplace separation regression checks passed.");
