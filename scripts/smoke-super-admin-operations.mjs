#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const page = readFileSync("app/super-admin/page.tsx", "utf8");

for (const [table, column, status] of [
  ["products", "status", "draft"],
  ["harvest_listings", "moderation_status", "pending"],
  ["job_posts", "status", "pending"],
  ["transport_partners", "verification_status", "pending"],
]) {
  assert.ok(page.includes(`from("${table}")`), `Super Admin must probe ${table}`);
  assert.ok(page.includes(`eq("${column}", "${status}")`), `Super Admin must count the correct ${table} queue`);
}
assert.match(page, /select\("id", \{ count: "exact", head: true \}\)/, "queue probes must be count-only and must not fetch row data");
assert.match(page, /const unavailableQueues = queueResults\.filter\(\(result\) => result\.error\)\.length/, "query errors must be reflected in the operations status");
assert.match(page, /count: productsQueue\.error \? null : productsQueue\.count \?\? 0/, "failed product queue query must not be shown as zero");
assert.match(page, /count: harvestQueue\.error \? null : harvestQueue\.count \?\? 0/, "failed harvest queue query must not be shown as zero");
assert.match(page, /count: jobsQueue\.error \? null : jobsQueue\.count \?\? 0/, "failed jobs queue query must not be shown as zero");
assert.match(page, /count: transportQueue\.error \? null : transportQueue\.count \?\? 0/, "failed transport queue query must not be shown as zero");
assert.match(page, /queue\.count === null \? "Unavailable" : queue\.count/, "unavailable data must be visibly distinguished from an empty queue");
for (const href of ["/admin/products", "/admin/harvest", "/admin/jobs", "/admin/transport"]) {
  assert.ok(page.includes(href), `queue card must link to ${href}`);
}
assert.match(page, /console\.error\("Super Admin queue probe unavailable", \{ queue, code: result\.error\.code \|\| "unknown" \}\)/, "logs must include only safe error metadata, not full database errors");
console.log("Super Admin operational queue and unavailable-state regression checks passed.");
