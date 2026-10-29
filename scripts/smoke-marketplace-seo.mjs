#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const product = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const marketplace = readFileSync("app/marketplace/page.tsx", "utf8");
const category = readFileSync("app/marketplace/category/[categorySlug]/page.tsx", "utf8");
const subcategory = readFileSync("app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const indexability = readFileSync("lib/marketplace/indexability.ts", "utf8");

assert.match(product, /export async function generateMetadata/, "Product page needs unique metadata");
assert.match(product, /alternates:\s*\{\s*canonical:\s*`\/marketplace\/\$\{product\.slug\}`\s*\}/, "Product page needs a slug-based canonical");
assert.match(product, /redirect\(`\/marketplace\/\$\{product\.slug\}`\)/, "Product ID aliases must redirect to the canonical slug URL");
assert.match(product, /"@type": "Product"/, "Product detail needs Product structured data");
assert.match(product, /priceCurrency: "BDT"/, "Offer schema must use BDT");
assert.match(product, /product\.image_url/, "Product image should be exposed in the page and metadata");
assert.match(product, /\.eq\("status", "active"\)/, "Product detail must only return active products");
assert.doesNotMatch(product, /moderation_status/, "Products use status='active' as the public publishing gate");

for (const [label, source] of [["marketplace", marketplace], ["category", category], ["subcategory", subcategory]]) {
  assert.match(source, /\.eq\("status", "active"\)/, `${label} must only list active products`);
  assert.doesNotMatch(source, /moderation_status/, `${label} must use the deployed products schema`);
}
assert.match(sitemap, /\.eq\("status", "active"\)/, "Product sitemap must exclude non-active products");
assert.doesNotMatch(sitemap, /moderation_status/, "Sitemap must use the deployed products schema");
assert.match(indexability, /\.eq\("status", "active"\)/, "Category indexability must use public active inventory");
assert.doesNotMatch(indexability, /moderation_status/, "Category indexability must use the deployed products schema");

console.log("Marketplace SEO and indexability regression checks passed.");
