#!/usr/bin/env node
/**
 * Regression coverage for public marketplace product landing-page SEO.
 * The product page already lives on main; this test guards its public contract.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const share = readFileSync("components/marketplace/ProductShareCard.tsx", "utf8");

assert.match(page, /\.eq\("slug", normalized\)\.eq\("status", "active"\)/,
  "Slug lookup must only return active products");
assert.match(page, /\.eq\("id", normalized\)\.eq\("status", "active"\)/,
  "UUID lookup must only return active products");
assert.match(page, /subcategory_slug,price,stock,unit,(?:shipping_class,shipping_weight_grams,)?description,image_url/,
  "Product lookup must select uploaded image URLs");
assert.ok(page.includes('title: { absolute: title }'), "Product title must bypass the root layout suffix to avoid duplicate AGRIVA branding");
assert.ok(page.includes('const title = titleBase + " | AGRIVA"') && page.includes('unbrandedTitle.slice(0, 61).replace(/\\s+\\S*$/, "")'), "SEO title must preserve the AGRIVA suffix and avoid cutting individual words");
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
assert.match(page, /\.\.\.\(galleryImages\.length\s*\?\s*\{\s*image:\s*galleryImages/,
  "Product JSON-LD must include the uploaded product gallery when present");
assert.match(page, /priceCurrency:\s*"BDT"/,
  "Product offer structured data must use BDT");
assert.match(page, /const image = product\.image_url \|\| \(Array\.isArray\(product\.image_urls\)/,
  "Social preview image should fall back to the product gallery if the main thumbnail is missing");
assert.ok(page.includes('href="#product-description"') && page.includes('<ProductDescription html={description} />'),
  "The short summary links to full visible and indexable product content");
assert.ok(page.includes('<ProductShareCard productName={product.name} productUrl={productUrl}'),
  "Share card must use the same canonical product URL as Product JSON-LD");
assert.ok(share.includes('navigator.share({ title: productName, url: productUrl })'),
  "Native sharing must occur only on explicit user interaction");
assert.ok(share.includes("navigator.clipboard.writeText(productUrl)"),
  "Copy action must use canonical product URL only");
assert.doesNotMatch(share, /setInterval\s*\(|setTimeout\s*\(|window\.open\s*\(|utm_source|fbclid|referralId/,
  "No automated posting or campaign/tracking parameters in the share card");
assert.doesNotMatch(page, /aggregateRating|reviewRating|ratingValue/,
  "Do not fabricate reviews or SEO ratings");

assert.match(page, /\\.eq\\("slug", normalized\\)[^\\n]*\\.is\\("deleted_at", null\\)/,
  "Public product detail slug lookup must exclude soft-deleted records");
assert.match(page, /\\.eq\\("id", normalized\\)[^\\n]*\\.is\\("deleted_at", null\\)/,
  "Public product detail UUID lookup must exclude soft-deleted records");
assert.match(page, /\\.eq\\("marketplace_channel", "marketplace"\\)\\s*\\.is\\("deleted_at", null\\)/,
  "Related product cards must exclude soft-deleted records");
assert.match(sitemap, /\\.from\\("products"\\)[\\s\\S]*?\\.is\\("deleted_at", null\\)/,
  "XML sitemap must exclude soft-deleted marketplace listings");
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
