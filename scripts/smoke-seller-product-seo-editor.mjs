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
console.log("Seller product SEO editor regression checks passed.");
