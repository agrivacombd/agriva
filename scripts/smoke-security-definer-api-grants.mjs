import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20261129120000_harden_security_definer_api_grants.sql',
  'utf8',
);
const assertions = readFileSync(
  'supabase/tests/security_definer_api_grants.sql',
  'utf8',
);

assert.match(migration, /REVOKE ALL ON FUNCTION public\.rls_auto_enable\(\) FROM PUBLIC, anon, authenticated/i);
assert.match(migration, /ALTER FUNCTION %s SET search_path TO pg_catalog, public, pg_temp/i);
for (const signature of [
  'get_ranked_marketplace_products(integer, text, text)',
  'get_ranked_plant_market_products(integer)',
  'get_green_impact_metrics()',
]) {
  assert.ok(migration.includes(signature), `missing explicit grant target: ${signature}`);
}
assert.match(migration, /TO anon, authenticated/i);
assert.match(assertions, /RLS event-trigger function is executable by an API role/);
assert.match(assertions, /Unsafe SECURITY DEFINER search_path remains/);
assert.match(assertions, /Internal product ranking telemetry is directly readable/);
console.log('SECURITY DEFINER API grants and search_path regression checks passed');
