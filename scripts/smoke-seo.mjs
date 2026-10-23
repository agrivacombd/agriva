import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/legacy_unapplied_migrations/030_seed_seo_and_reporting.sql");
const integrationsMigration = read("../supabase/legacy_unapplied_migrations/031_google_site_integrations.sql");
const integrationsPage = read("../app/admin/site-integrations/page.tsx");
const seoHealthPage = read("../app/admin/seo-health/page.tsx");
const indexnowRoute = read("../app/[indexnowKey].txt/route.ts");
const seoMigration = read("../supabase/legacy_unapplied_migrations/029_product_seo_schema.sql");
const adminBootstrap = read("../supabase/migrations/20261022212109_028_admin_bootstrap_product_creation.sql");
const productForm = read("../app/admin/products/page.tsx");
const productPage = read("../app/marketplace/[productId]/page.tsx");
const audit = read("../app/admin/seo/page.tsx");
const feed = read("../app/api/merchant-center/route.ts");
const sitemap = read("../app/sitemap.ts");
const homepage = read("../app/page.tsx");
const toolsPage = read("../app/tools/page.tsx");
const articlePage = read("../app/blog/[slug]/page.tsx");
const robots = read("../app/robots.ts");
const guides = read("../app/guides/[slug]/page.tsx");
const analytics = read("../app/api/analytics-report/route.ts");
const paymentIpn = read("../app/api/payment/sslcommerz/ipn/route.ts");
const categoryPage = read("../app/marketplace/category/[categorySlug]/page.tsx");
const subcategoryPage = read("../app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx");

for (const field of ["crop_name", "seed_variety", "pack_size", "germination_rate", "sowing_season", "suitable_regions", "seed_expiry_date"]) {
  assert.ok(migration.includes(field), `legacy seed migration should define ${field}`);
}
for (const field of ["seo_title", "seo_description", "seo_keywords", "ProductImageOptimizer"]) {
  assert.ok(productForm.includes(field), `current Super Admin product form should expose ${field}`);
}
assert.ok(productForm.includes("image_alt"), "product form should expose image alt text for SEO");
assert.ok(migration.includes("public.is_admin()") && migration.includes("admin_audit_log"), "seed write RPC must be admin-only and audited");
assert.ok(adminBootstrap.includes("AGRIVA_OWNER_EMAIL") && adminBootstrap.includes("is_admin()"), "first-admin bootstrap must be owner-restricted");
assert.ok(audit.includes("Math.round(done / all.length * 100)"), "SEO completeness score should be calculated");

assert.ok(feed.includes('.eq("status", "active")') && !feed.includes("moderation_status"), "feed must use the live active-product schema without absent moderation columns");
assert.ok(feed.includes('.gt("stock", 0)') && feed.includes("image_url"), "feed must filter unavailable/unimaged products");
assert.ok(feed.includes("function xml(") && feed.includes('replace(/&/g, "&amp;")'), "feed must XML-escape product data");
assert.ok(feed.includes("p.image_url && /^https:") && feed.includes("Cache-Control"), "feed must validate HTTPS image URLs and set cache policy");

assert.ok(productPage.includes("BreadcrumbList") && productPage.includes("additionalProperty"), "product page must emit breadcrumb and seed structured data");
assert.ok(sitemap.includes("/guides/") && guides.includes("seed-selection"), "Bengali guides must be crawlable");
assert.ok(!sitemap.includes("\\n"), "sitemap must not contain escaped newline tokens that break TypeScript parsing");
assert.ok(homepage.includes("openGraph:") && homepage.includes("keywords:"), "homepage should expose search and social metadata");
assert.ok(toolsPage.includes("WebApplication") && toolsPage.includes("alternates: { canonical: \"/tools\" }"), "tools page should expose canonical and application structured data");
assert.ok(articlePage.includes('"@type": "Article"') && articlePage.includes("datePublished") && articlePage.includes("openGraph:"), "published articles should expose article structured data and social metadata");
for (const route of ["/tools", "/market-prices", "/weather", "/crop-calendar", "/crop-choice", "/soil-fertilizer"]) {
  assert.ok(sitemap.includes(route), `sitemap should include public tool route ${route}`);
}
const marketPricesPage = read("../app/market-prices/page.tsx");
const cropDiseasePage = read("../app/crop-disease/page.tsx");
const weatherPage = read("../app/weather/page.tsx");
const cropCalendarPage = read("../app/crop-calendar/page.tsx");
const cropChoicePage = read("../app/crop-choice/page.tsx");
const soilFertilizerPage = read("../app/soil-fertilizer/page.tsx");
const blogIndexPage = read("../app/blog/page.tsx");
for (const [name, page] of [
  ["market prices", marketPricesPage],
  ["crop disease", cropDiseasePage],
  ["weather", weatherPage],
  ["crop calendar", cropCalendarPage],
  ["crop choice", cropChoicePage],
  ["soil fertilizer", soilFertilizerPage],
  ["blog index", blogIndexPage],
]) {
  assert.ok(page.includes("openGraph:") && page.includes("twitter:"), `${name} must define page-specific social metadata`);
}
assert.ok(sitemap.includes("MARKETPLACE_CATEGORIES.map") && sitemap.includes("MARKETPLACE_CATEGORIES.flatMap"), "category landing pages must be discoverable in sitemap");
assert.ok(categoryPage.includes("matchesProductCategory") && categoryPage.includes("CollectionPage"), "category pages must filter products and expose collection metadata");
assert.ok(subcategoryPage.includes("matchesSubcategory") && subcategoryPage.includes("CollectionPage"), "subcategory pages must filter products and expose collection metadata");
assert.ok(!read("../app/marketplace/page.tsx").includes("✓ ক্যাটাগরি অনুযায়ী ব্রাউজ"), "marketplace hero should not show promotional checklist claims");
assert.ok(!read("../app/marketplace/page.tsx").includes("✓ মোবাইল-ফ্রেন্ডলি") && !read("../app/marketplace/page.tsx").includes("✓ অনুমোদিত পণ্য"), "marketplace hero should not show mobile-friendly or approved-product claims");
assert.ok(read("../components/marketplace/MarketplaceCore.tsx").includes("item.subcategories.map") && read("../components/marketplace/MarketplaceCore.tsx").includes("/marketplace/category/${item.slug}/${sub.slug}"), "marketplace category cards must link directly to subcategory landing pages");
assert.ok(read("../lib/marketplace/taxonomy.ts").includes("getProductTaxonomy") && productPage.includes("subcategory.slug"), "product breadcrumbs should connect to the canonical subcategory hierarchy");
assert.ok(robots.includes('"/admin"') && robots.includes('"/api"') && robots.includes("/sitemap.xml"), "robots must exclude private routes and declare sitemap");

assert.ok(analytics.includes("analytics.readonly") && analytics.includes("webmasters.readonly"), "reporting must use read-only Google API scopes");
assert.ok(!analytics.includes("NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT"), "Google service-account secrets must remain server-side");
assert.ok(analytics.includes('if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })'), "analytics endpoint must require a signed-in user");
assert.ok(analytics.includes('profile?.role !== "admin"'), "analytics endpoint must enforce admin role");

assert.ok(paymentIpn.includes('gatewayCurrency !== "BDT"') && paymentIpn.includes("expectedAmount - receivedAmount"), "payment IPN must verify currency and exact order amount");
assert.ok(paymentIpn.includes("SUPABASE_SERVICE_ROLE_KEY") && !paymentIpn.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"), "payment IPN must use server-only service credentials");
assert.ok(paymentIpn.includes('payment_status: "paid"') && !paymentIpn.split("\n").some(line => /^\s*status: "paid"/.test(line)), "payment confirmation must not overwrite fulfilment status");

for (const sql of [seoMigration, migration]) {
  assert.ok(sql.includes("do $constraints$"), "product schema constraints should be added idempotently");
}
assert.ok(integrationsMigration.includes("site_public_integrations") && integrationsMigration.includes("indexnow_key"), "Google/Bing/IndexNow settings must be stored");
assert.ok(integrationsMigration.includes("public.is_admin()"), "only admins may write integration settings");
assert.ok(integrationsPage.includes("ga4_measurement_id") && integrationsPage.includes("bing_site_verification") && integrationsPage.includes("indexnow_key"), "admin UI must expose search engine setup fields");
assert.ok(seoHealthPage.includes("Submit URLs to IndexNow") && seoHealthPage.includes("/sitemap.xml") && seoHealthPage.includes("/robots.txt"), "SEO health page must expose crawler resources and IndexNow submit");
assert.ok(indexnowRoute.includes("text/plain") && indexnowRoute.includes("indexnow_key"), "IndexNow key verification endpoint must serve the configured key as text");
console.log("SEO, search engine integrations, security, feed, analytics and payment regression checks passed.");
