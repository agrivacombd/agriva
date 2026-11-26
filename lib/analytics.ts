export type AnalyticsItem = {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
  item_category?: string;
};

export type AnalyticsEventName =
  | "seller_product_submitted"
  | "marketplace_order_placed"
  | "add_to_cart"
  | "sign_up"
  | "purchase"
  | "calculator_use";

type AnalyticsEventParams = Record<
  string,
  string | number | boolean | AnalyticsItem[] | undefined
>;

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
  }
}

/**
 * Send privacy-conscious GA4 events when analytics is configured.
 * Never pass names, phone numbers, addresses, email addresses, or free-text form values.
 */
export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {},
) {
  if (!hasAnalyticsConsent() || typeof window.gtag !== "function") return;

  const safeParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safeParams[key] = value;
      continue;
    }
    if (key !== "items" || eventName !== "purchase" || !Array.isArray(value)) continue;

    const items = value.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.item_id !== "string" || !candidate.item_id) return [];
      const safeItem: AnalyticsItem = { item_id: candidate.item_id };
      if (typeof candidate.item_name === "string") safeItem.item_name = candidate.item_name;
      if (typeof candidate.price === "number" && Number.isFinite(candidate.price)) safeItem.price = candidate.price;
      if (typeof candidate.quantity === "number" && Number.isFinite(candidate.quantity)) safeItem.quantity = candidate.quantity;
      if (typeof candidate.item_category === "string") safeItem.item_category = candidate.item_category;
      return [safeItem];
    });
    if (items.length) safeParams.items = items;
  }

  window.gtag("event", eventName, safeParams);
}
