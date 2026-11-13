#!/usr/bin/env node

/**
 * Unified public search smoke test.
 *
 * Usage: AGRIVA_BASE_URL=https://preview.example.com node scripts/smoke-smart-search.mjs
 * Optional: AGRIVA_CHECK_AI=1 to intentionally call a paid AI provider once.
 * Ordinary smoke tests never call an AI model.
 */

const baseUrl = (process.env.AGRIVA_BASE_URL || "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("Set AGRIVA_BASE_URL to the deployed AGRIVA site URL.");
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), ...options });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Expected JSON from " + url + "; received HTTP " + response.status);
  }
  return { response, data };
}

async function run() {
  const endpoint = baseUrl + "/api/search";
  console.log("Testing product-first search: " + endpoint);

  const empty = await readJson(endpoint + "?q=");
  assert(empty.response.status === 200, "Empty GET should be safe and return 200");
  assert(empty.data.resultCount === 0, "Empty GET should contain zero results");
  console.log("PASS empty public search");

  const searched = await readJson(endpoint + "?q=" + encodeURIComponent("black rice"));
  assert(searched.response.status === 200, "Product search should return 200");
  assert(Array.isArray(searched.data.products), "GET must include products");
  assert(Array.isArray(searched.data.guides), "GET must include guides");
  assert(Array.isArray(searched.data.articles), "GET must include articles");
  assert(typeof searched.data.resultCount === "number", "GET must include a numeric resultCount");
  assert(searched.data.zeroResult === (searched.data.resultCount === 0), "zeroResult must match actual results");
  assert(!Object.hasOwn(searched.data, "answer"), "Public GET must never return an AI answer");
  assert(searched.data.products.every((p) =>
    typeof p.id === "string" && typeof p.name === "string" && (typeof p.slug === "string" || p.slug === null)
  ), "Product links require usable id and slug fields");
  console.log("PASS product-first search JSON contract");

  const suggest = await readJson(endpoint + "?suggest=1&q=" + encodeURIComponent("black rice"));
  assert(suggest.response.status === 200, "Suggestions should return 200");
  assert(suggest.data.products.length <= 5, "Suggestions must be capped at five");
  assert(suggest.data.guides.length === 0 && suggest.data.articles.length === 0, "Suggestions should skip article queries");
  console.log("PASS limited suggestions without AI");

  const bangla = await readJson(endpoint + "?q=" + encodeURIComponent("ধানের বীজ"));
  assert(bangla.response.status === 200, "Bangla GET search should return 200");
  assert(typeof bangla.data.normalizedQuery === "string", "Bangla search should be normalized");
  console.log("PASS Bangla catalog search");

  const tooLong = await readJson(endpoint + "?q=" + "x".repeat(161));
  assert(tooLong.response.status === 400, "Overlong GET should be rejected");
  console.log("PASS GET input length validation");

  const emptyPost = await readJson(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: " " }),
  });
  assert(emptyPost.response.status === 400, "Empty POST must return 400");
  console.log("PASS POST input validation");

  if (process.env.AGRIVA_CHECK_AI === "1") {
    const ai = await readJson(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "ai", query: "ধান গাছের পাতায় বাদামি দাগ" }),
    });
    assert(ai.response.status === 200, "Explicit AI request must return 200");
    assert(typeof ai.data.answer === "string" && ai.data.answer.length > 0, "AI request must have an answer");
    console.log("PASS explicit opt-in AI");
  } else {
    console.log("SKIP paid AI request (set AGRIVA_CHECK_AI=1 to test explicitly)");
  }

  console.log("All Unified Search HTTP smoke tests passed.");
}

run().catch((error) => {
  console.error("Unified Search smoke test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
