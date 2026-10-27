#!/usr/bin/env node

/** Static regression checks for the public referral-attribution RPC. */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync(
  "supabase/migrations/20261027210000_minimize_attribution_rpc_output.sql",
  "utf8",
);
const referralRoute = readFileSync("app/r/[code]/route.ts", "utf8");

assert.match(migration, /returns void/i, "the RPC must not return attribution row data");
assert.match(migration, /revoke all on function public\.record_attribution_session\(text, text, uuid, integer\) from public/i,
  "default PUBLIC execution must be revoked");
assert.match(migration, /grant execute on function public\.record_attribution_session\(text, text, uuid, integer\) to anon, authenticated/i,
  "the referral redirect's roles must retain explicit execute permission");
assert.match(migration, /on conflict \(code, visitor_token, product_id\)/i,
  "repeat visits must remain idempotent");
assert.match(referralRoute, /rpc\("record_attribution_session"/i,
  "the referral redirect must continue creating an attribution session");
assert.doesNotMatch(referralRoute, /data:\s*\w+.*record_attribution_session/i,
  "the route must not depend on returned attribution row data");

console.log("Public attribution RPC output regression checks passed.");
