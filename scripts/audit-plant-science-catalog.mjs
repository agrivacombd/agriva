import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = readFileSync(new URL("../app/learn/plant-science/plants.ts", import.meta.url), "utf8");
const pattern = /\{bn:"([^"]*)",en:"([^"]*)",scientific:"([^"]*)",family:"([^"]*)",group:"([^"]*)",clue:"([^"]*)"\}/g;
const rows = [...data.matchAll(pattern)].map((m, index) => ({
  sourceRow: index + 1,
  scientific: m[3],
  family: m[4],
  group: m[5],
  clue: m[6],
}));
const simpleName = /^[A-Z][a-z-]+(?:\s+[×]?\s*[a-z][a-z-]+)?(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z-]+)?$/;
const flags = rows.filter((row) => !simpleName.test(row.scientific)).map((row) => ({
  sourceRow: row.sourceRow,
  scientific: row.scientific,
  family: row.family,
  group: row.group,
  flag: "scientific_name_not_simple_binomial_or_infraspecific_form",
}));
const sourceBuckets = rows.reduce((acc, row) => {
  const key = /BNH/.test(row.group) ? "BNH" :
    /CVPB/.test(row.group) ? "CVPB" :
    /Open Herbarium/.test(row.group) ? "Open Herbarium" :
    /Red List/.test(row.group) ? "Red List" :
    /checklist/i.test(row.group) ? "Other checklist" : "Use/organism grouping";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
assert.equal(rows.length, 1905, "catalogue baseline changed; update the audit deliberately");
assert.equal(flags.length, 18, "nomenclatural-format review queue changed; inspect new/removed flags");
console.log(JSON.stringify({
  recordCount: rows.length,
  sourceLabelBuckets: sourceBuckets,
  scientificNameFormatFlags: flags,
  note: "Flags are triage hints, not taxonomic determinations. Review every flagged record against authoritative sources before editing."
}, null, 2));
