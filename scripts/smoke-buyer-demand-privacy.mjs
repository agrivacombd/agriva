import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync("components/marketplace/BuyerDemandBoard.tsx", "utf8");
const publicColumns = source.match(/const demandColumns = "([^"]+)"/)?.[1];
assert.ok(publicColumns, "public buyer-demand column allowlist must exist");
assert.ok(!publicColumns.split(",").includes("contact_phone"), "public demand discovery must not fetch private phone values");
assert.ok(publicColumns.split(",").includes("contact_phone_public"), "public demand discovery must retain the buyer opt-in flag");
assert.doesNotMatch(source, /ownerDemandColumns/, "no broad owner query may fetch private phone values");
assert.match(source, /publicSupabase[\s\S]*?\.select\(demandColumns\)/, "public demand query must use the phone-free allowlist");
assert.doesNotMatch(source, /from\("buyer_demands"\)[\s\S]{0,180}\.select\([^)]*contact_phone/, "buyer_demands must never select buyer phone values");
assert.match(source, /contact_phone: null/, "public board must never hydrate buyer phone values");
assert.match(source, /supabase\.from\("buyer_demands"\)\.select\(demandColumns\)[\s\S]*?\.eq\("buyer_id", user\.id\)/, "buyer-owned query must also use the phone-free allowlist");
assert.match(source, /buyer_demand_responses"[\s\S]*?contact_phone/, "buyer may still retrieve farmer response contact through the party-scoped RLS query");

console.log("AGRIVA buyer demand public-phone privacy regression checks passed.");

const migration = readFileSync("supabase/migrations/20261128020000_restrict_buyer_demand_phone_column.sql", "utf8");
assert.match(migration, /revoke select on table public\.buyer_demands from anon, authenticated/i, "migration must remove broad table SELECT grants");
assert.match(migration, /revoke select \(contact_phone\) on table public\.buyer_demands from anon, authenticated/i, "migration must explicitly revoke phone-column SELECT");
assert.match(migration, /grant select \([\s\S]*?contact_phone_public[\s\S]*?\) on table public\.buyer_demands to anon, authenticated/i, "migration must restore only the reviewed non-phone read columns");
assert.doesNotMatch(migration, /grant select \([^)]*contact_phone\s*[,)]/i, "migration must never grant the private phone column");
