#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261129010000_admin_security_definer_search_path_hardening.sql");
for (const signature of [
  "public.bulk_select_item_offer(uuid)",
  "public.bulk_select_quote(uuid)",
  "public.bulk_submit_multi_quote(uuid, jsonb, integer, text)",
]) {
  assert.match(
    migration,
    new RegExp("ALTER FUNCTION " + signature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?SET search_path TO 'pg_catalog', 'public', 'pg_temp'"),
    signature + " must use pg_catalog-first search_path",
  );
}

for (const signature of [
  "public.bulk_select_item_offer(uuid)",
  "public.bulk_select_quote(uuid)",
  "public.bulk_submit_multi_quote(uuid, jsonb, integer, text)",
]) {
  assert.ok(migration.includes("REVOKE ALL ON FUNCTION " + signature + " FROM PUBLIC, anon"), signature + " must revoke public/anon execution");
  assert.ok(migration.includes("GRANT EXECUTE ON FUNCTION " + signature + " TO authenticated"), signature + " must grant authenticated execution");
}

const fixture = read("scripts/test-admin-delegated-permission-fixture.sql");
for (const fn of ["bulk_select_item_offer", "bulk_select_quote", "bulk_submit_multi_quote"]) {
  assert.ok(fixture.includes("FUNCTION public." + fn), fn + " fixture stub must exist");
}
assert.ok(fixture.includes("SET search_path TO 'public', 'pg_temp'"), "fixture must model the original weak search_path before migration");
assert.match(fixture, /JOIN public\.admin_role_permissions rp ON rp\.role_id = ur\.role_id/);
assert.match(fixture, /ur\.expires_at IS NULL OR ur\.expires_at > now\(\)/);
assert.match(fixture, /ur\.scope_type = 'global'[\s\S]*ur\.scope_id IS NULL/);
assert.doesNotMatch(fixture, /p_capability IN \('payments\.reconcile'/, "fixture must not use permissive hard-coded capability allow-list");

const assertions = read("scripts/test-admin-delegated-permission-assertions.sql");
assert.match(assertions, /Legacy admin unexpectedly has COD permission without a delegated role grant/);
assert.match(assertions, /COD RPC unexpectedly allowed a legacy admin without payments\.reconcile/);
assert.match(assertions, /Active global payments\.reconcile grant was not recognized/);
assert.match(assertions, /allowed after delegated grant/);
assert.match(assertions, /cod_collection\.recorded/);
assert.match(assertions, /has_function_privilege\('anon', v_function, 'EXECUTE'\)/);
assert.match(assertions, /has_function_privilege\('authenticated', v_function, 'EXECUTE'\)/);

const codRoute = read("app/admin/orders/page.tsx");
assert.match(codRoute, /checkAdminPermission\("payments\.reconcile"\)/);
assert.match(codRoute, /permission\.supabase\.rpc\("record_cod_collection"/);
const sellerRead = read("app/api/admin/seller-permissions/[market]/route.ts");
const sellerRevoke = read("app/api/admin/seller-permissions/[market]/[userId]/route.ts");
assert.match(sellerRead, /authorizeSellerAccess\("seller_access\.read"\)/);
assert.match(sellerRevoke, /authorizeSellerAccess\("seller_access\.revoke"\)/);
assert.match(sellerRevoke, /admin_revoke_market_access/);

console.log("Admin security regression: delegated permission semantics, COD positive/negative paths, SECURITY DEFINER search_path and route-to-RPC authorization contracts passed.");
