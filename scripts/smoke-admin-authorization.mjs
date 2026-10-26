#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required security file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const layout = read("app/admin/layout.tsx");
assert.match(layout, /supabase\.auth\.getUser\(\)/, "admin layout must verify the server-side session");
assert.match(layout, /authError\s*\|\|\s*!user/, "admin layout must fail closed on auth errors");
assert.match(layout, /profileError\s*\|\|\s*profile\?\.role\s*!==\s*"admin"/, "admin layout must fail closed on profile lookup errors and non-admin roles");

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
const harvestMigration = read("supabase/migrations/20261027190000_harden_harvest_moderation.sql");
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

console.log("Admin route, Server Action, article-review, and moderation-RPC regression checks passed.");
