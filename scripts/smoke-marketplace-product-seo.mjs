#!/usr/bin/env node
/**
 * Regression coverage for public marketplace product landing-page SEO.
 * The product page already lives on main; this test guards its public contract.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");

assert.match(page, /\.eq\("slug", normalized\)\.eq\("status", "active"\)/,
  "Slug lookup must only return active products");
assert.match(page, /\.eq\("id", normalized\)\.eq\("status", "active"\)/,
  "UUID lookup must only return active products");
assert.match(page, /subcategory_slug,price,stock,unit,description,image_url/,
  "Product lookup must select uploaded image URLs");
assert.match(page, /alternates:\s*\{\s*canonical:\s*`\/marketplace\/\$\{product\.slug\}`\s*\}/,
  "Product metadata must publish a canonical slug URL");
assert.match(page, /openGraph:\s*\{[\s\S]*?images:\s*\[\{\s*url:\s*image/,
  "Open Graph metadata must include the uploaded product image when present");
assert.match(page, /twitter:\s*\{[\s\S]*?card:\s*image\s*\?\s*"summary_large_image"/,
  "Twitter metadata must use an image card when a product image exists");
assert.match(page, /"@type":\s*"Product"/,
  "Product JSON-LD must be present");
assert.match(page, /url:\s*productUrl/,
  "Product JSON-LD must include the canonical product URL");
assert.match(page, /\.\.\.\(image\s*\?\s*\{\s*image:\s*\[image\]/,
  "Product JSON-LD must include the uploaded image when present");
assert.match(page, /priceCurrency:\s*"BDT"/,
  "Product offer structured data must use BDT");
assert.match(page, /"@type":\s*"BreadcrumbList"/,
  "BreadcrumbList structured data must be present");
assert.match(page, /JSON\.stringify\(jsonLd\)\.replace\(\/</,
  "JSON-LD serialization must escape less-than characters");
assert.match(sitemap, /from\("products"\)[\s\S]*?\.eq\("status", "active"\)/,
  "Sitemap must include active products only");
assert.doesNotMatch(sitemap.match(/from\("products"\)[\s\S]*?\.limit\(5000\)/)?.[0] ?? "",
  /moderation_status/,
  "Sitemap must not query a moderation_status column absent from products");
console.log("Marketplace product landing SEO regression checks passed.");
