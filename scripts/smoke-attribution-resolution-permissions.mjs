#!/usr/bin/env node

/** Static regression checks for least-privilege attribution resolution. */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync(
  "supabase/migrations/20261027220000_restrict_anonymous_attribution_resolution.sql",
  "utf8",
);
const checkoutRoute = readFileSync("app/api/checkout/route.ts", "utf8");

assert.match(migration, /revoke all on function public\\.resolve_reseller_attribution\\(text, text, uuid\\) from public, anon/i,
  "anonymous and default PUBLIC execution must be revoked");
assert.match(migration, /grant execute on function public\\.resolve_reseller_attribution\\(text, text, uuid\\) to authenticated, service_role/i,
  "authenticated checkout and trusted service role must retain execution");
assert.match(checkoutRoute, /if \\(!user\\)[\\s\\S]*?status:\\s*401/i,
  "checkout must require an authenticated user");
assert.match(checkoutRoute, /rpc\\("resolve_reseller_attribution"/i,
  "authenticated checkout must continue resolving attribution");

console.log("Anonymous attribution-resolution permission regression checks passed.");
