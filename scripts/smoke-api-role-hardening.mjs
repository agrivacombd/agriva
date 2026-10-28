#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const reseller = readFileSync("app/api/reseller/links/route.ts", "utf8");
assert.match(reseller, /profile\?\.role !== "reseller"/, "reseller role must be checked before link creation");
assert.match(reseller, /UUID_PATTERN\.test\(productId\)/, "product ID must be validated as UUID");
assert.doesNotMatch(reseller, /error: error\.message/, "database details must not be exposed by reseller link API");

const farmer = readFileSync("app/api/farmer/products/route.ts", "utf8");
const sellerDashboard = readFileSync("app/seller/page.tsx", "utf8");
const sellerForm = readFileSync("components/farmer/ProductForm.tsx", "utf8");
const productModeration = readFileSync("supabase/migrations/20261029140000_seller_product_moderation.sql", "utf8");
const serverAuthorization = readFileSync("lib/auth/server-authorization.ts", "utf8");
assert.match(farmer, /Farmer product creation failed/, "product insert failures must be logged server-side");
assert.match(farmer, /পণ্য সংরক্ষণ করা যায়নি/, "product insert failures must return safe localized message");
assert.doesNotMatch(farmer, /error: error\.message/, "database details must not be exposed by farmer product API");

assert.match(farmer, /authorizePermission\("catalog\.create_own"\)/, "seller listing API must use the shared capability guard");
assert.match(farmer, /role === "farmer" \|\| role === "seller"/, "both seller and farmer memberships may submit listings");
assert.match(farmer, /reseller_commission_percent: 0/, "seller API must not accept commission policy from the client");
assert.doesNotMatch(sellerForm, /commission/, "seller form must not expose commission policy controls");
assert.match(sellerDashboard, /\.eq\("farmer_id", auth\.user\.id\)/, "seller dashboard must query only the authenticated seller's listings");
assert.match(serverAuthorization, /Unable to verify permissions/, "permission lookup failures must fail closed");
assert.match(productModeration, /NEW\.status := 'draft'::public\.product_status/, "database must force new seller listings to draft");
assert.match(productModeration, /Listing status changes require moderation/, "seller must not bypass moderation via direct database updates");
assert.match(productModeration, /Commission changes require platform administration/, "seller must not change commission through direct database updates");
assert.match(productModeration, /role IN \('farmer', 'seller'\)/, "database policy must limit listing writes to seller/farmer roles");


console.log("API role and error disclosure regression checks passed.");
