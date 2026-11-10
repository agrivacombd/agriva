#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const product = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const marketplace = readFileSync("app/marketplace/page.tsx", "utf8");
const category = readFileSync("app/marketplace/category/[categorySlug]/page.tsx", "utf8");
const subcategory = readFileSync("app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const indexability = readFileSync("lib/marketplace/indexability.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");
const searchLayout = readFileSync("app/search/layout.tsx", "utf8");

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
assert.match(sitemap, /from\("products"\)\.select\("slug,updated_at,category,category_slug,subcategory_slug"\)\.eq\("status", "active"\)/, "Product sitemap must use the deployed products schema and exclude non-active products");
assert.match(sitemap, /from\("green_exchange_listings"\)\.select\("slug,updated_at"\)\.eq\("status", "active"\)\.eq\("moderation_status", "approved"\)/, "Green Exchange sitemap must only expose approved active listings");
assert.match(indexability, /\.eq\("status", "active"\)/, "Category indexability must use public active inventory");
assert.doesNotMatch(indexability, /moderation_status/, "Category indexability must use the deployed products schema");

assert.doesNotMatch(sitemap, /lastModified:\s*now/, "Static sitemap entries must not pretend to have changed on every request");
assert.match(sitemap, /\.\.\.\(product\.updated_at \? \{ lastModified: new Date\(product\.updated_at\) \} : \{\}\)/, "Product sitemap lastModified must reflect the real updated_at value only");
assert.match(sitemap, /\.\.\.\(job\.updated_at \? \{ lastModified: new Date\(job\.updated_at\) \} : \{\}\)/, "Job sitemap lastModified must reflect the real updated_at value only");

assert.match(searchLayout, /index:\s*false/, "Internal search results must be noindex");
assert.match(searchLayout, /follow:\s*true/, "Internal search links should remain crawlable");
assert.doesNotMatch(robots, /"\/search"/, "Robots must allow crawlers to read the search page noindex directive");

console.log("Marketplace SEO and indexability regression checks passed.");
