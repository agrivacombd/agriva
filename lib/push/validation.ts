const PUSH_ENDPOINT_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
];

export function isAllowedPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    const host = url.hostname.toLowerCase();
    return PUSH_ENDPOINT_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

export function isValidPushKey(value: unknown, minLength: number, maxLength: number): value is string {
  return typeof value === "string"
    && value.length >= minLength
    && value.length <= maxLength
    && /^[A-Za-z0-9_-]+$/.test(value);
}
