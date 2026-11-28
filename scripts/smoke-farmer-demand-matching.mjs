import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { rankFarmerDemandMatches } from "../lib/growth/demand-matching.mjs";

const demand = (overrides = {}) => ({
  id: "d1", crop_name: "ধান", quantity: 100, unit: "maund", price_type: "negotiable",
  target_price: null, district: "দিনাজপুর", upazila: "সদর", need_mode: "urgent",
  need_date: null, need_start_date: null, need_end_date: null, response_deadline: null,
  allow_partial: true, created_at: "2026-11-28T00:00:00Z", ...overrides,
});
const results = rankFarmerDemandMatches([
  demand(), demand({ id: "d2", crop_name: "আলু", district: "দিনাজপুর", need_mode: "flexible" }),
  demand({ id: "d3", crop_name: "গম", district: "বগুড়া" }),
], ["ধান"], "দিনাজপুর");
assert.deepEqual(results.map((item) => item.id), ["d1", "d2"]);
assert.deepEqual(results[0].matchReasons, ["crop", "district"]);
assert.deepEqual(results[1].matchReasons, ["district"]);
assert.equal(rankFarmerDemandMatches([demand()], [], "রংপুর").length, 0);
assert.equal(rankFarmerDemandMatches([demand()], [], "দিনাজপুর").length, 1);
assert.equal(rankFarmerDemandMatches([demand()], ["গম"], null).length, 0);
assert.equal(rankFarmerDemandMatches([demand()], ["ধান"], "দিনাজপুর", 0).length, 0);

const component = readFileSync("components/dashboard/FarmerDemandMatches.tsx", "utf8");
const dashboard = readFileSync("components/dashboard/FarmerDashboard.tsx", "utf8");
assert.match(component, /from\("buyer_demands"\)/);
assert.match(component, /response_deadline\.is\.null,response_deadline\.gte/);
assert.match(component, /select\("id,crop_name,quantity,unit,price_type,target_price,district,upazila,need_mode/);
assert.doesNotMatch(component, /contact_phone|buyer_demand_responses|\.insert\(|\.update\(|\.delete\(/);
assert.match(dashboard, /FarmerDemandMatches/);
console.log("AGRIVA farmer demand matching regression checks passed.");
