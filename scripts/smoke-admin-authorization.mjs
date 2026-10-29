#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required security file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const layout = read("app/admin/layout.tsx");
assert.ok(layout.includes('authorizePermission("roles.assign_scoped")'), "admin layout must require a platform administration capability");
assert.ok(layout.includes("if (!auth.ok)"), "admin layout must fail closed when capability lookup fails");
assert.ok(!layout.includes('profile?.role !== "admin"'), "admin layout must not block membership-based super_admin access");

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
  assert.ok(/auth\.getUser\(\)|authorizePermission\(/.test(source), `${path} must verify the server session directly or through the shared capability helper`);
  assert.ok(/profiles|authorizePermission\(/.test(source), `${path} must verify role/capability authorization`);
  assert.ok(/role|authorizePermission\(/.test(source), `${path} must check authorization, not just authentication`);
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
  assert.ok(/auth\.getUser\(\)|authorizePermission\(/.test(source), `${path} must verify the server session directly or through the shared capability helper`);
  assert.ok(/profiles|authorizePermission\(/.test(source), `${path} must verify role/capability authorization`);
  assert.ok(/role|authorizePermission\(/.test(source), `${path} must check a role/capability`);
}

for (const path of [
  "app/admin/page.tsx",
  "app/admin/products/page.tsx",
  "app/admin/categories/page.tsx",
  "app/admin/harvest/page.tsx",
  "app/admin/jobs/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/settings/page.tsx",
]) {
  const source = read(path);
  assert.match(source, /"use server"/, `${path} expected to contain server actions`);
  assert.match(source, /requireAdmin\(/, `${path} server actions must call a server-side admin guard`);
}

const contentDraftRlsMigration = read("supabase/migrations/20261029230000_align_content_draft_rls_with_capabilities.sql");
const roleMembershipWriteLock = read("supabase/migrations/20261029310000_lock_direct_role_membership_writes.sql");
const staleAdminMembershipGuard = read("supabase/migrations/20261029320000_prevent_role_rpc_from_leaving_stale_admin_memberships.sql");
const staffRoleRevocationGuard = read("supabase/migrations/20261029330000_revoke_staff_role_from_profile_and_membership.sql");
assert.ok(staffRoleRevocationGuard.includes("public.has_platform_admin_access()"), "staff-role changes must require platform-admin authorization");
assert.ok(staffRoleRevocationGuard.includes("DELETE FROM public.user_role_memberships"), "staff-role revocation must remove the membership grant");
assert.ok(staffRoleRevocationGuard.includes("IF previous_profile_role = p_role THEN"), "staff-role revocation must also inspect legacy profile-role grants");
assert.ok(staffRoleRevocationGuard.includes("SET role = 'farmer', updated_at = now()"), "revoking a primary staff profile role must remove the stale grant");
assert.ok(staffRoleRevocationGuard.includes("'profile_role_before', previous_profile_role"), "staff-role revocation audit must capture profile-role transition");
assert.ok(staleAdminMembershipGuard.includes("public.has_platform_admin_access()"), "role RPC must use the shared platform-admin guard");
assert.ok(staleAdminMembershipGuard.includes("p_role IS NULL"), "role RPC must reject a null role explicitly");
assert.ok(staleAdminMembershipGuard.includes("m.role IN ('admin', 'super_admin')"), "limited role RPC must not demote accounts with privileged memberships");
assert.ok(staleAdminMembershipGuard.includes("dedicated platform-admin revocation workflow"), "privileged account role changes must use a dedicated revocation workflow");
assert.match(roleMembershipWriteLock, /REVOKE INSERT, UPDATE, DELETE ON TABLE public\.user_role_memberships FROM authenticated/, "authenticated users must not mutate role memberships directly");
assert.match(roleMembershipWriteLock, /GRANT SELECT ON TABLE public\.user_role_memberships TO authenticated/, "authenticated users must retain membership reads");
assert.match(roleMembershipWriteLock, /admin_set_staff_role \/ role RPC audit/, "role membership writes must use audited RPCs");
assert.ok(contentDraftRlsMigration.includes("content_drafts_capability_read"), "content drafts must be readable by explicitly authorized content roles");
assert.ok(contentDraftRlsMigration.includes("content_drafts_review_update"), "draft mutations must be limited to review-capable roles");
assert.ok(contentDraftRlsMigration.includes("content_draft_revisions_admin_read"), "draft revision history must be restricted to review-capable roles");
assert.ok(contentDraftRlsMigration.includes("public.user_role_memberships"), "content draft RLS must support membership-based roles");

const orderCsvRoute = read("app/admin/reports/orders.csv/route.ts");
assert.ok(orderCsvRoute.includes('authorizePermission("finance.export_orders")'), "order CSV export must require the dedicated finance.export_orders capability");
assert.ok(orderCsvRoute.includes("candidate.startsWith(prefix)"), "order CSV export must neutralize spreadsheet formula prefixes in untrusted cell values");

const searchIntelligencePage = read("app/admin/search-intelligence/page.tsx");
assert.ok(searchIntelligencePage.includes('authorizePermission(permission)'), "search intelligence must use shared capability authorization");
assert.ok(searchIntelligencePage.includes('requireAdmin("content.draft")'), "creating drafts from search intelligence must require content.draft");
assert.ok(!searchIntelligencePage.includes('profile?.role !== "admin"'), "search intelligence must not rely on a legacy profile role");
assert.ok(searchIntelligencePage.includes('from("content_opportunities")'), "search intelligence must use persisted canonical opportunities, not in-memory seed data");
assert.ok(searchIntelligencePage.includes('rpc("create_content_draft_from_opportunity"'), "creating an opportunity draft must use the database-backed workflow");
assert.ok(searchIntelligencePage.includes('item.status === "approved" && <form action={createDraft}'), "only approved opportunities may be converted to saved drafts from Search Intelligence");
assert.ok(searchIntelligencePage.includes('async function requireAdmin(permission: "content.review" | "content.draft"'), "search intelligence server actions must re-check the specific content capability");
assert.ok(searchIntelligencePage.includes('const transitions: Record<string, string[]>'), "search intelligence must enforce the same explicit opportunity transition map");
assert.ok(searchIntelligencePage.includes('.eq("id", id).eq("status", current.status)'), "search intelligence updates must guard against stale opportunity state");
assert.ok(!searchIntelligencePage.includes("score,created_at,last_seen_at"), "search intelligence query must not request a nonexistent score column");
const aiContentDashboard = read("components/admin/AIContentDashboard.tsx");
assert.ok(aiContentDashboard.includes("/admin/content-drafts"), "AI content hub must link to saved drafts");
assert.ok(aiContentDashboard.includes("no longer creates fake local-only drafts"), "AI content hub must clearly disclose that generation is not persisted");
assert.ok(!aiContentDashboard.includes("setDrafts"), "AI content hub must not imply local-only drafts are persisted");
const adminDashboard = read("app/admin/page.tsx");
assert.ok(adminDashboard.includes('authorizePermission("roles.assign_scoped")'), "admin dashboard must authorize platform admins through membership-aware capabilities");
assert.ok(!adminDashboard.includes('profile?.role !== "admin"'), "admin dashboard must not rely on the legacy single-profile role");
assert.ok(adminDashboard.includes('from("content_drafts")'), "Super Admin dashboard must include persisted SEO content drafts");
assert.ok(adminDashboard.includes('from("article_drafts")'), "Super Admin dashboard must include the legacy article draft queue");
assert.ok(adminDashboard.includes("Content draft activity"), "Super Admin dashboard must surface recent SEO content drafts");
assert.ok(adminDashboard.includes("Legacy article drafts"), "Super Admin dashboard must surface recent legacy article drafts");
assert.ok(adminDashboard.includes('select("id", { count: "exact", head: true }).in("status", ["pending", "processing"])'), "pending order metrics must count the full queue, not only recent orders");

const productStatusGuardMigration = read("supabase/migrations/20261029300000_align_product_status_guard_with_scoped_moderation.sql");
assert.ok(productStatusGuardMigration.includes("public.has_platform_admin_access()"), "product status guard must recognize shared platform-admin access");
assert.ok(productStatusGuardMigration.includes("public.has_product_moderation_permission()"), "product status guard must allow the scoped moderation trigger to validate moderator status changes");
assert.ok(productStatusGuardMigration.includes("TG_OP = 'INSERT'") && productStatusGuardMigration.includes("Only a platform administrator may publish a product on insert"), "scoped moderators must not bypass insert-time publication restrictions");
assert.ok(productStatusGuardMigration.includes("enforce_seller_product_moderation()"), "product status guard must rely on the scoped trigger for moderator ownership, transition and audit checks");
const productModerationAdminHelperMigration = read("supabase/migrations/20261029280000_use_platform_admin_helper_in_product_moderation.sql");
assert.ok(productModerationAdminHelperMigration.includes("public.has_platform_admin_access();"), "product moderation must use the shared platform-admin helper for profile and membership roles");
assert.ok(productModerationAdminHelperMigration.includes("Could not align platform-admin check in enforce_seller_product_moderation"), "product trigger migration must fail closed if its expected guard cannot be aligned");
assert.ok(productModerationAdminHelperMigration.includes("Could not align platform-admin check in admin_moderate_marketplace_product"), "product moderation RPC migration must fail closed if its expected guard cannot be aligned");
const auditLogRlsMigration = read("supabase/migrations/20261029290000_align_audit_log_rls_with_platform_admin_helper.sql");
assert.ok(auditLogRlsMigration.includes("USING (public.has_platform_admin_access())"), "audit-log read RLS must use the shared platform-admin helper");
assert.ok(!/FOR (?:INSERT|UPDATE|DELETE|ALL)/i.test(auditLogRlsMigration), "audit-log alignment migration must not introduce write policies");
const superAdminProfileMigration = read("supabase/migrations/20261029270000_align_platform_admin_helpers_with_super_admin_profile.sql");
assert.ok(superAdminProfileMigration.includes("p.role IN ('admin', 'super_admin')"), "database platform-admin helper must recognize a protected super_admin profile role");
assert.ok(superAdminProfileMigration.includes("m.role IN ('admin', 'super_admin')"), "database platform-admin helper must retain membership-based platform admin access");
assert.ok(superAdminProfileMigration.includes("public.has_product_moderation_permission()"), "product moderation helper must be aligned with the protected super_admin profile role");
const attributionInputMigration = read("supabase/migrations/20261029260000_validate_attribution_rpc_inputs.sql");
assert.ok(attributionInputMigration.includes("p_days IS NULL OR p_days < 1 OR p_days > 30"), "attribution RPC must reject null or out-of-range attribution windows");
assert.ok(attributionInputMigration.includes("length(p_code) > 64"), "attribution RPC must bound referral code input");
assert.ok(attributionInputMigration.includes("p_product_id IS NULL"), "attribution RPC must reject missing product IDs");
assert.ok(attributionInputMigration.includes("p_visitor_token !~ '[^[:space:]]'"), "attribution RPC must reject whitespace-only visitor tokens");
assert.ok(attributionInputMigration.includes("GRANT EXECUTE ON FUNCTION public.record_attribution_session(text, text, uuid, integer) TO anon, authenticated"), "attribution RPC must preserve intended referral redirect access");
const sslCommerzIpn = read("app/api/payment/sslcommerz/ipn/route.ts");
assert.ok(sslCommerzIpn.includes('String(validated?.store_id || "") !== process.env.SSLCOMMERZ_STORE_ID'), "SSLCommerz IPN must verify the validation response belongs to the configured merchant store");
const legacyArticleGenerate = read("app/api/admin/article/generate/route.ts");
assert.ok(legacyArticleGenerate.includes('from("content_opportunities")'), "legacy article generation must verify linked opportunity state");
assert.ok(legacyArticleGenerate.includes('opportunity.status !== "approved"'), "legacy article generation must reject unapproved opportunities");
assert.ok(legacyArticleGenerate.includes("A valid approved opportunityId is required"), "legacy article generation must require a valid opportunity ID");
assert.ok(legacyArticleGenerate.includes('select("id,keyword,status")'), "legacy article generation must load the canonical opportunity keyword");
assert.ok(legacyArticleGenerate.includes("suppliedKeyword !== keyword"), "legacy article generation must reject keywords that differ from the approved opportunity");
assert.ok(legacyArticleGenerate.includes("const keyword = opportunity.keyword.trim()"), "legacy article generation must use the database-owned opportunity keyword");
const publicationInvariant = read("supabase/migrations/20261029250000_enforce_content_draft_publication_in_database.sql");
assert.ok(publicationInvariant.includes("BEFORE UPDATE OF status ON public.content_drafts"), "database must enforce content draft publication invariants");
assert.ok(publicationInvariant.includes("OLD.status IS DISTINCT FROM 'approved'"), "database must reject publication unless the previous status was approved");
assert.ok(publicationInvariant.includes("valid slug, and body"), "database must reject publication without required content fields");
assert.ok(publicationInvariant.includes("REVOKE ALL ON FUNCTION public.enforce_content_draft_publication() FROM PUBLIC, anon, authenticated"), "publication trigger function must not be directly executable by client roles");

const staffRoleConstraint = read("supabase/migrations/20261029240000_allow_controlled_staff_role_memberships.sql");
for (const role of ["operations", "product_moderator", "content_seo_manager", "marketing_manager", "finance_manager", "support_agent", "agronomist"]) {
  assert.ok(staffRoleConstraint.includes(`'${role}'`), `membership constraint must allow the controlled ${role} role`);
}
assert.ok(!staffRoleConstraint.includes("'super_admin'"), "super_admin must not be added without its separate owner-controlled grant path");
const staffRoleAssignment = read("supabase/migrations/20261029160000_staff_role_assignment.sql");
assert.ok(staffRoleAssignment.includes("public.is_admin()"), "staff role assignment must remain restricted to platform admins");

const permissionMap = read("lib/auth/permissions.ts");
assert.ok(permissionMap.includes('| "finance.read_reports"'), "finance.read_reports must be part of the capability catalogue");
assert.ok(permissionMap.includes('finance_manager: [...ownAccount, "finance.read_scoped", "finance.export_orders", "finance.read_reports"'), "finance managers must have explicit financial report access");
assert.ok(permissionMap.includes('"finance.read_reports", "payout.review"'), "platform admin roles must have explicit financial report access");

const reportsPage = read("app/admin/reports/page.tsx");
assert.ok(reportsPage.includes('authorizePermission("finance.read_reports")'), "financial reports must require the dedicated finance.read_reports capability");
assert.ok(!reportsPage.includes('profile?.role !== "admin"'), "admin reports must not rely on a legacy profile role");
assert.ok(reportsPage.includes("errors.length === 0 ?"), "admin report metrics must be hidden if any source query fails");
assert.ok(reportsPage.includes("ডেটা অসম্পূর্ণ থাকায় ভুল সারাংশ এড়াতে"), "admin reports must explain why incomplete metrics are withheld");

const ordersPage = read("app/admin/orders/page.tsx");
assert.ok(ordersPage.includes('authorizePermission("orders.support_read")'), "admin orders must require orders.support_read through the shared capability helper");
assert.ok(!ordersPage.includes('profile?.role !== "admin"'), "admin orders must not reject membership-authorized super admins");
assert.ok(ordersPage.includes("error: ordersError"), "admin orders page must retain query errors");
assert.ok(ordersPage.includes('role="alert"'), "admin orders page must surface query failures instead of presenting an empty state");
assert.ok(ordersPage.includes("{!ordersError && !orders?.length"), "admin orders page must not show an empty state when the query failed");

const greenExchangePage = read("app/admin/green-exchange/page.tsx");
assert.ok(greenExchangePage.includes('authorizePermission("exchange.moderate")'), "green exchange moderation must use its dedicated capability guard");
assert.ok(!greenExchangePage.includes('profile?.role !== "admin"'), "green exchange moderation must not depend on a legacy profile-role gate");

const aiContentPage = read("app/admin/ai-content/page.tsx");
assert.ok(aiContentPage.includes('authorizePermission("roles.assign_scoped")'), "AI content admin hub must use the shared capability guard");
assert.ok(!aiContentPage.includes('profile?.role !== "admin"'), "AI content admin hub must not depend on a legacy profile-role gate");

const opportunitiesPage = read("app/admin/opportunities/page.tsx");
assert.ok(opportunitiesPage.includes("error: opportunitiesError"), "admin opportunities page must retain query errors");
assert.ok(opportunitiesPage.includes('role="alert"'), "admin opportunities page must surface query failures");
assert.ok(opportunitiesPage.includes("!opportunitiesError && !opportunities?.length"), "admin opportunities page must not claim there is no data when the query failed");

const harvestPage = read("app/admin/harvest/page.tsx");
assert.ok(harvestPage.includes('(action === "rejected" && !note)'), "harvest moderation must require a reason when rejecting a listing");
assert.ok(harvestPage.includes("প্রত্যাখ্যান করলে আবশ্যক"), "harvest moderation UI must explain that rejection requires a reason");
assert.ok(harvestPage.includes('supabase.rpc("admin_moderate_harvest_listing"'), "harvest moderation must use the audited admin-only RPC");
assert.ok(!harvestPage.includes('.from("harvest_listings").update('), "harvest moderation must not directly update the table from the page");

const contentDraftMembershipMigration = read("supabase/migrations/20261029223000_align_content_draft_rpcs_with_role_memberships.sql");
assert.ok(contentDraftMembershipMigration.includes("create_content_draft_from_opportunity"), "content draft RPC migration must update the legacy opportunity-draft RPC");
assert.ok(contentDraftMembershipMigration.includes("create_generated_content_draft_from_opportunity"), "content draft RPC migration must update the generated-draft RPC");
assert.ok(contentDraftMembershipMigration.includes("public.user_role_memberships"), "content draft RPCs must recognize role memberships, not only profiles.role");
assert.ok(contentDraftMembershipMigration.includes("'super_admin'") && contentDraftMembershipMigration.includes("'content_seo_manager'"), "content draft RPC membership guard must recognize delegated content roles");

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
assert.ok(articleReview.includes('authorizePermission("content.review")'), "article review page must require the content.review capability");
assert.ok(articleReview.includes("if (!auth.ok)"), "article review page must fail closed when capability authorization fails");
assert.ok(!articleReview.includes('profile?.role !== "admin"'), "article review page must not rely on the legacy single-profile role");

for (const [path, permission] of [
  ["app/admin/harvest/page.tsx", "roles.assign_scoped"],
  ["app/admin/jobs/page.tsx", "jobs.moderate"],
]) {
  const source = read(path);
  assert.ok(source.includes(`authorizePermission("${permission}")`), `${path} must use its explicit capability guard`);
  assert.ok(source.includes("if (!auth.ok)"), `${path} must fail closed on authorization lookup errors`);
  assert.ok(!source.includes('from("profiles").select("role")'), `${path} must not depend on a legacy profile-role gate`);
}

const categoryAdmin = read("app/admin/categories/page.tsx");
assert.ok(categoryAdmin.includes('authorizePermission("catalog.create_platform")'), "category management must require catalog.create_platform");
assert.ok(categoryAdmin.includes("if (!auth.ok)"), "category management must fail closed on permission lookup errors");
const opportunitiesAdmin = read("app/admin/opportunities/page.tsx");
assert.ok(opportunitiesAdmin.includes('authorizePermission("content.opportunities.read")'), "content opportunities must require content.opportunities.read");
assert.ok(opportunitiesAdmin.includes("if (!auth.ok)"), "content opportunities must fail closed on permission lookup errors");
const usersAdmin = read("app/admin/users/page.tsx");
assert.ok(usersAdmin.includes('authorizePermission("users.manage")'), "user management must require users.manage");
assert.ok(usersAdmin.includes("if (!auth.ok)"), "user management must fail closed on permission lookup errors");
const settingsAdmin = read("app/admin/settings/page.tsx");
assert.ok(settingsAdmin.includes('authorizePermission("settings.site.manage")'), "site configuration must require settings.site.manage");
assert.ok(settingsAdmin.includes("if (!auth.ok)"), "platform settings must fail closed on permission lookup errors");
const accessAdmin = read("app/admin/access/page.tsx");
assert.ok(accessAdmin.includes('authorizePermission("roles.assign_scoped")'), "staff access management must require roles.assign_scoped");
assert.ok(!accessAdmin.includes('auth.roles.includes("admin")'), "staff access management must not reject a valid super_admin membership after capability authorization");
const permissionsCatalogue = read("lib/auth/permissions.ts");
assert.ok(permissionsCatalogue.includes('"settings.site.manage"'), "site settings must have a distinct capability from integration and secret management");
assert.ok(permissionsCatalogue.includes('"settings.site.manage", "settings.integrations.manage"'), "only platform admin roles should receive site settings and integration capabilities");
const adminMembershipMigration = read("supabase/migrations/20261029200000_align_admin_rpcs_with_role_memberships.sql");
assert.ok(adminMembershipMigration.includes("CREATE OR REPLACE FUNCTION public.has_platform_admin_access()"), "admin membership migration must define a shared DB governance check");
assert.ok(adminMembershipMigration.includes("m.role IN ('admin', 'super_admin')"), "DB governance helper must accept only controlled admin memberships");
assert.ok(adminMembershipMigration.includes("admin_set_transport_partner_verification"), "transport verification RPC must use the DB governance check");
assert.ok(adminMembershipMigration.includes('"opportunities_admin_read" ON public.search_opportunities'), "content opportunity reads must be guarded by platform-admin RLS");
assert.ok(adminMembershipMigration.includes("FOR SELECT TO anon, authenticated"), "public category policy must remain evaluable for anonymous catalog reads");
assert.ok(adminMembershipMigration.includes("REVOKE ALL ON FUNCTION public.has_platform_admin_access() FROM PUBLIC, anon"), "helper must revoke default public execution before explicit grants");
const transportCapabilityAdmin = read("app/admin/transport/page.tsx");
assert.ok(transportCapabilityAdmin.includes('authorizePermission("transport.review")'), "transport verification must require transport.review");
assert.ok(transportCapabilityAdmin.includes("if (!auth.ok)"), "transport verification must fail closed on permission lookup errors");

const orderPayoutMembershipMigration = read("supabase/migrations/20261029213000_align_order_and_payout_rpcs_with_admin_memberships.sql");
for (const rpcName of ["set_marketplace_order_status", "approve_reseller_commission", "approve_commission_payout", "complete_commission_payout"]) {
  assert.ok(orderPayoutMembershipMigration.includes(rpcName), `order/payout RPC migration must align ${rpcName} with controlled admin memberships`);
}
assert.ok(orderPayoutMembershipMigration.includes("public.has_platform_admin_access()"), "order/payout RPC migration must use the shared membership-aware database guard");
assert.ok(orderPayoutMembershipMigration.includes("IF v_updated_definition IS DISTINCT FROM v_definition"), "order/payout RPC migration must only rewrite function definitions when a legacy guard is present");

const auditPage = read("app/admin/audit/page.tsx");
assert.ok(auditPage.includes('authorizePermission("audit.read")'), "audit page must enforce the audit.read capability");
assert.ok(auditPage.includes("if (!auth.ok)"), "audit page must fail closed when authorization lookup fails");
assert.ok(!auditPage.includes('profile?.role !== "admin"'), "audit page must not rely on a legacy single-profile role check");
const auditRlsMigration = read("supabase/migrations/20261029195000_align_audit_log_read_permissions.sql");
assert.ok(auditRlsMigration.includes('DROP POLICY IF EXISTS "audit_admin_read"'), "audit RLS migration must replace the legacy read policy");
assert.ok(auditRlsMigration.includes("m.role IN ('admin', 'super_admin')"), "audit RLS must support controlled admin memberships consistently with the server capability helper");
assert.ok(auditRlsMigration.includes("FOR SELECT"), "audit RLS change must grant read access only, not broaden write access");

const transportAdmin = read("app/admin/transport/page.tsx");
assert.ok(transportAdmin.includes("admin_set_transport_partner_verification"), "transport status changes must use the admin-only RPC");
const jobsAdmin = read("app/admin/jobs/page.tsx");
assert.ok(jobsAdmin.includes('authorizePermission("jobs.moderate")'), "job moderation must require its dedicated capability");
assert.ok(jobsAdmin.includes("admin_moderate_job_post"), "job status changes must use the admin-only RPC");
assert.ok(jobsAdmin.includes('!["published", "rejected", "paused", "filled"].includes(status)'), "job moderation must allow only approved statuses");
const transportMigration = read("supabase/migrations/20261022130000_admin_transport_partner_verification.sql");
assert.ok(transportMigration.includes("p_status is null or p_status not in ('verified', 'rejected', 'suspended')"), "transport RPC must reject null and unsupported statuses");
const jobsMigration = read("supabase/migrations/20261025110000_agriculture_jobs_marketplace.sql");
assert.ok(jobsMigration.includes("p_status is null or p_status not in ('published','rejected','paused','filled')"), "job moderation RPC must reject null and unsupported statuses");


const opportunityApi = read("app/api/admin/content-opportunities/route.ts");
assert.ok(opportunityApi.includes('"status", "published"'), "opportunity API must verify a linked published draft before marking an opportunity published");
assert.ok(opportunityApi.includes("An opportunity can only be marked published after its linked content draft is published"), "opportunity publication must fail closed without a published draft");
assert.ok(opportunityApi.includes("async function requireContentPermission("), "content opportunity API must share an explicit content capability guard");
assert.ok(opportunityApi.includes("authorizePermission(permission)") && opportunityApi.includes("if (!authorization.ok)"), "content opportunity API must fail closed through the shared permission helper");
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
const contentDraftsClient = read("app/admin/content-drafts/ContentDraftsClient.tsx");
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
assert.ok(productApi.includes('authorizePermission("catalog.create_platform")'), "product creation API must require platform catalog capability");
assert.ok(productApi.includes('rpc("admin_create_marketplace_product_with_image"'), "product creation API must call the image-aware RPC");
assert.ok(productApi.includes("expectedImagePrefix"), "product image URLs must be restricted to the authenticated admin's Supabase storage folder");
const productAdminPage = read("app/admin/products/page.tsx");
assert.ok(productAdminPage.includes('rpc("admin_update_marketplace_product"'), "product edits must use the atomic product-and-taxonomy RPC");
assert.ok(!productAdminPage.includes('rpc("admin_set_product_taxonomy"'), "product edits must not depend on the missing taxonomy RPC");
const productMarketplace = read("components/marketplace/MarketplaceCore.tsx");
assert.ok(productMarketplace.includes("product.image_url"), "marketplace cards must display uploaded product images");
const productDetail = read("app/marketplace/[productId]/page.tsx");
assert.ok(productDetail.includes('.eq("status", "active")'), "public product details must expose active products only");
assert.ok(productDetail.includes('.eq("moderation_status", "approved")'), "public product details must expose only approved listings");
assert.ok(productDetail.includes('"@type": "Product"'), "product detail pages must include Product structured data");


const legacyAdminPages = [
  ["app/admin/products/page.tsx", 'authorizePermission("roles.assign_scoped")'],
  ["app/admin/harvest/page.tsx", 'authorizePermission("roles.assign_scoped")'],
  ["app/admin/jobs/page.tsx", 'authorizePermission("jobs.moderate")'],
  ["app/admin/articles/page.tsx", 'authorizePermission("content.review")'],
  ["app/admin/articles/[id]/page.tsx", 'authorizePermission("content.review")'],
  ["app/admin/content-drafts/page.tsx", 'authorizePermission("content.draft")'],
];
for (const [path, expected] of legacyAdminPages) {
  const source = read(path);
  assert.ok(source.includes(expected), `${path} must use capability-based authorization`);
  assert.ok(!source.includes('from("profiles").select("role")'), `${path} must not rely on a legacy profile-role gate`);
}
const adminRpcMigration = read("supabase/migrations/20261029213000_align_order_and_payout_rpcs_with_admin_memberships.sql");
for (const rpc of ["admin_update_marketplace_product", "admin_moderate_harvest_listing", "admin_moderate_job_post", "set_marketplace_order_status", "approve_reseller_commission", "approve_commission_payout", "complete_commission_payout"]) {
  assert.ok(adminRpcMigration.includes(rpc), `admin membership migration must include ${rpc}`);
}
assert.ok(adminRpcMigration.includes("SELECT public.has_platform_admin_access() INTO v_is_admin;"), "order status RPC must use membership-aware admin checks");
assert.ok(adminRpcMigration.includes("IF v_admin IS NULL OR NOT public.has_platform_admin_access() THEN"), "harvest moderation RPC must use membership-aware admin checks");
assert.ok(adminRpcMigration.includes("if v_admin is null or not public.has_platform_admin_access() then"), "job moderation RPC must use membership-aware admin checks");
assert.ok(adminRpcMigration.includes("Could not fully align admin guard for RPC"), "RPC migration must fail instead of silently leaving a legacy admin guard");
assert.ok(adminRpcMigration.includes("v_updated_definition ~*"), "RPC migration must detect unconverted legacy guards before applying changes");

console.log("Admin authorization, content workflow, Content Studio disclosure, and moderation-RPC regression checks passed.");


const productCreateForm = read("components/admin/AdminCreateProductForm.tsx");
const productCreateRoute = read("app/api/admin/products/route.ts");
const moderationPage = read("app/admin/moderation/page.tsx");
assert.ok(productCreateForm.includes('required\n          accept="image/jpeg,image/png,image/webp"'), "platform product creation must require an image file");
assert.ok(productCreateForm.includes("Keep the uploaded object after an ambiguous network failure"), "ambiguous create failures must not delete an image that a committed product may reference");
assert.ok(productCreateRoute.includes("!subcategory || !imageUrl"), "product API must reject products without a saved image URL");
assert.ok(moderationPage.includes('select("image_url")'), "approval must verify the saved image before publishing");
assert.ok(moderationPage.includes('notice=image'), "moderation should route missing-image approvals to a notice");
assert.ok(moderationPage.includes("product image preview"), "moderation queue must show the saved product image for review");

const adminProductPage = read("app/admin/products/page.tsx");
assert.ok(adminProductPage.includes('status === "active" && currentProduct.status !== "active"'), "product edit actions must not bypass the moderation queue to publish a draft");
assert.ok(adminProductPage.includes('notice=moderation'), "direct draft publishing attempts must be routed back to moderation guidance");

const ownershipMigration = read("supabase/migrations/20261029360000_track_marketplace_product_ownership.sql");
const marketplacePage = read("app/marketplace/page.tsx");
const marketplaceCore = read("components/marketplace/MarketplaceCore.tsx");
assert.ok(ownershipMigration.includes("listing_source text NOT NULL DEFAULT 'seller'"), "legacy and seller products must default to seller ownership");
assert.ok(ownershipMigration.includes("CHECK (listing_source IN ('platform', 'seller'))"), "listing source must be constrained to known values");
assert.ok(ownershipMigration.includes("listing_source = 'platform'"), "Super Admin product creation must explicitly mark AGRIVA Official listings");
assert.ok(ownershipMigration.includes("public.has_platform_admin_access()"), "platform listing source assignment must remain platform-admin guarded");
assert.ok(marketplacePage.includes("image_url,listing_source"), "public marketplace must load listing ownership");
assert.ok(marketplaceCore.includes("AGRIVA Official") && marketplaceCore.includes("Seller product"), "marketplace cards must disclose platform vs seller listings");

const seedCompanyMigration = read("supabase/migrations/20261029370000_seed_company_onboarding.sql");
const seedCompanyApplyPage = read("app/company/apply/page.tsx");
const seedCompanyDashboard = read("app/company/dashboard/page.tsx");
const seedCompanyApi = read("app/api/company/applications/route.ts");
const seedCompanyAdminPage = read("app/admin/companies/page.tsx");
const adminHome = read("app/admin/page.tsx");
assert.ok(seedCompanyMigration.includes("ENABLE ROW LEVEL SECURITY"), "seed company tables must enable RLS");
assert.ok(seedCompanyMigration.includes("applicant_user_id = (SELECT auth.uid())"), "company applicants must be scoped to their authenticated user");
assert.ok(seedCompanyMigration.includes("public.has_platform_admin_access()"), "company application review must require platform admin access");
assert.ok(seedCompanyMigration.includes("Application has already been reviewed"), "company application review must prevent duplicate decisions");
assert.ok(seedCompanyMigration.includes("Applicants can resubmit rejected applications"), "rejected applicants must have a controlled resubmission path");
assert.ok(seedCompanyApi.includes("auth.getUser()"), "company application endpoint must verify the current server session");
assert.ok(seedCompanyApi.includes("parsed.protocol !== " + '"https:"'), "company website URLs must use HTTPS");
assert.ok(seedCompanyApi.includes(".eq(\"applicant_user_id\", user.id)"), "company application reads must be bound to the authenticated owner");
assert.ok(seedCompanyApplyPage.includes("/api/company/applications"), "company onboarding form must use the validated application endpoint");
assert.ok(seedCompanyDashboard.includes('.eq("owner_user_id", user.id)'), "company dashboard must only load the signed-in user's company");
assert.ok(seedCompanyAdminPage.includes('authorizePermission("users.manage")'), "company review page must require admin capability");
assert.ok(seedCompanyAdminPage.includes("admin_review_seed_company_application"), "company review must use the guarded database RPC");
assert.ok(adminHome.includes('href="/admin/companies"'), "admin dashboard must link to company review queue");
assert.ok(seedCompanyMigration.includes("registration_number text NOT NULL"), "company applications must retain a registration or licence number");
assert.ok(seedCompanyApplyPage.includes('name="registration_number" required minLength={2} maxLength={100}'), "company onboarding must require a registration or seed licence number");
assert.ok(seedCompanyMigration.includes("seed_company_application_reviews"), "company review decisions must be preserved in an audit history");
assert.ok(seedCompanyMigration.includes("reviewer_user_id, decision, reason"), "the guarded company review RPC must write reviewer, decision, and reason to audit history");
assert.ok(seedCompanyMigration.includes("Platform admins can read seed company review history"), "company review history must be admin-only");

const companyCatalogueMigration = read("supabase/migrations/20261029380000_company_product_catalogue_and_public_profiles.sql");
const companyProductApi = read("app/api/company/products/route.ts");
const companyProductForm = read("components/company/CompanyProductForm.tsx");
const companyDashboard = read("app/company/dashboard/page.tsx");
const publicCompanyPage = read("app/companies/[slug]/page.tsx");
const publicProductPage = read("app/marketplace/[productId]/page.tsx");
const categoryLandingPage = read("app/marketplace/category/[...slug]/page.tsx");
const robots = read("app/robots.ts");
const companyPortalLayout = read("app/company/layout.tsx");
assert.ok(companyCatalogueMigration.includes("ADD COLUMN IF NOT EXISTS seed_company_id"), "company products must have an explicit company owner reference");
assert.ok(companyCatalogueMigration.includes("CHECK (listing_source IN ('platform', 'seller', 'company'))"), "company product source must be distinct from platform and independent seller listings");
assert.ok(companyCatalogueMigration.includes("get_public_seed_company_profile(p_slug text)"), "public company page must use a narrow profile RPC");
assert.ok(companyCatalogueMigration.includes("REVOKE ALL ON FUNCTION public.get_public_seed_company_profile(text) FROM PUBLIC, anon, authenticated"), "public company RPC execute grants must be explicit");
assert.ok(companyCatalogueMigration.includes("Verified companies can upload own product images"), "company image upload must be restricted to verified owners");
assert.ok(companyProductApi.includes('.eq("owner_user_id", user.id)'), "company product API must bind company ownership to the signed-in user");
assert.ok(companyProductApi.includes('listing_source: "company"'), "company products must not be labelled as AGRIVA Official or seller products");
assert.ok(companyProductApi.includes('!/^[A-Za-z0-9._-]{1,255}$/.test'), "company product image path must reject nested paths");
assert.ok(companyProductApi.includes('moderation_status: "pending"'), "company products must enter moderation before publication");
assert.ok(companyProductForm.includes('storage.from("product-images").upload'), "company product form must upload an image before product submission");
assert.ok(companyProductForm.includes("/api/company/products"), "company product form must submit through the verified-company API");
assert.ok(companyDashboard.includes("CompanyProductForm"), "verified company dashboard must expose the product form");
assert.ok(publicCompanyPage.includes("generateMetadata") && publicCompanyPage.includes("canonical"), "company public profile must provide canonical SEO metadata");
assert.ok(publicCompanyPage.includes('"@type": "Organization"'), "company public profile must include Organization structured data");
assert.ok(publicProductPage.includes("generateMetadata") && publicProductPage.includes("canonical"), "product details must provide canonical SEO metadata");
assert.ok(publicProductPage.includes('"@type": "Product"') && publicProductPage.includes('"@type": "Offer"'), "product details must include Product and Offer structured data");
assert.ok(categoryLandingPage.includes("generateMetadata") && categoryLandingPage.includes("BreadcrumbList"), "category landing pages must include metadata and breadcrumb structured data");
assert.ok(marketplaceCore.includes('product.listing_source === "company" ? "Verified company"'), "marketplace cards must distinguish company listings");
assert.ok(sitemap.includes('rpc("get_public_seed_company_slugs")') && sitemap.includes('${base}/companies/${company.slug}'), "verified company public profiles must be discoverable from the sitemap");
assert.ok(companyPortalLayout.includes("index: false") && companyPortalLayout.includes("follow: false"), "private company portal pages must be noindex");
assert.ok(robots.includes('"/companies/"') && !robots.includes('"/company/"'), "robots must allow public company profiles and let crawlers observe private portal noindex metadata");
assert.ok(companyCatalogueMigration.includes("Verified companies can create own draft products"), "verified company product insertion must be scoped by RLS");
assert.ok(companyCatalogueMigration.includes("image_url ~ ("), "company product RLS must constrain image URLs with a regex");
assert.ok(companyCatalogueMigration.includes("storage/v1/object/public/product-images/"), "company product RLS must restrict images to the public product-images storage path");
