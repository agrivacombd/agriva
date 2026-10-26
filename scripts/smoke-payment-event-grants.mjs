#!/usr/bin/env node

/**
 * Static regression test for the payment-event RPC grant hardening migration.
 * No database connection, payment event, or test data is used.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync(
  "supabase/migrations/20261027120000_restrict_payment_event_rpc_grants.sql",
  "utf8",
);

assert.match(migration, /REVOKE ALL ON FUNCTION public\.record_payment_event\([\s\S]*?\)\s+FROM PUBLIC/i,
  "migration must revoke default PUBLIC execution");
assert.match(migration, /REVOKE ALL ON FUNCTION public\.record_payment_event\([\s\S]*?\)\s+FROM anon, authenticated/i,
  "migration must explicitly revoke client-role execution");
assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.record_payment_event\([\s\S]*?\)\s+TO service_role/i,
  "migration may grant execution only to the trusted server role");
assert.doesNotMatch(migration, /GRANT EXECUTE ON FUNCTION public\.record_payment_event\([\s\S]*?\)\s+TO [^;]*(?:anon|authenticated)/i,
  "migration must not re-grant execution to client roles");

console.log("Payment-event RPC grant hardening regression checks passed.");
