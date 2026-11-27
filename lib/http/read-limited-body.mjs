/**
 * Read a request body without buffering more than the configured byte limit.
 * Returns null when the declared or streamed body exceeds the limit.
 */
export async function readLimitedBody(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new TypeError("maxBytes must be a non-negative safe integer");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    return null;
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let rawBody = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      rawBody += decoder.decode(value, { stream: true });
    }
    return rawBody + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
