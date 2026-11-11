import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const queue = JSON.parse(readFileSync(new URL("../docs/plant-science-review-batch-01.json", import.meta.url), "utf8"));
assert.equal(queue.batch, "01");
assert.equal(queue.records.length, 18);
assert.equal(queue.createdFromCatalogueRecords, 1905);
const rows = new Set();
for (const record of queue.records) {
  assert.ok(Number.isInteger(record.sourceRow) && record.sourceRow > 0, "each queue row needs a source row");
  assert.ok(record.scientific?.trim(), "each queue row needs a verbatim scientific name");
  assert.equal(record.reviewStatus, "needs_manual_review", "unreviewed rows must stay pending");
  assert.ok(Array.isArray(record.flags) && record.flags.length > 0, "each queue row needs a review flag");
  assert.ok(!rows.has(record.sourceRow), "source row numbers must be unique");
  rows.add(record.sourceRow);
}
console.log(JSON.stringify({ batch: queue.batch, pendingRecords: queue.records.length, uniqueSourceRows: rows.size }));
