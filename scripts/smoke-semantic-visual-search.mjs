#!/usr/bin/env node
/**
 * Offline CLIP similarity plumbing tests. Does not download weights or invoke
 * external paid/free inference endpoints.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  cosineSimilarity,
  unitVector,
  combinedVisualScore,
  MAX_SEMANTIC_CANDIDATES,
  SEMANTIC_VECTOR_DIMENSIONS,
  SEMANTIC_MODEL_ID,
} from "../public/workers/semantic-math.mjs";

const vector = (index, value = 1) => {
  const result = new Float32Array(SEMANTIC_VECTOR_DIMENSIONS);
  result[index] = value;
  return result;
};
const a = vector(1);
const b = vector(1, 2);
const c = vector(2);
assert.equal(unitVector([]), null, "Malformed embeddings must be rejected");
assert.equal(unitVector(new Array(SEMANTIC_VECTOR_DIMENSIONS).fill(0)), null, "Zero embeddings must be rejected");
assert.equal(unitVector(new Array(SEMANTIC_VECTOR_DIMENSIONS).fill(NaN)), null, "NaN embeddings must be rejected");
assert(Math.abs(unitVector(b)[1] - 1) < 1e-6, "Embeddings must be unit normalized");
assert(Math.abs(cosineSimilarity(a, b) - 1) < 1e-6, "Same-direction embeddings must match");
assert.equal(cosineSimilarity(a, c), 0, "Orthogonal embeddings must not match");
assert.equal(cosineSimilarity(a, vector(1, -1)), -1, "Opposite embeddings must score -1");
assert(combinedVisualScore(.8, .2) > combinedVisualScore(.3, .9), "Learned similarity must dominate the appearance fallback");
assert(MAX_SEMANTIC_CANDIDATES > 0 && MAX_SEMANTIC_CANDIDATES <= 50, "Bounded browser inference");
assert.equal(SEMANTIC_MODEL_ID, "Xenova/clip-vit-base-patch32");

const worker = readFileSync("public/workers/agriva-semantic-vision.mjs", "utf8");
const page = readFileSync("app/search/page.tsx", "utf8");
const button = readFileSync("components/search/VisualSearchButton.tsx", "utf8");
const fingerprint = readFileSync("lib/search/visual-fingerprint.ts", "utf8");

assert.match(worker, /image-feature-extraction/);
assert.match(worker, /dtype: "q8"/);
assert.match(worker, /device: "wasm"/);
assert.match(worker, /MAX_RUN_MS/);
assert.match(worker, /indexedDB/);
assert.match(worker, /SEMANTIC_MODEL_CACHE_VERSION/);
assert.match(worker, /combinedVisualScore/);
assert.match(worker, /url\.origin !== storageOrigin/);
assert.match(worker, /safeProduct\(item, storageOrigin\)/);
assert.match(page, /storageOrigin: visualStorageOrigin/);
assert.match(worker, /cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@4\.3\.2/);
assert.doesNotMatch(worker, /api\.openai\.com|generativelanguage\.googleapis\.com|OPENAI_API_KEY|GEMINI_API_KEY/);
assert.doesNotMatch(worker, /fetch\(["']\/api\/|FormData\(/, "No user photo should be uploaded to AGRIVA's server");
assert.match(page, /new Worker\("\/workers\/agriva-semantic-vision\.mjs"/);
assert.match(page, /stopSemanticSearch\(\)/);
assert.match(page, /semanticState === "complete"/);
assert.match(page, /semanticMatches/);
assert.match(button, /semanticPreview: embeddingPreview/);
assert.match(fingerprint, /query\.semanticPreview\.length < 400_000/);
console.log("Local semantic visual search tests passed without loading or paying for a model.");
