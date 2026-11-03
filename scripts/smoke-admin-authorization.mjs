#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required security file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const layout = read("app/admin/layout.tsx");
const authz = read("lib/admin/authz.ts");
const adminDashboard = read("app/admin/page.tsx");
const controlCenterNav = read("components/admin/AdminControlCenterNav.tsx");
const marketplaceAdmin = read("app/admin/marketplace/page.tsx");
const adminShell = read("components/admin/AdminControlCenterShell.tsx");
const adminProducts = read("app/admin/products/page.tsx");
assert.match(layout, /requireAdminPage\("dashboard\.read"\)/, "admin layout must use the shared capability guard");
assert.match(authz, /supabase\.auth\.getUser\(\)/, "shared guard must verify the server-side session");
assert.match(authz, /profileError/, "shared guard must fail closed when profile lookup fails");
assert.match(authz, /LEGACY_ADMIN_CAPABILITIES\.has\(capability\)/, "shared guard must explicitly check the requested capability");
assert.match(authz, /authorization_unavailable/, "authorization lookup failures must be distinguishable from ordinary denial");
const legacyCapabilityPolicy = authz.split("const LEGACY_ADMIN_CAPABILITIES")[1]?.split("]);")[0] ?? "";
assert.doesNotMatch(legacyCapabilityPolicy, /payments\.reconcile|orders\.refund\.request|payouts\.approve|system\.recovery\.execute/, "high-risk financial and recovery capabilities must remain deny-by-default");
assert.match(controlCenterNav, /getAvailableAdminCapabilities/, "Admin navigation must use a server-verified capability list");
assert.ok(layout.includes("<AdminControlCenterNav>{children}</AdminControlCenterNav>"), "Admin layout must render the protected workspace inside the shared shell");
assert.equal(layout.split("{children}").length - 1, 1, "Admin layout must render route content exactly once");
assert.ok(adminShell.includes("fixed inset-y-0 left-0 z-40 hidden w-[264px]"), "Desktop Admin navigation must use a persistent sidebar");
assert.ok(adminShell.includes('aria-label="Mobile admin navigation"'), "Mobile Admin navigation must have a dedicated accessible navigation landmark");
assert.ok(adminShell.includes("fixed inset-x-0 bottom-0"), "Mobile Admin navigation must be fixed to the bottom edge");
assert.ok(adminShell.includes("grid-cols-5"), "Mobile Admin navigation must expose four primary destinations plus More");
assert.ok(adminShell.includes('aria-current={selected ? "page" : undefined}'), "Current Admin destination must be announced to assistive technology");
assert.ok(adminShell.includes("min-h-12"), "Touch navigation controls must have a minimum 48px interaction height");
assert.match(adminProducts, /name="q"/, "Marketplace editor must support server-side product search");
assert.match(adminProducts, /name="status"/, "Marketplace editor must support product status filtering");
assert.match(adminProducts, /name="seoImageAltTexts"/, "Marketplace editor must support image alt text editing");
assert.match(adminProducts, /admin_update_product_seo_assistant_details/, "Marketplace image alt text must save through the admin-guarded RPC");
assert.match(adminProducts, /Slug পরিবর্তন redirect migration প্রস্তুত না হওয়া পর্যন্ত read-only থাকবে/, "Marketplace slug editing must remain blocked until redirect history is available");
assert.match(adminDashboard, /md:hidden/, "Dashboard must render a mobile-friendly order card list");
assert.doesNotMatch(adminDashboard, /orderTotals/, "Dashboard must not retain the unbounded all-order value query");
assert.ok(adminDashboard.includes("quickActions.map"), "Dashboard shortcuts must be rendered from a capability-filtered action list");
assert.ok(adminDashboard.includes("canReadOrders ? supabase.from"), "Dashboard must skip recent-order reads without orders.read");
assert.ok(adminDashboard.includes('!["cancelled", "completed", "refunded"].includes(order.status)'), "Dashboard must hide routine transition controls for terminal order states");
assert.ok(!adminDashboard.includes("shipping_address"), "Dashboard must not select buyer shipping-address PII");
assert.ok(controlCenterNav.includes("available.has(link.capability ?? capabilities[0])"), "Admin navigation must filter each destination by its required capability");
assert.match(marketplaceAdmin, /requireAdminPage\("catalog\.read"\)/, "Marketplace landing page must require catalog read access");
assert.match(marketplaceAdmin, /from\("products"\)/, "Marketplace landing page must use the Marketplace products domain");
assert.match(marketplaceAdmin, /failed queries are shown as unavailable, not zero/i, "Marketplace metrics must not turn query failures into zero counts");
assert.match(marketplaceAdmin, /Custom slug editing, slug history and 301 redirects are intentionally not enabled yet/, "Marketplace landing page must not promise slug persistence before migration");

for (const match of controlCenterNav.matchAll(/href: "(\/admin(?:\/[a-z-]+)?)"/g)) {
  const href = match[1];
  const routeFile = href === "/admin" ? "app/admin/page.tsx" : `app${href}/page.tsx`;
  assert.ok(existsSync(routeFile), `Admin navigation must not link to a missing route: ${href}`);
}
assert.match(adminDashboard, /requireAdmin\("payments\.reconcile"\)/, "commission approval must require a finance capability");
assert.match(adminDashboard, /requireAdmin\("payouts\.approve"\)/, "payout approval must require an explicit high-risk capability");
assert.match(adminDashboard, /getAvailableAdminCapabilities\(\["payments\.read", "payments\.reconcile", "payouts\.read", "payouts\.approve", "orders\.read", "orders\.transition"/, "finance data and actions must be scoped to explicitly granted capabilities");
assert.match(adminDashboard, /canApproveCommissions \? \(\s*<form action=\{approveCommission\}/, "commission approval UI must be hidden without its capability");
assert.match(adminDashboard, /canManagePayouts \? \(\s*<form action=\{approvePayout\}/, "payout approval UI must be hidden without its capability");
assert.match(adminDashboard, /canManagePayouts \? \(\s*<form action=\{completePayout\}/, "payout completion UI must be hidden without its capability");


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
  if (source.includes("requireAdminApi(")) {
    assert.match(source, /requireAdminApi\(["'][a-z.]+["']\)/, `${path} must request an explicit capability`);
  } else {
    assert.match(source, /auth\.getUser\(\)/, `${path} must independently verify the server-side session`);
    assert.match(source, /profiles/, `${path} must verify the user's profile role`);
    assert.match(source, /role/, `${path} must check authorization, not just authentication`);
  }
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
  if (source.includes("requireAdminApi(")) {
    assert.match(source, /requireAdminApi\(["'][a-z.]+["']\)/, `${path} must request an explicit capability`);
  } else {
    assert.match(source, /auth\.getUser\(\)/, `${path} must verify a server-side session`);
    assert.match(source, /profiles/, `${path} must verify the user's profile role`);
    assert.match(source, /role/, `${path} must check a role`);
  }
}

for (const path of [
  "app/admin/page.tsx",
  "app/admin/products/page.tsx",
  "app/admin/categories/page.tsx",
  "app/admin/transport/page.tsx",
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
assert.ok(ordersPage.includes('requireAdmin("orders.transition")'), "Order status updates must require the orders.transition capability");
assert.ok(ordersPage.includes('requireAdmin("payments.reconcile")'), "COD collection must require the separate payments.reconcile capability");
assert.ok(ordersPage.includes("canReconcilePayments"), "COD collection UI must be hidden without the dedicated finance capability");
assert.ok(ordersPage.includes('requireAdmin("orders.read")'), "Order operations must use the shared read capability");
assert.ok(ordersPage.includes("checkoutIds.length && canReadPayments"), "COD ledger reads must be skipped without payments.read");
assert.ok(ordersPage.includes('!["cancelled", "completed", "refunded"].includes(status)'), "Order operations must hide transition controls for terminal states");
assert.ok(adminDashboard.includes('getAvailableAdminCapabilities(["payments.read", "payments.reconcile", "payouts.read", "payouts.approve", "orders.read", "orders.transition"'), "Dashboard finance data must be capability-gated");
assert.ok(adminDashboard.includes("canReadPayments ? supabase.from"), "Commission queries must be skipped without finance read permission");
assert.ok(adminDashboard.includes("canReadPayouts ? supabase.from"), "Payout queries must be skipped without payout read permission");
assert.ok(!adminDashboard.includes("shipping_address"), "Dashboard order preview must not fetch full shipping-address PII");
assert.ok(!adminDashboard.includes('value="refunded"'), "Routine dashboard order controls must not expose refund status");
assert.ok(ordersPage.includes("error: ordersError"), "admin orders page must retain query errors");
assert.ok(ordersPage.includes('role="alert"'), "admin orders page must surface query failures instead of presenting an empty state");
assert.ok(ordersPage.includes("{!ordersError && !orders?.length"), "admin orders page must not show an empty state when the query failed");

const opportunitiesPage = read("app/admin/opportunities/page.tsx");
assert.ok(opportunitiesPage.includes("error: opportunitiesError"), "admin opportunities page must retain query errors");
assert.ok(opportunitiesPage.includes('role="alert"'), "admin opportunities page must surface query failures");
assert.ok(opportunitiesPage.includes("!opportunitiesError && !opportunities?.length"), "admin opportunities page must not claim there is no data when the query failed");

const harvestPage = read("app/admin/harvest/page.tsx");
assert.ok(harvestPage.includes('requireAdminPage("harvest.read")'), "harvest admin page must remain read-only");
assert.ok(!harvestPage.includes("admin_moderate_harvest_listing"), "Sell My Harvest must not expose admin approval actions");
assert.ok(!harvestPage.includes('name="action"'), "Sell My Harvest admin overview must not offer moderation decisions");

const orderMigration = read("supabase/migrations/20261026233500_harden_marketplace_order_transitions.sql");
assert.ok(orderMigration.includes("Invalid order status transition"), "marketplace order RPC must reject invalid state transitions");
assert.ok(orderMigration.includes("v_order.buyer_id = v_uid"), "marketplace order RPC must distinguish buyer from seller permissions");
assert.ok(orderMigration.includes("v_order.farmer_id = v_uid"), "marketplace order RPC must enforce seller ownership");
assert.ok(orderMigration.includes("p_status = 'cancelled' AND v_old_status IN ('pending', 'processing')"), "inventory must only be restored for pre-shipment cancellations");
assert.ok(orderMigration.includes("A refund does not"), "refund must not automatically restock inventory");
assert.ok(orderMigration.includes("REVOKE ALL ON FUNCTION public.set_marketplace_order_status(uuid, text) FROM PUBLIC, anon"), "order status RPC must not be executable by anonymous users");

const harvestMigration = read("supabase/migrations/20261030183612_reconcile_harvest_immediate_publication.sql");
assert.ok(harvestMigration.includes("private.is_admin()"), "Harvest admin policies must use the Production private admin helper");
assert.ok(harvestMigration.includes("CREATE OR REPLACE FUNCTION private.admin_moderate_harvest_listing"), "legacy admin UI must retain a compatible visibility RPC");
assert.ok(harvestMigration.includes("CREATE OR REPLACE FUNCTION public.admin_moderate_harvest_listing"), "public RPC must forward to the compatibility implementation");
assert.ok(harvestMigration.includes("moderation_status = 'approved'"), "legacy harvest listings must be normalized to immediately published");
assert.ok(harvestMigration.includes("USING (status = 'available')"), "public harvest RLS must not require admin approval");
assert.ok(harvestMigration.includes("IF NOT NEW.contact_phone_public"), "publication trigger must preserve phone-publication consent");

const articleGenerator = read("app/api/admin/article/generate/route.ts");
assert.ok(articleGenerator.includes('replace(/\\s+/g, "-")'), "article slug generation must normalize actual whitespace");
assert.ok(/### \$\{keyword\} কী\?\n\n/.test(articleGenerator), "article markdown must contain real line breaks rather than literal backslash-n sequences");

const articleReview = read("app/admin/articles/[id]/page.tsx");
assert.ok(articleReview.includes("supabase.auth.getUser()"), "article review page must verify the session");
assert.ok(articleReview.includes('profileError || profile?.role !== "admin"'), "article review page must fail closed for non-admin users");

const sharedGuardPages = [
  ["app/admin/page.tsx", "dashboard.read"],
  ["app/admin/products/page.tsx", "catalog.read"],
  ["app/admin/categories/page.tsx", "catalog.read"],
  ["app/admin/transport/page.tsx", "transport.read"],
  ["app/admin/jobs/page.tsx", "jobs.read"],
  ["app/admin/users/page.tsx", "users.read"],
  ["app/admin/settings/page.tsx", "settings.read"],
];
for (const [path, capability] of sharedGuardPages) {
  const source = read(path);
  assert.ok(source.includes(`requireAdminPage(capability)`), `${path} must delegate to the shared authorization boundary`);
  assert.ok(source.includes(`async function requireAdmin(capability: AdminCapability = "${capability}")`), `${path} must declare its default read capability`);
}

for (const path of [
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
assert.ok(opportunityApi.includes('requireAdminApi("content.read")'), "content opportunity reads must request content.edit");
assert.ok(opportunityApi.includes('requireAdminApi("content.publish")'), "content publication transitions must request content.publish");
assert.ok(!opportunityApi.includes("async function requireAdmin()"), "content opportunity API must use the shared guard rather than a local duplicate");
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
assert.ok(superAdminPage.includes('requireAdminPage(\n    "dashboard.read"'), "super admin hub must use the shared capability guard");
assert.ok(moduleDirectory.includes('type="search"'), "super admin directory must provide accessible module search");
assert.ok(moduleDirectory.includes("grid-cols-1") && moduleDirectory.includes("sm:grid-cols-2") && moduleDirectory.includes("xl:grid-cols-4"), "super admin directory must adapt from mobile to desktop");
assert.ok(moduleDirectory.includes("No matching admin tools"), "module search must have an empty state");

console.log("Admin authorization, read-only harvest overview, and publication-policy regression checks passed.");
