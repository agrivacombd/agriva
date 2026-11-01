#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync("supabase/migrations/20261027220000_restrict_anonymous_attribution_resolution.sql", "utf8");
const checkoutRoute = readFileSync("app/api/checkout/route.ts", "utf8");

assert.match(migration, /revoke all on function public\.resolve_reseller_attribution\(text, text, uuid\) from public, anon/i,
  "anonymous and default PUBLIC execution must be revoked");
assert.match(migration, /grant execute on function public\.resolve_reseller_attribution\(text, text, uuid\) to authenticated, service_role/i,
  "authenticated and trusted service role must retain execution");
assert.match(checkoutRoute, /if \(!user\)[\s\S]*?status:\s*401/i,
  "checkout must require an authenticated user");
assert.match(checkoutRoute, /rpc\("finalize_marketplace_cod_order_safe"/i,
  "checkout must use the trusted attribution-safe order wrapper");
assert.doesNotMatch(checkoutRoute, /rpc\("resolve_reseller_attribution"/i,
  "checkout must not resolve reseller IDs in a client-controlled flow");

console.log("Anonymous attribution-resolution permission regression checks passed.");
