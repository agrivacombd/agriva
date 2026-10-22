import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/030_seed_seo_and_reporting.sql");
const seoMigration = read("../supabase/migrations/029_product_seo_schema.sql");
const productForm = read("../app/admin/products/page.tsx");
const productPage = read("../app/marketplace/[productId]/page.tsx");
const audit = read("../app/admin/seo/page.tsx");
const feed = read("../app/api/merchant-center/route.ts");
const sitemap = read("../app/sitemap.ts");
const guides = read("../app/guides/[slug]/page.tsx");
const analytics = read("../app/api/analytics-report/route.ts");

for (const field of ["crop_name", "seed_variety", "pack_size", "germination_rate", "sowing_season", "suitable_regions", "seed_expiry_date"]) {
  assert.ok(migration.includes(field), `migration should define ${field}`);
  assert.ok(productForm.includes(field), `admin form should expose ${field}`);
}
assert.ok(migration.includes("public.is_admin()"), "seed write RPC must enforce admin access");
assert.ok(migration.includes("admin_audit_log"), "seed changes must be audited");
assert.ok(audit.includes("Math.round(done / all.length * 100)"), "SEO completeness score should be calculated");
assert.ok(feed.includes('.eq("status", "active")') && feed.includes('.eq("moderation_status", "approved")'), "feed must only include approved active products");
assert.ok(feed.includes(".gt(\"stock\", 0)") && feed.includes("image_url"), "feed must filter unavailable/unimaged products");
assert.ok(productPage.includes("BreadcrumbList") && productPage.includes("additionalProperty"), "product page should emit breadcrumb and seed structured data");
assert.ok(sitemap.includes("/guides/") && guides.includes("seed-selection"), "Bengali guides should be represented in crawl paths");
assert.ok(!sitemap.includes("\\n"), "sitemap must not contain escaped newline tokens that break TypeScript parsing");
assert.ok(sitemap.includes("MARKETPLACE_CATEGORIES.map") && sitemap.includes("MARKETPLACE_CATEGORIES.flatMap"), "category landing pages should be discoverable in sitemap");
assert.ok(analytics.includes("analytics.readonly") && analytics.includes("webmasters.readonly"), "reporting should use read-only Google API scopes");
assert.ok(!analytics.includes("NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT"), "Google service-account secrets must remain server-side");
assert.ok(analytics.includes('if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })'), "analytics endpoint must require a signed-in user");
assert.ok(analytics.includes('profile?.role !== "admin"'), "analytics endpoint must enforce admin role");
assert.ok(feed.includes("function xml(") && feed.includes('replace(/&/g, "&amp;")'), "feed must XML-escape product data");
assert.ok(feed.includes("p.image_url && /^https:") && feed.includes("Cache-Control"), "feed must validate HTTPS image URLs and set explicit cache policy");
for (const sql of [seoMigration, migration]) assert.ok(sql.includes("do $constraints$"), "product schema constraints should be added idempotently");
console.log("SEO roadmap smoke checks passed.");
