#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required Admin hardening file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const permissionService = read("lib/admin/permission-service.ts");
assert.match(permissionService, /"payments\.reconcile"/, "delegated COD reconciliation capability must be declared");
assert.match(permissionService, /"seller_access\.read"/, "seller access read capability must be declared");
assert.match(permissionService, /"seller_access\.revoke"/, "seller access revoke capability must be declared");
assert.match(permissionService, /supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>/, "authorized delegated result must return the already-authorized Supabase session client");

const orders = read("app/admin/orders/page.tsx");
const codAction = orders.split("async function recordCodCollection")[1]?.split("const statusLabel")[0] ?? "";
assert.match(codAction, /checkAdminPermission\("payments\.reconcile"\)/, "COD Server Action must require the dedicated delegated permission");
assert.match(codAction, /permission\.supabase\.rpc\("record_cod_collection"/, "COD action must call the RPC with the same authorized session");
assert.doesNotMatch(codAction, /requireAdmin\("orders\.transition"\)/, "COD reconciliation must not inherit ordinary order transition access");
assert.match(codAction, /!amountText/, "COD action must reject a missing amount instead of coercing it to zero");
assert.match(orders, /canReconcileCod && <form action=\{recordCodCollection\}/, "COD collection controls must only render for authorized finance admins");

const sellerRead = read("app/api/admin/seller-permissions/[market]/route.ts");
const sellerRevoke = read("app/api/admin/seller-permissions/[market]/[userId]/route.ts");
assert.match(sellerRead, /authorizeSellerAccess\("seller_access\.read"\)/, "seller permission listing must require its dedicated read capability");
assert.match(sellerRevoke, /authorizeSellerAccess\("seller_access\.revoke"\)/, "seller permission revocation must require its dedicated capability");
assert.match(sellerRevoke, /reason\.length < 10 \|\| reason\.length > 500/, "seller access revocation must require a bounded reason");
assert.match(sellerRevoke, /p_reason:reason/, "seller access revocation reason must reach the database audit function");
assert.match(sellerRevoke, /requireAdminApi\("catalog\.moderate"\)/, "legacy admin access must remain compatible during the staged migration");

const manager = read("components/admin/SellerPermissionManager.tsx");
assert.match(manager, /Permission বাতিলের কারণ/, "seller revocation UI must collect an explicit reason");
assert.match(manager, /কারণসহ বাতিল নিশ্চিত করুন/, "seller revocation must use an explicit confirmation step");

const migration = read("supabase/migrations/20261128160000_admin_p0_permission_hardening.sql");
assert.match(migration, /has_admin_permission\('payments\.reconcile'\)/, "COD database function must enforce delegated reconciliation permission");
assert.match(migration, /cod_collection\.recorded/, "COD reconciliation must write a central audit event");
assert.match(migration, /has_admin_permission\('seller_access\.revoke'\)/, "seller revoke database function must enforce the delegated permission");
assert.match(migration, /seller_access\.revoked/, "seller revoke must write a central audit event");
assert.match(migration, /FOR UPDATE/, "COD collection must lock the checkout row");
assert.match(migration, /ON CONFLICT \(role_id, capability\) DO NOTHING/, "permission seed must be idempotent");
assert.match(migration, /REVOKE ALL ON FUNCTION public\.rls_auto_enable\(\) FROM PUBLIC, anon, authenticated/, "RLS event-trigger function must not be callable by client roles");

const authz = read("lib/admin/authz.ts");
const legacy = authz.split("const LEGACY_ADMIN_CAPABILITIES")[1]?.split("]);")[0] ?? "";
assert.doesNotMatch(legacy, /payments\.reconcile/, "COD reconciliation must remain outside the broad legacy admin allow-list");

const greenExchange = read("app/admin/green-exchange/page.tsx");
const greenAction = greenExchange.split("async function moderateListing")[1]?.split("const statusLabels")[0] ?? "";
assert.match(greenAction, /requireAdmin\("content\.publish"\)/, "Green Exchange moderation action must require the publishing capability");
assert.match(greenAction, /admin_moderate_green_exchange_listing/, "Green Exchange moderation must use the audited database RPC");
const greenMigration = read("supabase/migrations/20261128170000_admin_green_exchange_audit.sql");
assert.match(greenMigration, /public\.profiles[\s\S]*p\.role = 'admin'/, "Green Exchange moderation RPC must preserve the existing server-side admin boundary");
assert.match(greenMigration, /p_moderation_status IS NULL/, "Green Exchange moderation must reject null status explicitly");
assert.match(greenMigration, /FOR UPDATE/, "Green Exchange moderation must lock the listing before changing state");
assert.match(greenMigration, /green_exchange\.listing_moderated/, "Green Exchange moderation must write a central audit event");
assert.match(greenMigration, /previous_moderation_status/, "Green Exchange audit must capture the previous status");
assert.match(greenMigration, /new_moderation_status/, "Green Exchange audit must capture the new status");

const bulkAuditMigration = read("supabase/migrations/20261128180000_admin_bulk_operations_audit.sql");
for (const action of [
  "product.shipping_updated",
  "bulk.quote_moderated",
  "bulk.request_moderated",
  "bulk.fulfillment_transitioned",
  "bulk.item_fulfillment_transitioned",
  "bulk.wholesaler_verified",
  "bulk.wholesaler_status_changed",
]) {
  assert.ok(bulkAuditMigration.includes(action), `Privileged mutation must have a central audit event: ${action}`);
}
for (const fn of [
  "admin_set_product_shipping",
  "bulk_moderate_quote",
  "bulk_moderate_request",
  "bulk_transition_fulfillment",
  "bulk_transition_item_fulfillment",
  "bulk_verify_named_wholesaler",
  "bulk_verify_wholesaler",
]) {
  const fnBody = bulkAuditMigration.split(`FUNCTION public.${fn}`)[1]?.split("$function$;")[0] ?? "";
  assert.match(fnBody, /SECURITY DEFINER/, `${fn} must remain an explicitly privileged database function`);
  assert.match(fnBody, /bulk_is_admin\(\)|is_admin\(\)/, `${fn} must retain a server-side admin guard`);
  assert.match(fnBody, /admin_audit_log/, `${fn} must write a transactional central audit event`);
}
assert.doesNotMatch(bulkAuditMigration, /v_selection\.id|v_award\.id/, "bulk audit entity IDs must use real primary keys from the existing schema");
assert.match(bulkAuditMigration, /char_length\(v_display_name\) > 120/, "wholesaler display name must be bounded for every moderation status");
assert.match(bulkAuditMigration, /FOR UPDATE OF q, r/, "quote moderation must lock both the quote and parent request");
assert.match(bulkAuditMigration, /ALTER FUNCTION public\\.admin_create_agri_product\\(jsonb\\)[\\s\\S]*?SET search_path TO 'pg_catalog', 'public', 'pg_temp'/, "agricultural product creation must use a hardened SECURITY DEFINER search path");
assert.match(bulkAuditMigration, /ALTER FUNCTION public\\.bulk_create_multi_request\\(text, text, text, text, jsonb\\)[\\s\\S]*?SET search_path TO 'pg_catalog', 'public', 'pg_temp'/, "bulk request creation must use a hardened SECURITY DEFINER search path");

console.log("Admin P0 delegated permissions, scoped seller revocation, and transactional audit regression checks passed.");
