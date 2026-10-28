#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required security file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const layout = read("app/admin/layout.tsx");
assert.match(layout, /supabase\.auth\.getUser\(\)/, "admin layout must verify the server-side session");
assert.match(layout, /authError\s*\|\|\s*!user/, "admin layout must fail closed on auth errors");
assert.match(layout, /profileError\s*\|\|\s*profile\?\.role\s*!==\s*"admin"/, "admin layout must fail closed on profile lookup errors and non-admin roles");

const collectRouteHandlers = (directory) => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return collectRouteHandlers(path);
    return entry.isFile() && entry.name === "route.ts" ? [path] : [];
  });
};

// Route Handlers do not inherit authorization from app/admin/layout.tsx.
// Discover them dynamically so a newly added endpoint cannot silently escape
// this regression test just because its path was not added to a fixed list.
for (const path of [
  ...collectRouteHandlers("app/api/admin"),
  ...collectRouteHandlers("app/admin"),
]) {
  const source = read(path);
  assert.match(source, /auth\.getUser\(\)/, `${path} must independently verify the server-side session`);
  assert.match(source, /profiles/, `${path} must verify the user's profile role`);
  assert.match(source, /role/, `${path} must check authorization, not just authentication`);
}

for (const path of [
  "app/api/admin/article/generate/route.ts",
  "app/api/admin/content-brief/route.ts",
  "app/api/admin/content-drafts/generate/route.ts",
  "app/api/admin/content-opportunities/route.ts",
  "app/admin/content-drafts/publish/route.ts",
  "app/admin/reports/orders.csv/route.ts",
]) {
  const source = read(path);
  assert.match(source, /auth\.getUser\(\)/, `${path} must verify a server-side session`);
  assert.match(source, /profiles/, `${path} must verify the user's profile role`);
  assert.match(source, /role/, `${path} must check a role`);
}

for (const path of [
  "app/admin/page.tsx",
  "app/admin/products/page.tsx",
  "app/admin/categories/page.tsx",
  "app/admin/transport/page.tsx",
  "app/admin/harvest/page.tsx",
  "app/admin/jobs/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/settings/page.tsx",
]) {
  const source = read(path);
  assert.match(source, /"use server"/, `${path} expected to contain server actions`);
  assert.match(source, /requireAdmin\(/, `${path} server actions must call a server-side admin guard`);
}

const searchIntelligencePage = read("app/admin/search-intelligence/page.tsx");
assert.ok(searchIntelligencePage.includes('from("content_opportunities")'), "search intelligence must use persisted canonical opportunities, not in-memory seed data");
assert.ok(searchIntelligencePage.includes('rpc("create_content_draft_from_opportunity"'), "creating an opportunity draft must use the database-backed workflow");
assert.ok(searchIntelligencePage.includes('item.status === "approved" && <form action={createDraft}'), "only approved opportunities may be converted to saved drafts from Search Intelligence");
assert.ok(searchIntelligencePage.includes("async function requireAdmin()"), "search intelligence server actions must re-check admin authorization");
assert.ok(searchIntelligencePage.includes('const transitions: Record<string, string[]>'), "search intelligence must enforce the same explicit opportunity transition map");
assert.ok(searchIntelligencePage.includes('.eq("id", id).eq("status", current.status)'), "search intelligence updates must guard against stale opportunity state");
assert.ok(!searchIntelligencePage.includes("score,created_at,last_seen_at"), "search intelligence query must not request a nonexistent score column");
const aiContentDashboard = read("components/admin/AIContentDashboard.tsx");
assert.ok(aiContentDashboard.includes("/admin/content-drafts"), "AI content hub must link to saved drafts");
assert.ok(aiContentDashboard.includes("no longer creates fake local-only drafts"), "AI content hub must clearly disclose that generation is not persisted");
assert.ok(!aiContentDashboard.includes("setDrafts"), "AI content hub must not imply local-only drafts are persisted");
const adminDashboard = read("app/admin/page.tsx");
assert.ok(adminDashboard.includes('from("content_drafts")'), "Super Admin dashboard must include persisted SEO content drafts");
assert.ok(adminDashboard.includes('from("article_drafts")'), "Super Admin dashboard must include the legacy article draft queue");
assert.ok(adminDashboard.includes("Content draft activity"), "Super Admin dashboard must surface recent SEO content drafts");
assert.ok(adminDashboard.includes("Legacy article drafts"), "Super Admin dashboard must surface recent legacy article drafts");
assert.ok(adminDashboard.includes('select("id", { count: "exact", head: true }).in("status", ["pending", "processing"])'), "pending order metrics must count the full queue, not only recent orders");

const reportsPage = read("app/admin/reports/page.tsx");
assert.ok(reportsPage.includes("errors.length === 0 ?"), "admin report metrics must be hidden if any source query fails");
assert.ok(reportsPage.includes("ডেটা অসম্পূর্ণ থাকায় ভুল সারাংশ এড়াতে"), "admin reports must explain why incomplete metrics are withheld");

const ordersPage = read("app/admin/orders/page.tsx");
assert.ok(ordersPage.includes("error: ordersError"), "admin orders page must retain query errors");
assert.ok(ordersPage.includes('role="alert"'), "admin orders page must surface query failures instead of presenting an empty state");
assert.ok(ordersPage.includes("{!ordersError && !orders?.length"), "admin orders page must not show an empty state when the query failed");

const opportunitiesPage = read("app/admin/opportunities/page.tsx");
assert.ok(opportunitiesPage.includes("error: opportunitiesError"), "admin opportunities page must retain query errors");
assert.ok(opportunitiesPage.includes('role="alert"'), "admin opportunities page must surface query failures");
assert.ok(opportunitiesPage.includes("!opportunitiesError && !opportunities?.length"), "admin opportunities page must not claim there is no data when the query failed");

const harvestPage = read("app/admin/harvest/page.tsx");
assert.ok(harvestPage.includes('(action === "rejected" && !note)'), "harvest moderation must require a reason when rejecting a listing");
assert.ok(harvestPage.includes("প্রত্যাখ্যান করলে আবশ্যক"), "harvest moderation UI must explain that rejection requires a reason");
assert.ok(harvestPage.includes('supabase.rpc("admin_moderate_harvest_listing"'), "harvest moderation must use the audited admin-only RPC");
assert.ok(!harvestPage.includes('.from("harvest_listings").update('), "harvest moderation must not directly update the table from the page");

const orderMigration = read("supabase/migrations/20261026233500_harden_marketplace_order_transitions.sql");
assert.ok(orderMigration.includes("Invalid order status transition"), "marketplace order RPC must reject invalid state transitions");
assert.ok(orderMigration.includes("v_order.buyer_id = v_uid"), "marketplace order RPC must distinguish buyer from seller permissions");
assert.ok(orderMigration.includes("v_order.farmer_id = v_uid"), "marketplace order RPC must enforce seller ownership");
assert.ok(orderMigration.includes("p_status = 'cancelled' AND v_old_status IN ('pending', 'processing')"), "inventory must only be restored for pre-shipment cancellations");
assert.ok(orderMigration.includes("A refund does not"), "refund must not automatically restock inventory");
assert.ok(orderMigration.includes("REVOKE ALL ON FUNCTION public.set_marketplace_order_status(uuid, text) FROM PUBLIC, anon"), "order status RPC must not be executable by anonymous users");

const harvestMigration = read("supabase/migrations/20261026233434_harden_harvest_moderation.sql");
assert.ok(harvestMigration.includes("NEW.moderation_note IS DISTINCT FROM OLD.moderation_note"), "harvest trigger must prevent non-admin moderation-note changes");
assert.ok(harvestMigration.includes("admin_moderate_harvest_listing"), "harvest moderation must provide an admin-only RPC");
assert.ok(harvestMigration.includes("INSERT INTO public.admin_audit_log"), "harvest moderation RPC must write an audit record");
assert.ok(harvestMigration.includes("p_status IS NULL OR p_status NOT IN ('approved', 'rejected', 'pending')"), "harvest moderation RPC must reject null and unsupported statuses");
assert.ok(harvestMigration.includes("p_status = 'rejected' AND v_note IS NULL"), "harvest moderation RPC must require a rejection reason");
assert.ok(harvestMigration.includes("char_length(coalesce(v_note, '')) > 500"), "harvest moderation RPC must enforce the note length server-side");
assert.ok(harvestMigration.includes("REVOKE ALL ON FUNCTION public.admin_moderate_harvest_listing(uuid, text, text) FROM PUBLIC, anon"), "harvest moderation RPC must revoke public and anonymous execution");

const articleGenerator = read("app/api/admin/article/generate/route.ts");
assert.ok(articleGenerator.includes('replace(/\\s+/g, "-")'), "article slug generation must normalize actual whitespace");
assert.ok(/### \$\{keyword\} কী\?\n\n/.test(articleGenerator), "article markdown must contain real line breaks rather than literal backslash-n sequences");

const articleReview = read("app/admin/articles/[id]/page.tsx");
assert.ok(articleReview.includes("supabase.auth.getUser()"), "article review page must verify the session");
assert.ok(articleReview.includes('profileError || profile?.role !== "admin"'), "article review page must fail closed for non-admin users");

for (const path of [
  "app/admin/transport/page.tsx",
  "app/admin/harvest/page.tsx",
  "app/admin/jobs/page.tsx",
]) {
  const source = read(path);
  assert.ok(source.includes("authError || !user"), `${path} must fail closed on session lookup errors`);
  assert.ok(source.includes('profileError || profile?.role !== "admin"'), `${path} must fail closed on profile lookup errors and non-admin roles`);
}

for (const path of [
  "app/admin/categories/page.tsx",
  "app/admin/opportunities/page.tsx",
  "app/admin/audit/page.tsx",
]) {
  const source = read(path);
  assert.ok(source.includes("authError || !user"), `${path} must fail closed on session lookup errors`);
  assert.ok(source.includes('profileError || profile?.role !== "admin"'), `${path} must fail closed on profile lookup errors and non-admin roles`);
}

const transportAdmin = read("app/admin/transport/page.tsx");
assert.ok(transportAdmin.includes("admin_set_transport_partner_verification"), "transport status changes must use the admin-only RPC");
const jobsAdmin = read("app/admin/jobs/page.tsx");
assert.ok(jobsAdmin.includes("admin_moderate_job_post"), "job status changes must use the admin-only RPC");
assert.ok(jobsAdmin.includes('!["published", "rejected", "paused", "filled"].includes(status)'), "job moderation must allow only approved statuses");
const transportMigration = read("supabase/migrations/20261022130000_admin_transport_partner_verification.sql");
assert.ok(transportMigration.includes("p_status is null or p_status not in ('verified', 'rejected', 'suspended')"), "transport RPC must reject null and unsupported statuses");
const jobsMigration = read("supabase/migrations/20261025110000_agriculture_jobs_marketplace.sql");
assert.ok(jobsMigration.includes("p_status is null or p_status not in ('published','rejected','paused','filled')"), "job moderation RPC must reject null and unsupported statuses");


const opportunityApi = read("app/api/admin/content-opportunities/route.ts");
assert.ok(opportunityApi.includes("async function requireAdmin()"), "content opportunity API must share an explicit admin guard");
assert.ok(opportunityApi.includes("profileError"), "content opportunity API must fail closed on profile lookup errors");
assert.ok(opportunityApi.includes('const transitions: Record<string, string[]>'), "opportunity status changes must use an explicit transition map");
assert.ok(opportunityApi.includes('.eq("id", id).eq("status", current.status)'), "opportunity status update must be conditional to prevent stale writes");
assert.ok(opportunityApi.includes("Opportunity changed; reload before trying again"), "opportunity API must reject stale status updates");

const superAdminPage = read("app/super-admin/page.tsx");
const moduleDirectory = read("app/super-admin/AdminModuleDirectory.tsx");
for (const route of [
  "/admin", "/admin/products", "/admin/categories", "/admin/orders", "/admin/users",
  "/admin/harvest", "/admin/transport", "/admin/jobs", "/admin/content-studio",
  "/admin/content-drafts", "/admin/ai-content", "/admin/articles",
  "/admin/search-intelligence", "/admin/opportunities", "/admin/reports",
  "/admin/settings", "/admin/audit",
]) {
  assert.ok(superAdminPage.includes(route), `super admin directory must link to existing admin route ${route}`);
}
assert.ok(superAdminPage.includes('profileError || profile?.role !== "admin"'), "super admin hub must fail closed for non-admin users");
assert.ok(moduleDirectory.includes('type="search"'), "super admin directory must provide accessible module search");
assert.ok(moduleDirectory.includes("grid-cols-1") && moduleDirectory.includes("sm:grid-cols-2") && moduleDirectory.includes("xl:grid-cols-4"), "super admin directory must adapt from mobile to desktop");
assert.ok(moduleDirectory.includes("No matching admin tools"), "module search must have an empty state");

const contentStudio = read("app/admin/content-studio/page.tsx");
assert.ok(contentStudio.includes("deterministic template—not an AI provider"), "Content Studio must not misrepresent a template as AI-generated");
assert.ok(contentStudio.includes("does not save or publish content"), "Content Studio must disclose that template briefs are not persisted");
assert.ok(contentStudio.includes("finally"), "Content Studio must always clear its loading state after request failures");
assert.ok(contentStudio.includes('role="alert"'), "Content Studio must surface request errors accessibly");
const contentBriefApi = read("app/api/admin/content-brief/route.ts");
assert.ok(contentBriefApi.includes('generatedWith: "template"'), "content brief API must disclose its deterministic template output");


const draftGenerator = read("app/api/admin/content-drafts/generate/route.ts");
assert.ok(draftGenerator.includes('opportunity.status !== "approved"'), "draft generation API must require approved opportunities");
assert.ok(draftGenerator.includes("opportunity.slug?.trim() || slugify(title)"), "generated URL slug must match the final selected article title");
assert.ok(draftGenerator.includes('rpc("create_generated_content_draft_from_opportunity"'), "generated draft and opportunity status must be saved atomically through the database RPC");
assert.ok(draftGenerator.includes('"x-goog-api-key": key'), "Gemini API keys must be sent in a request header");
assert.ok(!draftGenerator.includes(":generateContent?key="), "Gemini API keys must not be placed in URL query strings");
assert.ok(!draftGenerator.includes('.from("content_drafts").insert('), "draft generation API must not create drafts outside the atomic workflow RPC");
const approvalMigration = read("supabase/migrations/20261029100000_content_draft_approval_gate.sql");
assert.ok(approvalMigration.includes("o.status <> 'approved'"), "database RPC must enforce approval even if a client bypasses the UI");
assert.ok(approvalMigration.includes("FOR UPDATE"), "database draft creation must lock the opportunity against concurrent requests");
assert.ok(approvalMigration.includes("create_generated_content_draft_from_opportunity"), "database must provide an atomic generated-draft RPC");
assert.ok(approvalMigration.includes("REVOKE ALL ON FUNCTION public.create_generated_content_draft_from_opportunity"), "generated-draft RPC must revoke public execution");
assert.ok(approvalMigration.includes("content_drafts_published_article_slug_uidx"), "published CMS articles must have unique canonical slugs");
assert.ok(approvalMigration.includes("GRANT SELECT (slug, title, meta_title, meta_description, body_markdown, updated_at, status, content_type)"), "public CMS article queries must receive column-limited SELECT grants");
assert.ok(approvalMigration.includes("guard_published_content_article_slug"), "database must reserve slugs used by built-in blog posts");
assert.ok(approvalMigration.includes("'landing_page'::text"), "content workflow constraints must allow SEO landing pages");
assert.ok(approvalMigration.includes("content_drafts_public_published_landing_pages_read"), "published landing pages must have a separate public RLS policy");
assert.ok(approvalMigration.includes("'agri-guide-' || substr(o.id::text, 1, 8)"), "database must produce a valid fallback slug for non-Latin keywords");


const publishedArticleData = read("lib/content/published-articles.ts");
assert.ok(publishedArticleData.includes('.eq("status", "published")'), "public CMS article queries must expose published content only");
assert.ok(publishedArticleData.includes('.eq("content_type", "article")'), "public CMS article queries must not expose product/tool drafts");
assert.ok(publishedArticleData.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), "public article reads must use the public Supabase key, not a service-role secret");
const blogListing = read("app/blog/page.tsx");
assert.ok(blogListing.includes("getPublishedContentArticles"), "blog listing must read published CMS articles");
assert.ok(blogListing.includes("const allArticles = [...publishedArticles, ...articles.filter((article) => !publishedSlugs.has(article.slug))]"), "blog listing must prioritize published CMS articles and avoid duplicate slugs");
const blogDetail = read("app/blog/[slug]/page.tsx");
assert.ok(blogDetail.includes("getPublishedContentArticleBySlug"), "blog detail route must resolve published CMS articles by slug");
assert.ok(blogDetail.includes("renderMarkdown(article.body_markdown"), "published CMS article body must be rendered on its public route");
const sitemap = read("app/sitemap.ts");
assert.ok(sitemap.includes("getPublishedContentArticles"), "sitemap must include published CMS articles");
assert.ok(sitemap.includes("url: `${base}/blog/${article.slug}`"), "sitemap must include canonical public blog URLs for CMS articles");
assert.ok(sitemap.includes("getPublishedContentLandingPages"), "sitemap must include published SEO landing pages");
assert.ok(sitemap.includes("url: `${base}/landing/${page.slug}`"), "sitemap must include canonical landing page URLs");
const landingPageRoute = read("app/landing/[slug]/page.tsx");
assert.ok(landingPageRoute.includes("getPublishedContentLandingPageBySlug"), "public landing route must load published landing content");
assert.ok(landingPageRoute.includes('"@type": "WebPage"'), "landing pages must expose WebPage structured data");
assert.ok(contentDraftsClient.includes('"landing_page"'), "admin content drafts must support landing_page content type");
const legacyArticleRoute = read("app/articles/[slug]/page.tsx");
assert.ok(legacyArticleRoute.includes("redirect(`/blog/${encodeURIComponent(slug)}`)"), "legacy article URLs must canonicalize to the blog route");


const productMediaMigration = read("supabase/migrations/20261029120000_admin_product_images.sql");
assert.ok(productMediaMigration.includes("ADD COLUMN IF NOT EXISTS image_url text"), "product images must be stored in a database-backed field");
assert.ok(productMediaMigration.includes("file_size_limit") && productMediaMigration.includes("5242880"), "product image storage must enforce a 5 MB limit");
assert.ok(productMediaMigration.includes("ARRAY['image/jpeg', 'image/png', 'image/webp']"), "product image storage must restrict allowed MIME types");
assert.ok(productMediaMigration.includes("AND public.is_admin()"), "product image storage writes must require an admin");
assert.ok(productMediaMigration.includes("(storage.foldername(name))[1] = auth.uid()::text"), "product image writes must be confined to the uploader's own folder");
assert.ok(productMediaMigration.includes("admin_create_marketplace_product_with_image"), "product creation with image must use a database RPC");
assert.ok(productMediaMigration.includes("admin_update_marketplace_product"), "product and taxonomy edits must be atomic");
assert.ok(productMediaMigration.includes("CASE WHEN v_category_slug IS NULL THEN category ELSE subcategory_name END"), "unmapped legacy product categories must be preserved during edits");
const productForm = read("components/admin/AdminCreateProductForm.tsx");
assert.ok(productForm.includes('storage.from("product-images").upload'), "admin product form must upload image files to Supabase Storage");
assert.ok(productForm.includes("MAX_IMAGE_SIZE = 5 * 1024 * 1024"), "admin product form must enforce the image size limit");
assert.ok(productForm.includes("storage.from(" + '"product-images"' + ").remove([uploadedPath])"), "failed product creation must clean up uploaded images");
const productApi = read("app/api/admin/products/route.ts");
assert.ok(productApi.includes('profile?.role !== "admin"'), "product creation API must require admin authorization");
assert.ok(productApi.includes('rpc("admin_create_marketplace_product_with_image"'), "product creation API must call the image-aware RPC");
assert.ok(productApi.includes("expectedImagePrefix"), "product image URLs must be restricted to the authenticated admin's Supabase storage folder");
const productAdminPage = read("app/admin/products/page.tsx");
assert.ok(productAdminPage.includes('rpc("admin_update_marketplace_product"'), "product edits must use the atomic product-and-taxonomy RPC");
assert.ok(!productAdminPage.includes('rpc("admin_set_product_taxonomy"'), "product edits must not depend on the missing taxonomy RPC");
const productMarketplace = read("components/marketplace/MarketplaceCore.tsx");
assert.ok(productMarketplace.includes("product.image_url"), "marketplace cards must display uploaded product images");
const productDetail = read("app/marketplace/[productId]/page.tsx");
assert.ok(productDetail.includes('.eq("status", "active")'), "public product details must expose active products only");
assert.ok(productDetail.includes('"@type": "Product"'), "product detail pages must include Product structured data");

console.log("Admin authorization, content workflow, Content Studio disclosure, and moderation-RPC regression checks passed.");
