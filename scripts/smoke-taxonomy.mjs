import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/20261024001000_stable_marketplace_taxonomy.sql");
const taxonomy = read("../lib/marketplace/taxonomy.ts");
const selector = read("../components/admin/TaxonomyFields.tsx");
const adminProducts = read("../app/admin/products/page.tsx");
const categoryPage = read("../app/marketplace/category/[categorySlug]/page.tsx");
const subcategoryPage = read("../app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx");
const indexability = read("../lib/marketplace/indexability.ts");
const sitemap = read("../app/sitemap.ts");
const productPage = read("../app/marketplace/[productId]/page.tsx");

assert.ok(migration.includes("create table if not exists public.product_subcategories"), "subcategory table must exist");
assert.ok(migration.includes("products_category_subcategory_slug_fkey"), "database must enforce category/subcategory parent relationship");
assert.ok(migration.includes("create index if not exists products_category_slug_status_idx"), "category lookup should be indexed");
assert.ok(migration.includes("alter table public.product_subcategories enable row level security"), "subcategory table must have RLS enabled");
assert.ok(migration.includes("revoke all on function public.admin_set_product_taxonomy(uuid, text, text) from public, anon"), "taxonomy RPC must not be public/anonymous");
assert.ok(migration.includes("public.is_admin()"), "taxonomy writes must be admin-only");
assert.ok(migration.includes("Keep any unmapped legacy free-text category"), "unknown legacy categories must be preserved");
assert.ok(selector.includes('name="category_slug"') && selector.includes('name="subcategory_slug"'), "admin form must submit stable taxonomy slugs");
assert.ok(selector.includes("selectedCategory?.subcategories"), "subcategory choices must depend on selected category");
assert.ok(adminProducts.includes("admin_set_product_taxonomy") && adminProducts.includes("category_slug,subcategory_slug"), "admin form must persist and load stable taxonomy");
assert.ok(taxonomy.includes("getProductTaxonomy") && taxonomy.includes("function matchesSubcategory"), "taxonomy resolver must support stable slugs and legacy fallback");
assert.ok(categoryPage.includes("hasIndexableCategoryProducts") && categoryPage.includes("category_slug"), "category pages must use stable slugs and avoid indexing empty pages");
assert.ok(subcategoryPage.includes("hasIndexableSubcategoryProducts") && subcategoryPage.includes("subcategory_slug"), "subcategory pages must use stable slugs and avoid indexing empty pages");
assert.ok(indexability.includes('.eq("moderation_status", "approved")'), "indexability must include only approved products");
assert.ok(sitemap.includes("categoryUrls") && sitemap.includes("matchesSubcategory"), "sitemap must include only populated taxonomy URLs");
assert.ok(productPage.includes("getProductTaxonomy") && productPage.includes("subcategory.slug"), "product breadcrumb must link to category and subcategory");
assert.ok(!adminProducts.includes('name="category"'), "admin form must no longer write free-text category");

console.log("Category taxonomy and SEO smoke checks passed.");
