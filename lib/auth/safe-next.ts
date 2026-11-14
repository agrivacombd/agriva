/**
 * Only return to a local AGRIVA page after sign-in.
 * A provider-returned callback can include untrusted next= values.
 */
export function safeAuthNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") ||
      /[\u0000-\u001F\u007F]/.test(value) || /%(?:2f|5c|0a|0d)/i.test(value)) {
    return fallback;
  }
  try {
    const resolved = new URL(value, "https://agriva.com.bd");
    if (resolved.origin !== "https://agriva.com.bd" || !resolved.pathname.startsWith("/")) return fallback;
    return value;
  } catch {
    return fallback;
  }
}
