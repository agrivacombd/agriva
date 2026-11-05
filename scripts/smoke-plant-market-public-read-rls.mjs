import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261105180000_split_plant_market_public_read_policy.sql",
  "utf8"
);
const lower = migration.toLowerCase();

assert.match(migration, /DROP POLICY IF EXISTS plant_market_products_public_read/i,
  "the combined policy that invokes is_admin for anon must be removed");
assert.match(migration, /CREATE POLICY plant_market_products_anon_public_read[\s\S]*?TO anon[\s\S]*?USING \(status = 'active'\)/i,
  "anonymous visitors may read active catalogue products only");
assert.match(migration, /CREATE POLICY plant_market_products_authenticated_read[\s\S]*?TO authenticated[\s\S]*?seller_id = \(SELECT auth\.uid\(\)\)[\s\S]*?public\.is_admin\(\)/i,
  "authenticated sellers retain own-row access and admins retain moderation access");
assert.doesNotMatch(lower, /grant\s+execute\s+on\s+function\s+public\.is_admin\s+to\s+anon/,
  "never expose the admin predicate to anonymous clients");
assert.doesNotMatch(lower, /security\s+definer/,
  "the policy fix must not introduce privileged definer code");

console.log("Plant Market public-read RLS regression checks passed.");
