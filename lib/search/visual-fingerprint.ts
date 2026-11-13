/**
 * Lightweight, device-local visual matching.
 *
 * This uses resized pixel layout and edge contrast, NOT object recognition.
 * It needs no external paid AI/vision API. Fingerprints are derived from
 * publicly-listed product photos and from the user's photo in their browser.
 */
export const VISUAL_SIDE = 16;
export const VISUAL_FINGERPRINT_LENGTH = VISUAL_SIDE * VISUAL_SIDE * 3;
export const VISUAL_QUERY_STORAGE_KEY = "agriva:visual-product-query:v1";
export const VISUAL_QUERY_EVENT = "agriva:visual-product-query";

export type VisualFingerprint = number[];

export type SavedVisualQuery = {
  fingerprint: VisualFingerprint;
  preview: string;
  createdAt: number;
};

export function fingerprintFromRgba(data: ArrayLike<number>): VisualFingerprint {
  const expected = VISUAL_SIDE * VISUAL_SIDE * 4;
  if (data.length !== expected) {
    throw new Error("Invalid image sample size.");
  }
  const values: number[] = [];
  for (let pixel = 0; pixel < VISUAL_SIDE * VISUAL_SIDE; pixel++) {
    const offset = pixel * 4;
    // Quantizing reduces tiny differences between browser canvas and sharp.
    values.push(
      Math.min(255, Math.round(Number(data[offset]) / 8) * 8),
      Math.min(255, Math.round(Number(data[offset + 1]) / 8) * 8),
      Math.min(255, Math.round(Number(data[offset + 2]) / 8) * 8),
    );
  }
  return values;
}

function gray(fingerprint: VisualFingerprint, pixel: number): number {
  const offset = pixel * 3;
  return (
    fingerprint[offset] * 0.299 +
    fingerprint[offset + 1] * 0.587 +
    fingerprint[offset + 2] * 0.114
  );
}

/**
 * Returns a relative score (0..1) for ranking, not a calibrated match
 * probability. It cannot reliably recognize different angles or packaging.
 */
export function visualSimilarity(a: VisualFingerprint, b: VisualFingerprint): number {
  if (a.length !== VISUAL_FINGERPRINT_LENGTH || b.length !== VISUAL_FINGERPRINT_LENGTH) return 0;

  let colorDifference = 0;
  let colorWeight = 0;
  let edgeDifference = 0;
  let edgeWeight = 0;
  for (let y = 0; y < VISUAL_SIDE; y++) {
    for (let x = 0; x < VISUAL_SIDE; x++) {
      const pixel = y * VISUAL_SIDE + x;
      const offset = pixel * 3;
      // Product packaging tends to occupy the center of the picture.
      const center = x >= 3 && x <= 12 && y >= 3 && y <= 12;
      const weight = center ? 2.5 : 0.7;
      for (let channel = 0; channel < 3; channel++) {
        colorDifference += weight * Math.abs(a[offset + channel] - b[offset + channel]);
        colorWeight += weight * 255;
      }

      if (x + 1 < VISUAL_SIDE) {
        const neighbor = pixel + 1;
        edgeDifference += weight * Math.abs(
          (gray(a, pixel) - gray(a, neighbor)) -
          (gray(b, pixel) - gray(b, neighbor))
        );
        edgeWeight += weight * 255;
      }
      if (y + 1 < VISUAL_SIDE) {
        const neighbor = pixel + VISUAL_SIDE;
        edgeDifference += weight * Math.abs(
          (gray(a, pixel) - gray(a, neighbor)) -
          (gray(b, pixel) - gray(b, neighbor))
        );
        edgeWeight += weight * 255;
      }
    }
  }

  const colorDistance = colorWeight ? colorDifference / colorWeight : 1;
  const edgeDistance = edgeWeight ? Math.min(1, edgeDifference / edgeWeight) : 1;
  return Math.max(0, Math.min(1, 1 - 0.58 * colorDistance - 0.42 * edgeDistance));
}

export function isSavedVisualQuery(value: unknown): value is SavedVisualQuery {
  if (!value || typeof value !== "object") return false;
  const query = value as Partial<SavedVisualQuery>;
  return (
    typeof query.createdAt === "number" &&
    Number.isFinite(query.createdAt) &&
    query.createdAt <= Date.now() &&
    Date.now() - query.createdAt < 10 * 60 * 1000 &&
    typeof query.preview === "string" &&
    query.preview.startsWith("data:image/jpeg;base64,") &&
    query.preview.length < 120_000 &&
    Array.isArray(query.fingerprint) &&
    query.fingerprint.length === VISUAL_FINGERPRINT_LENGTH &&
    query.fingerprint.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 255)
  );
}
