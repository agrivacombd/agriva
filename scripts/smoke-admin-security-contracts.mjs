#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const authz = read("lib/admin/authz.ts");
const roleGrant = read("supabase/migrations/20261104150000_admin_role_grant_security.sql");
const finance = read("supabase/migrations/20261104110000_forward_harden_admin_finance_and_order_rpcs.sql");
const transport = read("supabase/migrations/20261022130000_admin_transport_partner_verification.sql");
const transportForward = read("supabase/migrations/20261106130000_admin_transport_green_exchange_audit_security.sql");
const greenExchangePage = read("app/admin/green-exchange/page.tsx");
const auditPage = read("app/admin/audit/page.tsx");
const reportsPage = read("app/admin/reports/page.tsx");
const jobs = read("supabase/migrations/20261025110000_agriculture_jobs_marketplace.sql");
const identity = read("supabase/migrations/20261030110000_identity_verification_workflow.sql");
const greenExchange = read("supabase/migrations/20261104130000_audit_admin_moderation_and_access_revocation.sql");
const content = read("supabase/migrations/20261104140000_forward_restore_content_publishing_and_revisions.sql");
const users = read("supabase/migrations/024_admin_product_user_management.sql");
const adminPage = read("app/admin/page.tsx");
const ordersPage = read("app/admin/orders/page.tsx");

// Application authorization must be session-bound and fail closed.
assert.match(authz, /supabase\.auth\.getUser\(\)/);
assert.match(authz, /if \(profileError\) return \{ ok: false, reason: "authorization_unavailable" \}/);
assert.match(authz, /if \(delegatedAllowed === null\) return \{ ok: false, reason: "authorization_unavailable" \}/);
assert.match(authz, /if \(!delegatedAllowed\) return \{ ok: false, reason: "forbidden" \}/);
const legacyAllowlist = authz.split("const LEGACY_ADMIN_CAPABILITIES")[1]?.split("]);")[0] ?? "";
for (const highRisk of ["payments.reconcile", "orders.refund.request", "payouts.approve", "system.recovery.execute"]) {
  assert.ok(!legacyAllowlist.includes(highRisk), `legacy admin allowlist must not grant ${highRisk}`);
}

// RBAC mutation RPCs must use the existing public permission helper and be actor-bound.
assert.match(roleGrant, /public\.has_admin_permission\('roles\.grant'\)/);
assert.doesNotMatch(roleGrant, /private\.has_admin_permission/);
assert.match(roleGrant, /r\.role_key = 'super_admin'/);
assert.match(roleGrant, /p_user_id = v_actor/);
assert.match(roleGrant, /pg_advisory_xact_lock/);
assert.match(roleGrant, /Cannot revoke the last active Super Admin/);
assert.match(roleGrant, /'admin\.role\.granted'/);
assert.match(roleGrant, /'admin\.role\.revoked'/);
assert.match(roleGrant, /REVOKE INSERT, UPDATE, DELETE ON TABLE/);
assert.match(roleGrant, /GRANT EXECUTE ON FUNCTION public\.admin_grant_user_role\(uuid, text, timestamptz\) TO authenticated/);
assert.match(roleGrant, /GRANT EXECUTE ON FUNCTION public\.admin_revoke_user_role\(uuid, text\) TO authenticated/);

// High-risk finance mutation remains blocked at both the UI and database grant layer.
assert.match(adminPage, /const FINANCE_MUTATIONS_ENABLED = false/);
assert.match(ordersPage, /const FINANCE_MUTATIONS_ENABLED = false/);
assert.match(finance, /REVOKE ALL ON FUNCTION public\.approve_reseller_commission/);
assert.match(finance, /REVOKE ALL ON FUNCTION public\.approve_commission_payout/);
assert.match(finance, /REVOKE ALL ON FUNCTION public\.complete_commission_payout/);
assert.match(finance, /REVOKE ALL ON FUNCTION public\.record_cod_collection/);

// Sensitive domain workflows must have actor checks and an attributable event trail.
assert.match(jobs, /public\.admin_moderate_job_post/);
assert.match(jobs, /INSERT INTO public\.job_moderation_events/);
assert.match(identity, /module_access_application_events/);
assert.match(identity, /new\.reviewed_by/);
assert.match(greenExchange, /'green_exchange\.listing\.moderated'/);
assert.match(greenExchange, /'admin\.module_access\.revoked'/);
assert.match(users, /'user\.role_changed'/);

// Forward-only Transport hardening: shared capability boundary + atomic audit event.
assert.match(transport, /create or replace function public\.admin_set_transport_partner_verification/);
assert.match(transportForward, /public\.has_admin_permission\('transport\.moderate'\)/);
assert.match(transportForward, /public\.is_admin\(\)/);
assert.match(transportForward, /FOR UPDATE/);
assert.match(transportForward, /'transport\.partner\.verification\.updated'/);
assert.match(transportForward, /previous_status/);
assert.match(transportForward, /new_status/);
assert.match(transportForward, /INSERT INTO public\.admin_audit_log/);
assert.match(transportForward, /public\.has_admin_permission\('transport\.read'\)/);
assert.match(transportForward, /public\.has_admin_permission\('audit\.read'\)/);
assert.match(transportForward, /public\.has_admin_permission\('green_exchange\.moderate'\)/);
assert.match(transportForward, /public\.has_admin_permission\('green_exchange\.read'\)/);

// All three Admin pages must use the shared capability guard rather than profile-role checks.
assert.match(greenExchangePage, /requireAdminPage\(capability/);
assert.match(greenExchangePage, /requireAdmin\("green_exchange\.moderate"\)/);
assert.doesNotMatch(greenExchangePage, /profile\?\.role !== "admin"/);
assert.match(auditPage, /requireAdminPage\("audit\.read"\)/);
assert.doesNotMatch(auditPage, /profile\?\.role !== "admin"/);
assert.match(reportsPage, /requireAdminPage\("reports\.export"\)/);
assert.doesNotMatch(reportsPage, /profile\?\.role !== "admin"/);

// Content publication must retain a DB-enforced state machine and before-image history.
assert.match(content, /content_draft_revisions/);
assert.match(content, /content_drafts_workflow_guard/);
assert.match(content, /content_drafts_public_published_articles_read/);
assert.match(content, /NEW\.reviewed_by := auth\.uid\(\)/);

console.log("Admin security contract checks passed. Transport verification now writes an atomic audit event.");
