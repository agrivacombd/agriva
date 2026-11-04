#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required security file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const layout = read("app/admin/layout.tsx");
const authz = read("lib/admin/authz.ts");
const permissionService = read("lib/admin/permission-service.ts");
assert.ok(permissionService.includes('import type { AdminCapability } from "@/lib/admin/authz"'), "delegated permissions must use the canonical Admin capability type");
assert.match(permissionService, /const candidates = \[capability, \...\(ADMIN_CAPABILITY_ALIASES\[capability\] \?\? \[\]\)\]/, "delegated permission checks must start with the registered capability before explicit aliases");
assert.match(permissionService, /p_capability: candidate/, "delegated permission checks must pass each registered or explicitly aliased capability unchanged");
assert.match(permissionService, /typeof data !== "boolean"/, "delegated permission RPC failures must fail closed");
assert.match(authz, /async function hasDelegatedCapability/, "shared guard must evaluate delegated database grants");
assert.match(authz, /profile\.role === "admin" && LEGACY_ADMIN_CAPABILITIES\.has\(capability\)/, "legacy Admin access must remain limited to the explicit allowlist");
assert.match(authz, /if \(!delegatedAllowed\) return \{ ok: false, reason: "forbidden" \}/, "missing delegated grants must be denied");
assert.match(authz, /ADMIN_CAPABILITY_ALIASES/, "shared authorization must resolve reviewed legacy permission aliases");
assert.match(authz, /"identity\.review": \["users\.verify"\]/, "identity permission alias must remain explicit");
assert.match(authz, /"catalog\.moderate": \["marketplace\.moderate", "plant_market\.moderate"\]/, "catalog moderation aliases must remain explicit");
for (const compatibilityCapability of ["users.verify", "plant_market.moderate", "marketplace.moderate", "farms.manage", "settings.manage", "system.recovery"]) {
  assert.ok(authz.includes(`"${compatibilityCapability}"`), `shared Admin capability registry must retain ${compatibilityCapability}`);
}
const adminDashboard = read("app/admin/page.tsx");
const ordersPage = read("app/admin/orders/page.tsx");
const controlCenterNav = read("components/admin/AdminControlCenterNav.tsx");
const marketplaceAdmin = read("app/admin/marketplace/page.tsx");
const adminUsers = read("app/admin/users/page.tsx");
const identityQueue = read("app/admin/identity-verification/page.tsx");
const adminShell = read("components/admin/AdminControlCenterShell.tsx");
const adminProducts = read("app/admin/products/page.tsx");
const adminProductPage = read("app/marketplace/[productId]/page.tsx");
const marketplaceSlugMigration = read("supabase/migrations/20261104120000_marketplace_slug_history_and_admin_rpc.sql");
const plantMarketEditor = read("app/admin/plant-market/page.tsx");
const plantMarketManager = read("components/admin/PlantMarketProductManager.tsx");
const plantMarketManageApi = read("app/api/admin/plant-market-products/manage/route.ts");
const adminFinanceForwardMigration = read("supabase/migrations/20261104110000_forward_harden_admin_finance_and_order_rpcs.sql");
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
assert.match(adminProducts, /admin_update_product_slug/, "Marketplace slug edits must use the audited slug RPC");
assert.match(adminProducts, /marketplace_product_slug_redirects/, "Admin must verify slug-history migration availability");
assert.match(adminProductPage, /marketplace_product_slug_redirects/, "Public product lookup must resolve historical slugs");
assert.match(adminProductPage, /if \(normalizeSlug\(productId\) !== product\.slug\) redirect/, "Historical slug requests must redirect to canonical product URLs");
assert.match(marketplaceSlugMigration, /CHECK \(length\(old_slug\) BETWEEN 1 AND 255\)/, "Slug history must preserve existing Unicode legacy slugs");
assert.match(marketplaceSlugMigration, /GRANT EXECUTE ON FUNCTION public\.admin_update_product_slug\(uuid, text\) TO authenticated/, "Slug mutation RPC must be callable only by authenticated Admin sessions");
assert.doesNotMatch(marketplaceSlugMigration, /TO authenticated, service_role/, "Slug mutation RPC must not grant a service-role bypass");
assert.match(marketplaceSlugMigration, /GRANT SELECT \(old_slug, product_id\) ON TABLE public\.marketplace_product_slug_redirects TO anon, authenticated/, "Public slug lookup must not expose audit actor or timestamp columns");
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
assert.match(plantMarketEditor, /requireAdminPage\("catalog\.read"\)/, "Plant Market editor must require catalog read access");
assert.match(plantMarketEditor, /from\("plant_market_products"\)/, "Plant Market editor must query its own product domain");
assert.match(plantMarketManageApi, /requireAdminApi\("catalog\.edit"\)/, "Plant Market edits must require catalog edit permission");
assert.match(plantMarketManageApi, /createClient\(supabaseUrl, serviceRoleKey/, "Plant Market writes must use a server-only audit client");
assert.match(plantMarketManageApi, /admin_audit_log/, "Plant Market writes must record an audit event");
assert.ok(plantMarketManageApi.indexOf('from("admin_audit_log").insert') < plantMarketManageApi.indexOf('from("plant_market_products").update'), "Plant Market audit intent must be recorded before product mutation");
assert.doesNotMatch(plantMarketManageApi, /image_url\\s*:/, "Plant Market editor must not bypass the pending Admin media-upload policy review");
assert.match(plantMarketManageApi, /status === "active"/, "Active Plant Market edits must preserve seller verification and create-grant checks");
assert.match(plantMarketManageApi, /category_slug: categorySlug/, "Plant Market category label and slug must be updated together");
assert.match(plantMarketManageApi, /price <= 0/, "Plant Market price must satisfy the Production positive-price constraint");
assert.match(adminUsers, /requireAdmin\("roles\.grant"\)/, "User role changes must require the separate role-grant capability");
assert.match(adminUsers, /name="q"/, "User management must provide server-side name search");
assert.match(adminUsers, /md:hidden/, "User management must provide mobile-friendly cards");
assert.match(adminUsers, /Protected admin/, "Admin accounts must remain protected from routine role changes");
assert.match(identityQueue, /notice=reason/, "Identity rejection must require a reason without throwing a server error");
assert.match(identityQueue, /notice=error/, "Identity review failures must return an actionable UI notice");
assert.match(identityQueue, /min-h-11/, "Identity review actions must meet mobile touch-target sizing");
assert.match(plantMarketManageApi, /\["piece", "pot", "pack", "tray"\]/, "Plant Market units must match the Production check constraint");
assert.match(plantMarketManager, /Slug ও publication status আলাদা moderation workflow-এ থাকবে/, "Plant Market editor must not mutate slug or publication status");
assert.match(plantMarketManager, /Primary image · read only/, "Plant Market media must remain read-only until Admin upload access is reviewed");
assert.match(controlCenterNav, /href: "\/admin\/plant-market", capability: "catalog\.edit"/, "Plant Market editor must be capability-filtered in navigation");

for (const match of controlCenterNav.matchAll(/href: "(\/admin(?:\/[a-z-]+)?)"/g)) {
  const href = match[1];
  const routeFile = href === "/admin" ? "app/admin/page.tsx" : `app${href}/page.tsx`;
  assert.ok(existsSync(routeFile), `Admin navigation must not link to a missing route: ${href}`);
}
assert.match(adminDashboard, /requireAdmin\("payments\.reconcile"\)/, "commission approval must require a finance capability");
assert.match(adminDashboard, /requireAdmin\("payouts\.approve"\)/, "payout approval must require an explicit high-risk capability");
assert.match(adminDashboard, /getAvailableAdminCapabilities\(\["payments\.read", "payments\.reconcile", "payouts\.read", "payouts\.approve", "orders\.read", "orders\.transition"/, "finance data and actions must be scoped to explicitly granted capabilities");
assert.ok(adminDashboard.includes('c.status === "pending" && (canApproveCommissions ? <form action={approveCommission}'), "commission approval UI must remain behind the disabled mutation capability");
assert.ok(adminDashboard.includes('p.status === "requested" && (canManagePayouts ? <form action={approvePayout}'), "payout approval UI must remain behind the disabled mutation capability");
assert.ok(adminDashboard.includes('canManagePayouts ? <form action={completePayout}'), "payout completion UI must remain behind the disabled mutation capability");


for (const signature of [
  "public.approve_reseller_commission(uuid)",
  "private.approve_reseller_commission(uuid)",
  "public.approve_commission_payout(uuid)",
  "private.approve_commission_payout(uuid)",
  "public.complete_commission_payout(uuid, text)",
  "private.complete_commission_payout(uuid, text)",
  "public.record_cod_collection(uuid, numeric, text)",
]) {
  assert.ok(adminFinanceForwardMigration.includes(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated, service_role`), `forward migration must disable direct client execution of ${signature}`);
}
assert.match(adminFinanceForwardMigration, /p_status NOT IN \('processing', 'shipped', 'delivered', 'completed', 'cancelled'\)/, "order status RPC must exclude refunds until a separate workflow exists");
assert.match(adminFinanceForwardMigration, /REVOKE ALL ON FUNCTION private\.set_marketplace_order_status\(uuid, text\) FROM PUBLIC, anon, authenticated, service_role/, "clients must not bypass the public order transition wrapper");
assert.match(adminFinanceForwardMigration, /v_old_status = 'pending' AND p_status IN \('processing', 'cancelled'\)/, "admin order transitions must follow the explicit state machine");
assert.doesNotMatch(adminFinanceForwardMigration, /'refunded'/i, "forward order RPC must not accept direct refund status");
assert.match(adminDashboard, /orderTransitionOptions\[order\.status\]/, "Dashboard actions must show only state-machine-valid next statuses");
assert.match(ordersPage, /orderTransitionOptions\[status\]/, "Order operations must show only state-machine-valid next statuses");
assert.doesNotMatch(ordersPage, /value="refunded"/, "routine order UI must not expose direct refunds");

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

assert.ok(ordersPage.includes('requireAdmin("orders.transition")'), "Order status updates must require the orders.transition capability");
assert.ok(ordersPage.includes('requireAdmin("payments.reconcile")'), "COD collection must require the separate payments.reconcile capability");
assert.ok(ordersPage.includes("canReconcilePayments"), "COD collection UI must be hidden without the dedicated finance capability");
assert.ok(ordersPage.includes('requireAdmin("orders.read")'), "Order operations must use the shared read capability");
assert.ok(ordersPage.includes("checkoutIds.length && canReadPayments"), "COD ledger reads must be skipped without payments.read");
assert.ok(ordersPage.includes("orderTransitionOptions[status]"), "Order operations must hide controls when no valid transition exists");
assert.ok(adminDashboard.includes('getAvailableAdminCapabilities(["payments.read", "payments.reconcile", "payouts.read", "payouts.approve", "orders.read", "orders.transition"'), "Dashboard finance data must be capability-gated");
assert.ok(adminDashboard.includes("canReadPayments ? supabase.from"), "Commission queries must be skipped without finance read permission");
assert.ok(adminDashboard.includes("canReadPayouts ? supabase.from"), "Payout queries must be skipped without payout read permission");
assert.ok(adminDashboard.includes('const canReadPayments = availableAdminCapabilities.has("payments.read")'), "Finance reads must require payments.read, not a mutation capability");
assert.ok(adminDashboard.includes('const canReadPayouts = availableAdminCapabilities.has("payouts.read")'), "Payout reads must require payouts.read, not a mutation capability");
assert.ok(adminDashboard.includes("const FINANCE_MUTATIONS_ENABLED = false"), "Legacy finance mutations must remain disabled until audited service RPCs exist");
assert.ok(adminDashboard.includes("if (!FINANCE_MUTATIONS_ENABLED) redirect"), "Direct Server Action invocation must also fail closed");
assert.ok(ordersPage.includes("const FINANCE_MUTATIONS_ENABLED = false"), "COD mutation must remain disabled until audited service RPCs exist");
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

assert.doesNotMatch(controlCenterNav, /planned: \["Slug redirects"/, "Implemented Marketplace slug redirects must not remain in the planned list");
const adminAuditMigration = read("supabase/migrations/20261104130000_audit_admin_moderation_and_access_revocation.sql");
assert.ok(adminAuditMigration.includes("'green_exchange.listing.moderated'"), "Green Exchange moderation must write an admin audit event");
assert.ok(adminAuditMigration.includes("'admin.module_access.revoked'"), "Module access revocation must write an admin audit event");
assert.ok(adminAuditMigration.includes("'revoked_grants', v_grant_count"), "Access revocation audit must record affected grant count");
assert.ok(adminAuditMigration.includes("'withdrawn_applications', v_application_count"), "Access revocation audit must record withdrawn application count");
assert.ok(adminAuditMigration.includes("p_user_id IS NULL") && adminAuditMigration.includes("p_module IS NULL"), "Access revocation RPC must reject null identity and module input");
assert.ok(adminAuditMigration.includes("GRANT EXECUTE ON FUNCTION public.admin_moderate_green_exchange_listing(uuid, text) TO authenticated, service_role"), "Green Exchange moderation must retain authenticated Admin and trusted server execution");
assert.ok(adminAuditMigration.includes("GRANT EXECUTE ON FUNCTION public.admin_revoke_market_access(uuid, text, uuid) TO authenticated, service_role"), "Module access revocation must retain authenticated Admin and trusted server execution");

const contentPublishingMigration = read("supabase/migrations/20261104140000_forward_restore_content_publishing_and_revisions.sql");
assert.ok(contentPublishingMigration.includes("content_drafts_public_published_articles_read"), "published article access must use an explicit public-read policy");
assert.ok(contentPublishingMigration.includes("USING (status = 'published' AND content_type = 'article')"), "public article RLS must expose only published articles");
assert.ok(contentPublishingMigration.includes("GRANT SELECT (") && contentPublishingMigration.includes("TO anon;"), "anonymous article reads must be column-scoped");
assert.ok(contentPublishingMigration.includes("FROM PUBLIC, anon, authenticated"), "content draft privileges must not inherit broad public table SELECT");
assert.doesNotMatch(contentPublishingMigration.split("TO anon;")[0].split("GRANT SELECT (")[1] ?? "", /created_by|reviewed_by|opportunity_id|competitor_analysis/, "anonymous readers must not receive editorial planning or actor columns");
assert.ok(contentPublishingMigration.includes("content_draft_revisions"), "content revision history table must be provisioned");
assert.ok(contentPublishingMigration.includes("content_draft_revision_capture"), "content edits and moderation transitions must capture before-images");
assert.ok(contentPublishingMigration.includes("content_drafts_workflow_guard"), "content workflow transitions must be enforced by the database");
assert.ok(contentPublishingMigration.includes("(OLD.status = 'published' AND NEW.status = 'review')"), "published articles must support explicit unpublish back to review");
assert.ok(contentPublishingMigration.includes("Unpublish first; edit content after it returns to review"), "unpublishing must not permit content edits in the same transition");
assert.ok(contentPublishingMigration.includes("NEW.reviewed_by := auth.uid()"), "editorial approvals and rejections must bind the reviewer to the current actor");
const publishedArticleReader = read("lib/content/published-articles.ts");
assert.ok(publishedArticleReader.includes("persistSession: false"), "public article reader must use an anonymous client without visitor session");
assert.ok(publishedArticleReader.includes('.eq("status", "published")') && publishedArticleReader.includes('.eq("content_type", "article")'), "public article reader must filter published article rows");
const publicBlog = read("app/blog/page.tsx");
const publicArticle = read("app/blog/[slug]/page.tsx");
assert.ok(publicBlog.includes("getPublishedContentArticles"), "blog listing must include published CMS articles");
assert.ok(publicArticle.includes("getPublishedContentArticleBySlug") && publicArticle.includes("dynamicParams = true"), "published CMS articles must resolve by dynamic public slug");
const contentDraftClient = read("app/admin/content-drafts/ContentDraftsClient.tsx");
assert.ok(!contentDraftClient.includes('from("content_drafts").select("*")'), "admin content editor must request only explicitly granted columns");


const adminRoleGrantMigration = read("supabase/migrations/20261104150000_admin_role_grant_security.sql");
assert.ok(adminRoleGrantMigration.includes("REVOKE INSERT, UPDATE, DELETE ON TABLE"), "direct authenticated RBAC table writes must be revoked");
assert.ok(adminRoleGrantMigration.includes("public.admin_grant_user_role"), "role grants must use the audited RPC");
assert.ok(adminRoleGrantMigration.includes("public.admin_revoke_user_role"), "role revocations must use the audited RPC");
assert.ok(adminRoleGrantMigration.includes("private.has_admin_permission('roles.grant')"), "role mutation must require the roles.grant capability");
assert.ok(adminRoleGrantMigration.includes("r.role_key = 'super_admin'"), "delegated roles.grant alone must not authorize RBAC administration");
assert.ok(adminRoleGrantMigration.includes("p_user_id = v_actor"), "self-grant and self-revoke must be rejected");
assert.ok(adminRoleGrantMigration.includes("'admin.role.granted'") && adminRoleGrantMigration.includes("'admin.role.revoked'"), "role grant and revoke must write audit events transactionally");
assert.ok(adminRoleGrantMigration.includes("'expires_at', p_expires_at"), "role grant audit must capture expiry");
assert.ok(adminRoleGrantMigration.includes("Cannot revoke the last active Super Admin"), "the final active Super Admin must be protected");
assert.ok(adminRoleGrantMigration.includes("GRANT EXECUTE ON FUNCTION public.admin_grant_user_role(uuid, text, timestamptz) TO authenticated"), "authenticated role grant must be limited to the checked RPC");
assert.ok(adminRoleGrantMigration.includes("GRANT EXECUTE ON FUNCTION public.admin_revoke_user_role(uuid, text) TO authenticated"), "authenticated role revoke must be limited to the checked RPC");

console.log("Admin authorization, RBAC grant security, read-only harvest overview, and publication-policy regression checks passed.");
