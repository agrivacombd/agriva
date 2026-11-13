#!/usr/bin/env node
/**
 * Visual search regression test.
 * No uploaded photos leave the browser, and no paid Vision/AI API is invoked.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import ts from "typescript";

const fpSource = readFileSync("lib/search/visual-fingerprint.ts", "utf8");
const indexSource = readFileSync("app/api/search/visual-index/route.ts", "utf8");
const pickerSource = readFileSync("components/search/VisualSearchButton.tsx", "utf8");
const pageSource = readFileSync("app/search/page.tsx", "utf8");
const headerSource = readFileSync("components/site/SiteChrome.tsx", "utf8");
const homeSource = readFileSync("app/page.tsx", "utf8");

const generated = ts.transpileModule(fpSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const commonjs = { exports: {} };
new Function("module", "exports", generated)(commonjs, commonjs.exports);
const { fingerprintFromRgba, visualSimilarity, isSavedVisualQuery, VISUAL_FINGERPRINT_LENGTH } = commonjs.exports;

const imagePixels = (rgb) => {
  const result = [];
  for (let i = 0; i < 256; i++) result.push(...rgb, 255);
  return result;
};
const green = fingerprintFromRgba(imagePixels([40, 130, 45]));
const duplicate = fingerprintFromRgba(imagePixels([40, 130, 45]));
const red = fingerprintFromRgba(imagePixels([200, 40, 45]));
assert.equal(green.length, VISUAL_FINGERPRINT_LENGTH);
assert.equal(visualSimilarity(green, duplicate), 1, "Identical image samples must match exactly");
assert(visualSimilarity(green, red) < 1, "Different images should not match exactly");
assert.equal(visualSimilarity(green, [1, 2, 3]), 0, "Malformed fingerprints must be rejected");
assert.throws(() => fingerprintFromRgba([0, 0, 0]), /Invalid image sample/);

const saved = {
  fingerprint: green,
  preview: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
  createdAt: Date.now(),
};
assert(isSavedVisualQuery(saved), "Recent and well-formed local queries are accepted");
assert(!isSavedVisualQuery({ ...saved, createdAt: Date.now() - 11 * 60_000 }), "Old local queries are rejected");
assert(!isSavedVisualQuery({ ...saved, fingerprint: [1, 2, 3] }), "Malformed local queries are rejected");

assert.match(indexSource, /\.eq\("status", "active"\)/);
assert.match(indexSource, /\.eq\("marketplace_channel", "marketplace"\)/);
assert.match(indexSource, /\.is\("deleted_at", null\)/);
assert.match(indexSource, /approvedProductImage/);
assert.match(indexSource, /MAX_IMAGE_BYTES/);
assert.match(indexSource, /unstable_cache/);
assert.match(indexSource, /MAX_PRODUCTS/);
assert.doesNotMatch(indexSource, /SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|GEMINI_API_KEY|api\.openai\.com|generativelanguage\.googleapis\.com/);

assert.match(pickerSource, /sessionStorage\.setItem\(VISUAL_QUERY_STORAGE_KEY/);
assert.match(pickerSource, /createImageBitmap/);
assert.match(pickerSource, /capture="environment"/);
assert.match(pickerSource, /ACCEPTED_TYPES/);
assert.doesNotMatch(pickerSource, /FormData|fetch\s*\(/, "The user's photo must never be uploaded");
assert.match(pageSource, /visualSimilarity/);
assert.match(pageSource, /api\/search\/visual-index/);
assert.match(pageSource, /<VisualSearchButton/);
assert.match(headerSource, /<VisualSearchButton english=\{english\}/);
assert.match(homeSource, /<VisualSearchButton/);

console.log("AGRIVA image-search privacy, matching, cache and UI regression checks passed.");
