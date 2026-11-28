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
assert.match(orders, /canReconcileCod && <form action=\{recordCodCollection\}/, "COD collection controls must only render for authorized finance admins");

const sellerRead = read("app/api/admin/seller-permissions/[market]/route.ts");
const sellerRevoke = read("app/api/admin/seller-permissions/[market]/[userId]/route.ts");
assert.match(sellerRead, /authorizeSellerAccess\("seller_access\.read"\)/, "seller permission listing must require its dedicated read capability");
assert.match(sellerRevoke, /authorizeSellerAccess\("seller_access\.revoke"\)/, "seller permission revocation must require its dedicated capability");
assert.match(sellerRevoke, /reason\.length < 10 \|\| reason\.length > 500/, "seller access revocation must require a bounded reason");
assert.match(sellerRevoke, /p_reason: reason/, "seller access revocation reason must reach the database audit function");
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

console.log("Admin P0 delegated permissions, scoped seller revocation, and transactional audit regression checks passed.");
