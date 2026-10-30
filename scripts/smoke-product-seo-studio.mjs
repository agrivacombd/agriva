import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const studio = read("../app/admin/product-studio/page.tsx");
const api = read("../app/api/admin/product-seo/route.ts");
const productPage = read("../app/marketplace/[productId]/page.tsx");
const migration = read("../supabase/migrations/20261030160000_product_seo_studio.sql");
const sitemap = read("../app/sitemap.ts");
const adminProducts = read("../app/admin/products/page.tsx");

assert.match(studio, /SEO readiness/);
assert.match(studio, /Google search preview/);
assert.match(studio, /Draft সংরক্ষণ করুন/);
assert.match(api, /requireAdminApi\("catalog\.create"\)/);
assert.match(api, /admin_create_product_with_seo/);
assert.match(api, /https:/);
assert.match(migration, /public\.is_admin\(\)/);
assert.match(migration, /'draft'/);
assert.match(migration, /seo_review_status/);
assert.match(productPage, /seo_title/);
assert.match(productPage, /meta_description/);
assert.match(productPage, /seo_faqs/);
assert.match(productPage, /"@type": "Product"/);
assert.match(sitemap, /eq\("status", "active"\)/);
assert.match(adminProducts, /\/admin\/product-studio/);

console.log("Product SEO Studio source-contract smoke checks passed.");
