#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const authz = read("lib/admin/authz.ts");
const roleGrant = read("supabase/migrations/20261104150000_admin_role_grant_security.sql");
const finance = read("supabase/migrations/20261104110000_forward_harden_admin_finance_and_order_rpcs.sql");
const transport = read("supabase/migrations/20261022130000_admin_transport_partner_verification.sql");
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

// Known audit gap is made explicit rather than silently treated as complete.
const transportRpc = transport.slice(transport.indexOf("create or replace function public.admin_set_transport_partner_verification"));
assert.match(transportRpc, /p\.role = 'admin'/);
assert.match(transportRpc, /p_status not in \('verified', 'rejected', 'suspended'\)/);
assert.doesNotMatch(transportRpc, /admin_audit_log/, "Transport verification still needs an append-only admin audit event");

// Content publication must retain a DB-enforced state machine and before-image history.
assert.match(content, /content_draft_revisions/);
assert.match(content, /content_drafts_workflow_guard/);
assert.match(content, /content_drafts_public_published_articles_read/);
assert.match(content, /NEW\.reviewed_by := auth\.uid\(\)/);

console.log("Admin security contract checks passed. Known gap: Transport verification has no admin_audit_log event yet.");
