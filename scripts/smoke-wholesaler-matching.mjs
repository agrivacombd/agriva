import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { rankWholesalerSupplyMatches } from "../lib/growth/wholesaler-matching.mjs";

const listing = (overrides = {}) => ({
  id: "l1", crop_name: "ধান", variety: "BRRI-ধান", quantity: 500, unit: "kg",
  price_per_unit: 35, district: "দিনাজপুর", upazila: "সদর", quality: "ভালো",
  harvest_ready: "ready_now", minimum_order: 50, negotiable: true,
  transport_available: true, created_at: "2026-11-28T00:00:00Z", ...overrides,
});
const matches = rankWholesalerSupplyMatches([
  listing(), listing({ id: "l2", crop_name: "আলু", district: "দিনাজপুর", harvest_ready: "later" }),
  listing({ id: "l3", crop_name: "গম", district: "বগুড়া" }),
], [{ crop_name: "ধান", district: "দিনাজপুর" }, { crop_name: "আলু", district: "ঢাকা" }]);
assert.deepEqual(matches.map((item) => item.id), ["l1", "l2"]);
assert.deepEqual(matches[0].matchReasons, ["crop", "district"]);
assert.deepEqual(matches[1].matchReasons, ["crop"]);
assert.equal(rankWholesalerSupplyMatches([listing()], [], 6).length, 0);
assert.equal(rankWholesalerSupplyMatches([listing()], [{ crop_name: "গম", district: "বগুড়া" }]).length, 0);
assert.equal(rankWholesalerSupplyMatches([listing()], [{ crop_name: "ধান", district: "ঢাকা" }]).length, 1);
assert.equal(rankWholesalerSupplyMatches([listing()], [{ crop_name: "ধান", district: "দিনাজপুর" }], 0).length, 0);

const page = readFileSync("app/wholesaler/requests/page.tsx", "utf8");
assert.match(page, /from\("harvest_listings"\)/);
assert.match(page, /moderation_status","approved"/);
assert.match(page, /rankWholesalerSupplyMatches/);
assert.match(page, /উত্তর দেওয়া বাকি/);
assert.doesNotMatch(page, /contact_phone|pickup_details|bulk_quotes"\)\.select\("\*"/);
console.log("AGRIVA wholesaler supply matching regression checks passed.");
