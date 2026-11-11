import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const queue = JSON.parse(read("../docs/plant-science-review-batch-01.json"));
const catalogue = read("../app/learn/plant-science/plants.ts");
const pattern = /\{bn:"([^"]*)",en:"([^"]*)",scientific:"([^"]*)",family:"([^"]*)",group:"([^"]*)",clue:"([^"]*)"\}/g;
const catalogueByName = new Map([...catalogue.matchAll(pattern)].map((m) => [m[3], {
  bn: m[1], en: m[2], family: m[4], group: m[5], clue: m[6],
}]));

assert.equal(queue.batch, "01");
assert.equal(queue.records.length, 18);
assert.equal(queue.createdFromCatalogueRecords, 1905);
const rows = new Set();
for (const record of queue.records) {
  assert.ok(Number.isInteger(record.sourceRow) && record.sourceRow > 0, "each queue row needs a source row");
  assert.ok(record.scientific?.trim(), "each queue row needs a verbatim scientific name");
  const catalogueRecord = catalogueByName.get(record.scientific);
  assert.ok(catalogueRecord, "review queue scientific name must exist in catalogue");
  for (const field of ["bn", "en", "family", "group", "clue"]) {
    assert.equal(record[field], catalogueRecord[field], `review queue ${field} must match catalogue`);
  }
  assert.equal(record.reviewStatus, "needs_manual_review", "unreviewed rows must stay pending");
  assert.ok(Array.isArray(record.flags) && record.flags.length > 0, "each queue row needs a review flag");
  assert.ok(!rows.has(record.sourceRow), "source row numbers must be unique");
  rows.add(record.sourceRow);
}
console.log(JSON.stringify({ batch: queue.batch, pendingRecords: queue.records.length, uniqueSourceRows: rows.size }));
