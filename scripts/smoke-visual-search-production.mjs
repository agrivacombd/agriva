#!/usr/bin/env node
/**
 * Safe production-readiness smoke test for AGRIVA Visual Search.
 *
 * Usage:
 *   AGRIVA_BASE_URL=https://agriva.com.bd node scripts/smoke-visual-search-production.mjs
 *
 * Calls only PUBLIC GET routes. No user image or AI model is uploaded and no
 * paid AI request is invoked. Set EXPECT_VISUAL_PRODUCTS=1 on a live catalogue.
 */
import { strict as assert } from "node:assert";

const base = String(process.env.AGRIVA_BASE_URL || "").replace(/\/+$/, "");
if (!/^https:\/\//.test(base)) {
  console.error("Set AGRIVA_BASE_URL to an HTTPS Vercel production/preview domain.");
  process.exit(2);
}
const timeoutMs = 55_000;
const deadlineFetch = (url) => fetch(url, {
  method: "GET",
  signal: AbortSignal.timeout(timeoutMs),
  headers: { Accept: "application/json" },
});

async function getJson(url) {
  const response = await deadlineFetch(url);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Expected JSON from " + url + " but received HTTP " + response.status);
  }
  assert.equal(response.status, 200, "Endpoint unavailable (" + response.status + "): " + (body.error || url));
  return body;
}

const search = await getJson(base + "/api/search?q=" + encodeURIComponent("black rice"));
assert(Array.isArray(search.products), "Product-first GET must return products");
assert(!Object.hasOwn(search, "answer"), "Product lookup must not trigger AI");

const images = await getJson(base + "/api/search/visual-index");
assert.equal(images.method, "visual-layout-v1");
assert(Array.isArray(images.products), "Visual search index must return products");
assert(Number.isInteger(images.indexedCount) && images.indexedCount === images.products.length);
assert(typeof images.storageOrigin === "string" && new URL(images.storageOrigin).protocol === "https:");
assert.equal(new URL(images.storageOrigin).origin, images.storageOrigin);

for (const product of images.products) {
  assert(typeof product.id === "string" && typeof product.name === "string");
  assert(typeof product.image_url === "string" && new URL(product.image_url).origin === images.storageOrigin);
  assert(product.image_url.includes("/storage/v1/object/public/product-images/"));
  assert(Array.isArray(product.fingerprint) && product.fingerprint.length === 16 * 16 * 3);
  assert(product.fingerprint.every(x => Number.isFinite(x) && x >= 0 && x <= 255));
}
if (process.env.EXPECT_VISUAL_PRODUCTS === "1") {
  assert(images.indexedCount > 0, "Expected production catalogue images, got zero indexed");
}
console.log(JSON.stringify({
  productionUrl: base,
  searchableProducts: search.products.length,
  indexedPhotos: images.indexedCount,
  limited: images.limited,
  aiCalls: 0,
  status: "PASS",
}, null, 2));
