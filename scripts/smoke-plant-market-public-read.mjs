import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261102165837_fix_plant_market_public_read_policy.sql", "utf8");
const test = readFileSync("supabase/tests/plant_market_products_public_read.sql", "utf8");
assert.match(migration, /FOR SELECT\s+TO anon\s+USING \(status = 'active'\)/i);
assert.match(migration, /FOR SELECT\s+TO authenticated[\s\S]*?public\.is_admin\(\)/i);
assert.doesNotMatch(migration.match(/CREATE POLICY plant_market_products_anon_read[\s\S]*?;/i)?.[0] ?? "", /is_admin/i);
assert.ok(test.includes("IF has_function_privilege('anon'"), "Anonymous EXECUTE privilege must be denied");
assert.ok(test.includes("plant_market_products_authenticated_read"), "Authenticated seller/admin read policy must be present");
console.log("Plant Market public-read policy regression checks passed.");
