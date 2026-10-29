export type LimitedBytesResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: "too_large" };

export type LimitedBodyResult =
  | { ok: true; text: string }
  | { ok: false; reason: "too_large" };

/**
 * Read a request body with a hard byte limit, including when Content-Length is
 * absent or untrusted. The stream is cancelled as soon as the limit is crossed.
 */
export async function readRequestBytesWithLimit(
  request: Request,
  maxBytes: number,
): Promise<LimitedBytesResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError("maxBytes must be a non-negative safe integer");
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, bytes: new Uint8Array() };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("Request body exceeds configured limit").catch(() => undefined);
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export async function readRequestBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<LimitedBodyResult> {
  const result = await readRequestBytesWithLimit(request, maxBytes);
  return result.ok
    ? { ok: true, text: new TextDecoder().decode(result.bytes) }
    : result;
}
