/**
 * Pure local similarity helpers shared by the browser worker and CI tests.
 * Scores are relative ranking signals, never probabilities or identity claims.
 */
export const SEMANTIC_MODEL_ID = "Xenova/clip-vit-base-patch32";
export const SEMANTIC_MODEL_CACHE_VERSION = "clip-vit-b32-q8-2026-11-v1";
export const MAX_SEMANTIC_CANDIDATES = 48;
export const SEMANTIC_VECTOR_DIMENSIONS = 512;

export function unitVector(values) {
  if (!values || values.length !== SEMANTIC_VECTOR_DIMENSIONS) return null;
  let magnitude = 0;
  const result = new Float32Array(values.length);
  for (let index = 0; index < values.length; index++) {
    const value = Number(values[index]);
    if (!Number.isFinite(value)) return null;
    magnitude += value * value;
    result[index] = value;
  }
  if (!magnitude || !Number.isFinite(magnitude)) return null;
  const norm = Math.sqrt(magnitude);
  for (let index = 0; index < result.length; index++) result[index] /= norm;
  return result;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== SEMANTIC_VECTOR_DIMENSIONS || b.length !== SEMANTIC_VECTOR_DIMENSIONS) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < SEMANTIC_VECTOR_DIMENSIONS; index++) {
    const ai = Number(a[index]);
    const bi = Number(b[index]);
    if (!Number.isFinite(ai) || !Number.isFinite(bi)) return 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA <= 0 || normB <= 0) return 0;
  return Math.max(-1, Math.min(1, dot / Math.sqrt(normA * normB)));
}

export function combinedVisualScore(semantic, visual) {
  const s = Math.max(0, Math.min(1, semantic));
  const v = Math.max(0, Math.min(1, visual));
  return 0.8 * s + 0.2 * v;
}
