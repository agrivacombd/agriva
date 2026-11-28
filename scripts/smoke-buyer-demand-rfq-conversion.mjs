import { strict as assert } from "node:assert";
import { buildBuyerDemandRfqDraft } from "../lib/bulk-rfq/buyer-demand-conversion.mjs";

const now = new Date("2026-11-28T00:00:00.000Z");
const demand = {
  status: "active", response_deadline: "2026-11-29", crop_name: "ধান", quantity: "120",
  unit: "মণ", district: "দিনাজপুর", upazila: "বিরল", need_mode: "specific_date",
  need_date: "2026-12-15", notes: "PRIVATE NOTES", target_price: 1500,
  contact_phone: "01700000000",
};
const choices = { buyer_type: "business", visibility: "private", quote_deadline: "2026-12-01T12:00:00+06:00" };
const draft = buildBuyerDemandRfqDraft(demand, choices, now);
assert.deepEqual(draft, {
  buyer_type: "business", visibility: "private", product_name: "ধান", specification: "",
  quantity: 120, unit: "মণ", district: "দিনাজপুর", upazila: "বিরল",
  desired_date: "2026-12-15", quote_deadline: "2026-12-01T06:00:00.000Z",
});
for (const forbidden of ["notes", "target_price", "contact_phone", "response_deadline", "need_mode"]) {
  assert.equal(Object.hasOwn(draft, forbidden), false, forbidden + " must never be copied into RFQ");
}
assert.equal(buildBuyerDemandRfqDraft({...demand, need_mode:"flexible"}, choices, now).desired_date, null);
assert.equal(buildBuyerDemandRfqDraft({...demand, need_mode:"date_range", need_date:null}, choices, now).desired_date, null);
assert.throws(() => buildBuyerDemandRfqDraft({...demand, status:"cancelled"}, choices, now), /DEMAND_NOT_ACTIVE/);
assert.throws(() => buildBuyerDemandRfqDraft({...demand, response_deadline:"2026-11-27"}, choices, now), /DEMAND_EXPIRED/);
assert.throws(() => buildBuyerDemandRfqDraft(demand, {...choices, buyer_type:"admin"}, now), /INVALID_BUYER_TYPE/);
assert.throws(() => buildBuyerDemandRfqDraft(demand, {...choices, visibility:"unlisted"}, now), /INVALID_VISIBILITY/);
assert.throws(() => buildBuyerDemandRfqDraft(demand, {...choices, quote_deadline:"2026-11-27T12:00:00Z"}, now), /INVALID_QUOTE_DEADLINE/);
assert.throws(() => buildBuyerDemandRfqDraft({...demand, quantity:0}, choices, now), /INVALID_DEMAND_FIELDS/);
console.log("Buyer demand → RFQ draft mapping and privacy checks passed.");
