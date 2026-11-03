#!/usr/bin/env node
/**
 * Regression coverage for public marketplace product landing-page SEO.
 * The product page already lives on main; this test guards its public contract.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const adminProducts = readFileSync("app/admin/products/page.tsx", "utf8");

assert.match(page, /\.eq\("slug", normalized\)\.eq\("status", "active"\)/,
  "Slug lookup must only return active products");
assert.match(page, /\.eq\("id", normalized\)\.eq\("status", "active"\)/,
  "UUID lookup must only return active products");
assert.match(page, /subcategory_slug,price,stock,unit,description,image_url,image_urls,seo_title,seo_description,seo_keywords,seo_image_alt_texts/,
  "Product lookup must select saved SEO fields and the product image gallery");
assert.match(page, /alternates:\s*\{\s*canonical:\s*`\/marketplace\/\$\{product\.slug\}`\s*\}/,
  "Product metadata must publish a canonical slug URL");
assert.match(page, /seo_title\s*\|\|/,
  "Product metadata must prefer the saved SEO title");
assert.match(page, /seo_description\?\.trim\(\)/,
  "Product metadata must prefer the saved SEO description");
assert.match(page, /openGraph:\s*\{[\s\S]*?images:\s*images\.map\(/,
  "Open Graph metadata must include the saved product gallery and alt text");
assert.match(page, /twitter:\s*\{[\s\S]*?card:\s*images\.length\s*\?\s*"summary_large_image"/,
  "Twitter metadata must use an image card when a product image exists");
assert.match(page, /"@type":\s*"Product"/,
  "Product JSON-LD must be present");
assert.match(page, /url:\s*productUrl/,
  "Product JSON-LD must include the canonical product URL");
assert.match(page, /\.\.\.\(productImages\.length\s*\?\s*\{\s*image:\s*productImages/,
  "Product JSON-LD must include the uploaded image gallery when present");
assert.match(page, /priceCurrency:\s*"BDT"/,
  "Product offer structured data must use BDT");
assert.match(page, /"@type":\s*"BreadcrumbList"/,
  "BreadcrumbList structured data must be present");
assert.match(page, /JSON\.stringify\(jsonLd\)\.replace\(\/</,
  "JSON-LD serialization must escape less-than characters");
assert.match(adminProducts, /supabase\.rpc\("admin_update_product_seo"/,
  "Admin product editor must save SEO fields through the existing admin-guarded RPC");
assert.match(adminProducts, /name="seoTitle"/,
  "Admin product editor must expose the saved SEO title");
assert.match(adminProducts, /name="seoDescription"/,
  "Admin product editor must expose the saved SEO description");
assert.match(adminProducts, /name="seoKeywords"/,
  "Admin product editor must expose SEO keywords");
assert.match(adminProducts, /name="seoFaqs"/,
  "Admin product editor must preserve and edit structured SEO FAQs");
assert.match(adminProducts, /seoTitle\.length > 70[\s\S]*seoDescription\.length > 160/,
  "Admin product editor must validate SEO title and description limits");
assert.match(sitemap, /from\("products"\)[\s\S]*?\.eq\("status", "active"\)/,
  "Sitemap must include active products only");
assert.doesNotMatch(sitemap.match(/from\("products"\)[\s\S]*?\.limit\(5000\)/)?.[0] ?? "",
  /moderation_status/,
  "Sitemap must not query a moderation_status column absent from products");
console.log("Marketplace product landing SEO regression checks passed.");
