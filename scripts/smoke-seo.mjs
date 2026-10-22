import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/030_seed_seo_and_reporting.sql");
const seoMigration = read("../supabase/migrations/029_product_seo_schema.sql");
const adminBootstrap = read("../supabase/migrations/028_admin_bootstrap_product_creation.sql");
const productForm = read("../app/admin/products/page.tsx");
const productPage = read("../app/marketplace/[productId]/page.tsx");
const audit = read("../app/admin/seo/page.tsx");
const feed = read("../app/api/merchant-center/route.ts");
const sitemap = read("../app/sitemap.ts");
const robots = read("../app/robots.ts");
const guides = read("../app/guides/[slug]/page.tsx");
const analytics = read("../app/api/analytics-report/route.ts");
const paymentIpn = read("../app/api/payment/sslcommerz/ipn/route.ts");
const categoryPage = read("../app/marketplace/category/[categorySlug]/page.tsx");
const subcategoryPage = read("../app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx");

for (const field of ["crop_name", "seed_variety", "pack_size", "germination_rate", "sowing_season", "suitable_regions", "seed_expiry_date"]) {
  assert.ok(migration.includes(field), `migration should define ${field}`);
  assert.ok(productForm.includes(field), `admin form should expose ${field}`);
}
assert.ok(migration.includes("public.is_admin()") && migration.includes("admin_audit_log"), "seed write RPC must be admin-only and audited");
assert.ok(adminBootstrap.includes("AGRIVA_OWNER_EMAIL") && adminBootstrap.includes("is_admin()"), "first-admin bootstrap must be owner-restricted");
assert.ok(audit.includes("Math.round(done / all.length * 100)"), "SEO completeness score should be calculated");

assert.ok(feed.includes('.eq("status", "active")') && feed.includes('.eq("moderation_status", "approved")'), "feed must only include approved active products");
assert.ok(feed.includes('.gt("stock", 0)') && feed.includes("image_url"), "feed must filter unavailable/unimaged products");
assert.ok(feed.includes("function xml(") && feed.includes('replace(/&/g, "&amp;")'), "feed must XML-escape product data");
assert.ok(feed.includes("p.image_url && /^https:") && feed.includes("Cache-Control"), "feed must validate HTTPS image URLs and set cache policy");

assert.ok(productPage.includes("BreadcrumbList") && productPage.includes("additionalProperty"), "product page must emit breadcrumb and seed structured data");
assert.ok(sitemap.includes("/guides/") && guides.includes("seed-selection"), "Bengali guides must be crawlable");
assert.ok(!sitemap.includes("\\n"), "sitemap must not contain escaped newline tokens that break TypeScript parsing");
assert.ok(sitemap.includes("MARKETPLACE_CATEGORIES.map") && sitemap.includes("MARKETPLACE_CATEGORIES.flatMap"), "category landing pages must be discoverable in sitemap");
assert.ok(categoryPage.includes("matchesProductCategory") && categoryPage.includes("CollectionPage"), "category pages must filter products and expose collection metadata");
assert.ok(subcategoryPage.includes("matchesSubcategory") && subcategoryPage.includes("CollectionPage"), "subcategory pages must filter products and expose collection metadata");
assert.ok(robots.includes('"/admin"') && robots.includes('"/api"') && robots.includes("/sitemap.xml"), "robots must exclude private routes and declare sitemap");

assert.ok(analytics.includes("analytics.readonly") && analytics.includes("webmasters.readonly"), "reporting must use read-only Google API scopes");
assert.ok(!analytics.includes("NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT"), "Google service-account secrets must remain server-side");
assert.ok(analytics.includes('if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })'), "analytics endpoint must require a signed-in user");
assert.ok(analytics.includes('profile?.role !== "admin"'), "analytics endpoint must enforce admin role");

assert.ok(paymentIpn.includes('gatewayCurrency !== "BDT"') && paymentIpn.includes("expectedAmount - receivedAmount"), "payment IPN must verify currency and exact order amount");
assert.ok(paymentIpn.includes("SUPABASE_SERVICE_ROLE_KEY") && !paymentIpn.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"), "payment IPN must use server-only service credentials");
assert.ok(paymentIpn.includes('payment_status: "paid"') && !paymentIpn.split("\\n").some(line => /^\\s*status: "paid"/.test(line)), "payment confirmation must not overwrite fulfilment status");

for (const sql of [seoMigration, migration]) {
  assert.ok(sql.includes("do $constraints$"), "product schema constraints should be added idempotently");
}
console.log("SEO, security, feed, analytics and payment regression checks passed.");
