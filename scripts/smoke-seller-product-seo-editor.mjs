#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(path, "utf8");
const editor = read("components/seller/ProductSeoEditor.tsx");
const marketplaceForm = read("components/seller/SellerProductForm.tsx");
const plantForm = read("components/seller/PlantSellerProductForm.tsx");
const marketplaceApi = read("app/api/seller/products/route.ts");
const plantApi = read("app/api/plant-seller/products/route.ts");
const marketplacePage = read("app/marketplace/[productId]/page.tsx");
const plantPage = read("app/plant-market/[slug]/page.tsx");
const migration = read("supabase/migrations/20261106120000_add_seller_product_seo_fields.sql");
for (const field of ["seo_title","seo_description","focus_keyword","related_keywords","brand","origin","highlights","usage_instructions","image_alt"]) {
  assert.ok(editor.includes(field), `SEO editor must expose ${field}`);
  assert.ok(marketplaceForm.includes(field), `Marketplace form must submit ${field}`);
  assert.ok(plantForm.includes(field), `Plant Market form must submit ${field}`);
  assert.ok(marketplaceApi.includes(field), `Marketplace API must validate/store ${field}`);
  assert.ok(plantApi.includes(field), `Plant Market API must validate/store ${field}`);
  if (field !== "seo_title" && field !== "seo_description" && field !== "brand" && field !== "related_keywords") assert.ok(migration.includes(field), `Migration must add ${field}`);
}
assert.match(editor,/Google preview|GOOGLE SEARCH PREVIEW/i,"Editor must show a search snippet preview");
assert.match(editor,/SEO completeness/,"Editor must show SEO completeness guidance");
assert.match(marketplaceApi,/seo_keywords: relatedKeywords/,"Marketplace API must map seller keywords to the existing seo_keywords column");
assert.match(plantApi,/seo_keywords:relatedKeywords/,"Plant Market API must persist SEO keywords in its dedicated schema");
assert.match(migration,/ADD COLUMN IF NOT EXISTS seo_keywords text\[\]/,"Plant Market must receive the independent SEO keywords column");
assert.match(marketplaceApi,/status: "draft"/,"Marketplace submissions must remain in moderation");
assert.match(plantApi,/status:"draft"/,"Plant Market submissions must remain in moderation");
assert.match(marketplacePage,/cleanText\(product\.seo_title/,"Marketplace metadata must prefer seller SEO title");
assert.match(marketplacePage,/product\.seo_description/,"Marketplace metadata must prefer seller meta description");
assert.match(marketplacePage,/"@type": "Product"/,"Marketplace structured product data must remain");
assert.match(plantPage,/data\.seo_title/,"Plant Market metadata must prefer seller SEO title");
assert.match(plantPage,/data\.seo_description/,"Plant Market metadata must prefer seller meta description");
assert.match(plantPage,/additionalProperty/,"Plant Market Product JSON-LD must include seller highlights");
assert.match(marketplacePage,/Product highlight/,"Marketplace Product JSON-LD must include seller highlights");
assert.match(migration,/ADD COLUMN IF NOT EXISTS seo_title/,"Migration must be additive and safe to re-run");
// Plant Seller guided entry must preserve the existing secured review workflow.
assert.match(plantForm, /function suggestSeo\(/, "Plant Seller must have a free on-device SEO draft helper");
assert.match(plantForm, /seo_title: form\.seo_title\.trim\(\) \|\| auto\.seo_title/, "empty SEO title gets a seller-text-only fallback");
assert.match(plantForm, /seo_description: form\.seo_description\.trim\(\) \|\| auto\.seo_description/, "empty meta description gets a seller-text-only fallback");
assert.match(plantForm, /focus_keyword: form\.focus_keyword\.trim\(\) \|\| auto\.focus_keyword/, "focus keyword must have a plain-text fallback");
assert.match(plantForm, /"plant-product-images"/, "Plant Seller must retain the isolated Storage bucket");
assert.match(plantForm, /URL\.revokeObjectURL\(preview\)/, "uploaded photo object URLs must be released");
assert.match(plantForm, /uploadedPath[\s\S]*\.remove\(\[uploadedPath\]\)/, "failed API submission must clean up an uploaded photo");
assert.match(plantForm, /"\/api\/plant-seller\/products"/, "Product Seller writes must still use the authenticated API");
assert.match(plantForm, /ProductSeoEditor/, "Plant SEO input and preview must remain editable");
assert.match(plantForm, /<ProductSeoEditor guided/, "Plant Seller SEO editor should prioritize essential fields");
assert.match(editor, /guided \? allChecks\.slice\(0,3\) : allChecks/, "optional editor remains fully functional for existing Marketplace sellers");
assert.match(editor, /আরও বিস্তারিত SEO ও পণ্যের তথ্য/, "Plant Seller optional SEO data should be collapsible");
assert.match(plantForm, /inputMode="decimal"/, "Mobile sellers need an appropriate price keypad");
assert.match(plantForm, /"পর্যালোচনার জন্য পণ্য জমা দিন"/, "seller CTA must explain approval workflow");
assert.match(plantApi, /status:"draft"/, "submitted Plant Market products may not become public before review");

// Plant Market rich text must use shared editor, sanitize at the API boundary,
// preserve legacy plaintext and never leak HTML into metadata or schema.org.
const richEditor = read("components/admin/AdminProductDescriptionEditor.tsx");
const descriptionHelpers = read("lib/marketplace/product-description.ts");
assert.match(plantForm, /AdminProductDescriptionEditor/, "Plant Seller must reuse the existing rich editor");
assert.match(plantForm, /variant="plant"/, "Plant Seller must get a simplified contextual editor");
assert.match(plantForm, /maxHtmlLength=\{5000\}/, "Plant Seller must enforce the existing HTML column limit");
assert.match(plantForm, /productDescriptionToText\(values\.description\)/, "SEO drafts must use plain text, not HTML tags");
assert.match(plantForm, /description=\{descriptionText\}/, "search preview must receive plain text");
assert.match(richEditor, /variant = "standard"/, "Admin rich text editor must retain its original default experience");
assert.match(richEditor, /গাছ বা পণ্যের বৈশিষ্ট্য/, "Plant Seller needs an accurate plant-oriented outline");
assert.match(richEditor, /window\.confirm/, "inserting outline must not silently overwrite existing content");
assert.match(plantApi, /sanitizeProductDescription\(rawDescription\)/, "untrusted seller HTML must be sanitized server-side");
assert.match(plantApi, /rawDescription\.length>5000/, "Plant Market API must reject overlong HTML before writing");
assert.match(plantPage, /sanitizeProductDescription\(product\.description \|\| ""\)/, "public product detail must sanitize stored descriptions again");
assert.match(plantPage, /dangerouslySetInnerHTML=\{\{__html:safeDescription\}\}/, "public product detail must render sanitized rich text");
assert.match(plantPage, /productDescriptionToText\(safeDescription\)/, "Product schema description must be plain text");
assert.match(plantPage, /productDescriptionToText\(sanitizeProductDescription\(data\.description\|\|""\)\)/, "SEO metadata must be plain text");
assert.match(descriptionHelpers, /ALLOWED_TAGS/, "Shared description sanitizer must allowlist formatting");

console.log("Seller product SEO editor regression checks passed.");
