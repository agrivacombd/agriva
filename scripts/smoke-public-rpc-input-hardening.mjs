#!/usr/bin/env node

/**
 * Static regression checks for input bounds on intentionally public RPCs.
 * Does not connect to Production or create attribution/search records.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const path = "supabase/migrations/20261028193000_validate_public_rpc_inputs.sql";
const migration = readFileSync(path, "utf8");

assert.match(migration, /record_attribution_session\([\s\S]*?p_days integer DEFAULT 15/i);
assert.match(migration, /p_days IS NULL OR p_days < 1 OR p_days > 30/i,
  "attribution expiry window must be bounded and non-null");
assert.match(migration, /p_product_id IS NULL[\s\S]*?length\(p_code\) > 64/i,
  "attribution identifiers must be present and bounded");
assert.match(migration, /length\(p_visitor_token\) < 16[\s\S]*?length\(p_visitor_token\) > 128/i,
  "visitor tokens must be bounded");
assert.match(migration, /track_search\(p_query text, p_session_id text DEFAULT NULL\)/i);
assert.match(migration, /p_query IS NULL OR length\(p_query\) > 1000/i,
  "raw search input must be bounded before normalization");
assert.match(migration, /length\(p_session_id\) > 128/i,
  "search session identifiers must be bounded");
assert.match(migration, /SET search_path = pg_catalog, public, pg_temp/i,
  "security-definer RPCs must pin search_path");
assert.equal((migration.match(/CREATE OR REPLACE FUNCTION/g) || []).length, 2,
  "only the two reviewed public RPCs should be replaced");

console.log("Public attribution/search RPC input-bound regression checks passed.");
