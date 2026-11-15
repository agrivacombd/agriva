export type AnalyticsEventName =
  | "seller_product_submitted"
  | "marketplace_order_placed"
  | "add_to_cart";

type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

const CONSENT_KEY = "agriva_privacy_consent_v1";

/** Only emit analytics events when the visitor has explicitly opted in. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw) as { analytics?: unknown; marketing?: unknown };
    return value.analytics === true && typeof value.marketing === "boolean";
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

export type ClarityEventName =
  | "product_viewed"
  | "cart_viewed"
  | "checkout_started"
  | "checkout_submitted"
  | "cart_item_added"
  | "order_completed";

/** Only fixed funnel milestones, never free text, IDs, order refs, or PII. */
export function trackClarityEvent(eventName: ClarityEventName): void {
  if (!hasAnalyticsConsent() || typeof window.clarity !== "function") return;
  window.clarity("event", eventName);
}

/**
 * Send privacy-conscious GA4 events when analytics is configured.
 * Never pass names, phone numbers, addresses, email addresses, or free-text form values.
 */
export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {},
) {
  if (!hasAnalyticsConsent()) return;
  if (eventName === "add_to_cart") trackClarityEvent("cart_item_added");
  if (eventName === "marketplace_order_placed") trackClarityEvent("order_completed");
  if (typeof window.gtag !== "function") return;

  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined &&
      (typeof value === "string" || typeof value === "number" || typeof value === "boolean"),
    ),
  );

  window.gtag("event", eventName, safeParams);
}
