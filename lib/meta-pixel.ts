/**
 * Privacy-gated Meta Pixel events for marketplace conversions.
 * Never send customer names, phone numbers, addresses, email, or free-form input.
 */
const CONSENT_KEY = "agriva_privacy_consent_v1";

export type MetaEventName = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
export type MetaEventParams = {
  currency?: "BDT";
  value?: number;
  content_type?: "product";
  content_ids?: string[];
  num_items?: number;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    return Boolean(parsed && typeof parsed === "object" && "marketing" in parsed && parsed.marketing === true);
  } catch {
    return false;
  }
}

export function trackMetaEvent(eventName: MetaEventName, params: MetaEventParams = {}, eventId?: string): void {
  if (!hasMarketingConsent() || typeof window.fbq !== "function") return;
  const safeParams: MetaEventParams = {};
  if (params.currency === "BDT") safeParams.currency = "BDT";
  if (typeof params.value === "number" && Number.isFinite(params.value) && params.value >= 0) safeParams.value = params.value;
  if (params.content_type === "product") safeParams.content_type = "product";
  if (Array.isArray(params.content_ids)) safeParams.content_ids = params.content_ids.filter(id => typeof id === "string" && id.length > 0 && id.length < 128);
  if (typeof params.num_items === "number" && Number.isInteger(params.num_items) && params.num_items > 0) safeParams.num_items = params.num_items;

  // Use the immutable order ID for purchase deduplication if CAPI is added later.
  if (eventName === "Purchase" && (!eventId || eventId.length > 128)) return;
  if (eventId) window.fbq("track", eventName, safeParams, { eventID: eventId });
  else window.fbq("track", eventName, safeParams);
}
