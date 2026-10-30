export type AnalyticsEventName =
  | "seller_product_submitted"
  | "marketplace_order_placed";

type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

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
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined &&
      (typeof value === "string" || typeof value === "number" || typeof value === "boolean"),
    ),
  );

  window.gtag("event", eventName, safeParams);
}
