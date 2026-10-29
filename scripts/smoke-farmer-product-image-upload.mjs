#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const form = readFileSync("components/farmer/ProductForm.tsx", "utf8");
const route = readFileSync("app/api/farmer/products/route.ts", "utf8");
const migration = readFileSync("supabase/migrations/20261029100000_farmer_product_image_upload.sql", "utf8");

assert.match(form, /createSupabaseBrowserClient/, "farmer form must use the cookie-aware Supabase browser client");
assert.match(form, /storage\.from\("product-images"\)\.upload/, "farmer form must upload product images to Storage");
assert.match(form, /image_url/, "farmer form must submit the public image URL with product details");
assert.match(form, /MAX_IMAGE_SIZE/, "farmer form must enforce an image size limit before upload");
assert.match(route, /profile\?\.role !== "farmer"/, "product API must enforce farmer role");
assert.match(route, /product-images/, "product API must validate product image URLs against the configured bucket");
assert.match(route, /storage\/v1\/object\/public\/product-images\//, "only public product-images URLs should be accepted");
assert.match(migration, /Farmers can upload own product images/, "migration must add the farmer upload policy");
assert.match(migration, /p\.role = 'farmer'/, "Storage policy must enforce farmer role");
assert.match(migration, /storage\.foldername\(name\)/, "Storage policy must restrict uploads to the user's folder");

console.log("Farmer product image upload regression checks passed.");
