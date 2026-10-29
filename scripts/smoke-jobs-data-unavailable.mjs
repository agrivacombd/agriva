#!/usr/bin/env node

/**
 * Regression check for the Jobs database-unavailable state.
 * Static only: no credentials, network requests, or database writes.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const page = readFileSync("app/jobs/page.tsx", "utf8");

assert.match(
  page,
  /if\s*\(error\)[\s\S]*?unavailable\s*=\s*true/,
  "database query errors must set the unavailable state",
);
assert.match(
  page,
  /catch\s*\(error\)[\s\S]*?unavailable\s*=\s*true/,
  "unexpected data-loading failures must set the unavailable state",
);
assert.match(
  page,
  /unavailable\s*&&\s*<p role="status"/,
  "users must see a status message when the Jobs data source is unavailable",
);
assert.match(
  page,
  /!unavailable\s*&&\s*jobs\.length\s*===\s*0/,
  "the empty-state message must only appear when the query succeeded",
);
assert.match(
  page,
  /Failed to load published jobs/,
  "server logs must distinguish a query failure from a genuinely empty result",
);

console.log("Jobs database-unavailable state regression checks passed.");
