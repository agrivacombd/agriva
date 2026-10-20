#!/usr/bin/env node

/**
 * Live Smart Search smoke test.
 *
 * Usage:
 *   AGRIVA_BASE_URL=https://your-deployment.example node scripts/smoke-smart-search.mjs
 *
 * This intentionally checks the public HTTP contract only; it does not require
 * database credentials and does not claim that the Supabase migration ran.
 */

const baseUrl = (process.env.AGRIVA_BASE_URL || "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("Set AGRIVA_BASE_URL to the deployed AGRIVA site URL.");
  process.exit(2);
}

const endpoint = `${baseUrl}/api/search`;

async function post(body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${endpoint}; received HTTP ${response.status}`);
  }

  return { response, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log(`Testing ${endpoint}`);

  const empty = await post({ query: "   " });
  assert(empty.response.status === 400, `Empty query should return 400; got ${empty.response.status}`);
  assert(typeof empty.data.error === "string", "Empty-query response should contain an error string");
  console.log("PASS empty query returns 400");

  const bangla = await post({ query: "ধান গাছের পাতায় বাদামি দাগ" });
  assert(bangla.response.status === 200, `Bangla query should return 200; got ${bangla.response.status}`);
  assert(typeof bangla.data.answer === "string" && bangla.data.answer.trim(), "Response should contain a non-empty answer");
  assert(typeof bangla.data.normalizedQuery === "string", "Response should contain normalizedQuery");
  assert(typeof bangla.data.resultCount === "number", "Response should contain numeric resultCount");
  assert(Array.isArray(bangla.data.products), "Response should contain a products array");
  assert(typeof bangla.data.zeroResult === "boolean", "Response should contain zeroResult");
  assert(bangla.data.zeroResult === (bangla.data.resultCount === 0), "zeroResult must match resultCount");
  assert(
    bangla.data.products.every((p) => p && typeof p.id === "string" && typeof p.name === "string"),
    "Each product result should have string id and name",
  );
  console.log("PASS Bangla query returns valid Smart Search response");

  const tooLong = await post({ query: "ক".repeat(2001) });
  assert(tooLong.response.status === 400, `Overlong query should return 400; got ${tooLong.response.status}`);
  console.log("PASS overlong query returns 400");

  console.log("All Smart Search HTTP smoke tests passed.");
}

run().catch((error) => {
  console.error("Smart Search smoke test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
