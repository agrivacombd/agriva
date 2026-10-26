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

const ordersPage = read("app/admin/orders/page.tsx");
assert.ok(ordersPage.includes("error: ordersError"), "admin orders page must retain query errors");
assert.ok(ordersPage.includes('role="alert"'), "admin orders page must surface query failures instead of presenting an empty state");

const articleGenerator = read("app/api/admin/article/generate/route.ts");
assert.ok(articleGenerator.includes('replace(/\\s+/g, "-")'), "article slug generation must normalize actual whitespace");
assert.ok(articleGenerator.includes("### ${keyword} কী?\n\n"), "article markdown must contain real line breaks rather than literal backslash-n sequences");

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

console.log("Admin route, Server Action, article-review, and moderation-RPC regression checks passed.");
