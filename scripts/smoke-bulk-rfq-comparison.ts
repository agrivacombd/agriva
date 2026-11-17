import assert from "node:assert/strict";
import { comparableQuotes, landedTotalMinor, type QuoteComparison } from "../lib/bulk-rfq/comparison";

const now = new Date("2026-11-17T00:00:00Z");
const q = (id: string, unit: number, shipping: number, status: QuoteComparison["status"]="approved"): QuoteComparison => ({
  id,productSubtotalMinor:unit,shippingMinor:shipping,feesMinor:0,deliveryDays:3,expiresAt:"2026-11-19T00:00:00Z",status
});
assert.equal(landedTotalMinor(q("a",6500,1500)),8000);
assert.deepEqual(comparableQuotes([q("cheap-unit",6000,4000),q("cheap-landed",6500,1000),q("hidden",5000,0,"pending")],now).map(x=>x.id),["cheap-landed","cheap-unit"]);
assert.deepEqual(comparableQuotes([{...q("expired",100,0),expiresAt:"2026-11-16T00:00:00Z"}],now),[]);
assert.throws(()=>landedTotalMinor(q("bad",-1,0)),RangeError);
assert.throws(()=>landedTotalMinor(q("overflow",Number.MAX_SAFE_INTEGER,1)),RangeError);
console.log("Bulk RFQ quote-comparison smoke checks passed.");
