#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const product = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const adminProducts = readFileSync("app/admin/products/page.tsx", "utf8");
const seoMigration = readFileSync("supabase/migrations/20261030103000_admin_product_seo_landing_fields.sql", "utf8");
const sellerDetailsMigration = readFileSync("supabase/migrations/20261030120000_seller_product_details_and_profile_fields.sql", "utf8");
const aiAssistant = readFileSync("components/admin/AdminProductSeoAssistant.tsx", "utf8");
const aiRoute = readFileSync("app/api/admin/products/generate-seo/route.ts", "utf8");
const marketplace = readFileSync("app/marketplace/page.tsx", "utf8");
const category = readFileSync("app/marketplace/category/[categorySlug]/page.tsx", "utf8");
const subcategory = readFileSync("app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const indexability = readFileSync("lib/marketplace/indexability.ts", "utf8");

assert.match(product, /export async function generateMetadata/, "Product page needs unique metadata");
assert.match(product, /product\.seo_title/, "Product metadata must prefer the admin-managed SEO title");
assert.match(product, /product\.seo_description/, "Product metadata must prefer the admin-managed meta description");
assert.match(product, /product\.seo_keywords/, "Product metadata must expose configured target keywords");
assert.match(product, /"@type": "FAQPage"/, "Configured product FAQs should be represented in structured data");
assert.match(product, /পণ্য সম্পর্কে বিস্তারিত/, "SEO landing-page copy must render on the public product page");
assert.match(product, /সাধারণ জিজ্ঞাসা/, "Configured product FAQs must render visibly on the public page");
assert.match(aiAssistant, /name="seo_title"/, "Admin products page must allow editing SEO titles");
assert.match(aiAssistant, /name="seo_description"/, "Admin products page must allow editing meta descriptions");
assert.match(aiAssistant, /name="seo_keywords"/, "Admin products page must allow editing target keywords");
assert.match(aiAssistant, /name="seo_content"/, "Admin products page must allow editing landing-page content");
assert.match(adminProducts, /AdminProductSeoAssistant/, "Admin product editor must include AI SEO assistant");
assert.match(aiAssistant, /Generate SEO draft/, "Admin must be able to generate an SEO draft");
assert.match(aiAssistant, /Improve existing content/, "Admin must be able to improve existing SEO content");
assert.match(aiRoute, /requireAdminApi\("catalog.edit"\)/, "AI SEO generation must be admin-only");
assert.match(aiRoute, /OPENAI_API_KEY/, "AI SEO generation must use a server-side API key");
assert.match(aiRoute, /Do not invent licences/, "AI must not invent licences or unverified product claims");
assert.match(aiAssistant, /name="seo_faqs"/, "Admin products page must allow editing product FAQs");
assert.match(seoMigration, /ADD COLUMN IF NOT EXISTS seo_title/, "SEO fields need an additive database migration");
assert.match(seoMigration, /ADD COLUMN IF NOT EXISTS seo_faqs jsonb/, "FAQ data needs a database column");
assert.match(seoMigration, /FUNCTION public\.admin_update_product_seo/, "SEO updates must use an admin-only database function");
assert.match(seoMigration, /product\.seo_updated/, "SEO updates must be recorded in the admin audit log");
assert.match(adminProducts, /admin_update_product_seo/, "Admin UI must save SEO settings through the audited RPC");
assert.match(product, /const canonicalPath = `\/marketplace\/\$\{product\.slug\}`/, "Product page must derive its canonical from the stable product slug");
assert.match(product, /alternates:\s*\{\s*canonical:\s*canonicalPath\s*\}/, "Product page needs a slug-based canonical");
assert.match(product, /redirect\(`\/marketplace\/\$\{product\.slug\}`\)/, "Product ID aliases must redirect to the canonical slug URL");
assert.match(product, /"@type": "Product"/, "Product detail needs Product structured data");
assert.match(product, /priceCurrency: "BDT"/, "Offer schema must use BDT");
assert.match(product, /product\.image_url/, "Product image should be exposed in the page and metadata");
assert.match(product, /product_attributes/, "Public product landing page must render seller-provided structured facts");
assert.match(sellerDetailsMigration, /ADD COLUMN IF NOT EXISTS product_attributes jsonb/, "Structured product facts need an additive migration");
assert.match(sellerDetailsMigration, /ADD COLUMN IF NOT EXISTS trade_license_number/, "Optional private seller licence fields need a migration");
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
