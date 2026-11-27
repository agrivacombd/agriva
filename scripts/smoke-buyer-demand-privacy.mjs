import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync("components/marketplace/BuyerDemandBoard.tsx", "utf8");
const publicColumns = source.match(/const demandColumns = "([^"]+)"/)?.[1];
assert.ok(publicColumns, "public buyer-demand column allowlist must exist");
assert.ok(!publicColumns.split(",").includes("contact_phone"), "public demand discovery must not fetch private phone values");
assert.ok(publicColumns.split(",").includes("contact_phone_public"), "public demand discovery must retain the buyer opt-in flag");
assert.doesNotMatch(source, /ownerDemandColumns/, "no broad owner query may fetch private phone values");
assert.match(source, /publicSupabase[\s\S]*?\.select\(demandColumns\)/, "public demand query must use the phone-free allowlist");
assert.match(source, /\.select\("id,contact_phone"\)[\s\S]*?\.in\("id", optedInIds\)[\s\S]*?\.eq\("contact_phone_public", true\)/, "public phone lookup must be limited to explicitly opted-in demand IDs");
assert.match(source, /contact_phone: publicPhones\.get\(demand\.id\) \?\? null/, "non-opted-in public rows must receive no phone value");
assert.match(source, /supabase\.from\("buyer_demands"\)\.select\(demandColumns\)[\s\S]*?\.eq\("buyer_id", user\.id\)/, "buyer-owned query must also use the phone-free allowlist");
assert.match(source, /buyer_demand_responses"[\s\S]*?contact_phone/, "buyer may still retrieve farmer response contact through the party-scoped RLS query");

console.log("AGRIVA buyer demand public-phone privacy regression checks passed.");
