#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/admin/products/route.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20261028200949_admin_create_marketplace_product.sql",
  "utf8",
);

const rpcCall = route.match(
  /supabase\.rpc\("admin_create_marketplace_product",\s*\{([\s\S]*?)\}\s*\)/,
);
assert.ok(rpcCall, "admin API must call the expected product-creation RPC");

const routeArgs = [...rpcCall[1].matchAll(/\b(p_[a-z_]+)\s*:/g)].map((match) => match[1]);
const functionDeclaration = migration.match(
  /create or replace function public\.admin_create_marketplace_product\(([\s\S]*?)\)\s*returns/i,
);
assert.ok(functionDeclaration, "migration must define the admin product RPC");

const migrationArgs = [...functionDeclaration[1].matchAll(/\b(p_[a-z_]+)\s+[a-z]+/gi)].map(
  (match) => match[1],
);
assert.deepEqual(
  routeArgs,
  migrationArgs,
  "RPC argument names and order in the API must match the deployed SQL function contract",
);

assert.match(route, /requireAdminCapability\("catalog\.create"\)/, "API must require the catalog.create capability before calling RPC");
assert.match(route, /if \(error\)[\s\S]*Admin product creation failed/, "RPC errors must be logged server-side");
assert.doesNotMatch(route, /error:\s*error\.message/, "database details must not be returned to clients");
assert.match(migration, /auth\.uid\(\) is null or not public\.is_admin\(\)/, "RPC must independently enforce admin authorization");
assert.match(migration, /'draft'/, "admin-created products must start as drafts");
assert.match(migration, /admin_audit_log/, "admin product creation must be audited");
assert.match(
  migration,
  /revoke all on function public\.admin_create_marketplace_product\([\s\S]*?\) from public, anon;/,
  "RPC must not be executable by public or anonymous roles",
);
assert.match(
  migration,
  /grant execute on function public\.admin_create_marketplace_product\([\s\S]*?\) to authenticated;/,
  "RPC must be executable by authenticated users (with admin checks inside the function)",
);

console.log("Admin product RPC contract and authorization regression checks passed.");
