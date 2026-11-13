"use client";

export type ProductRankMarket = "marketplace" | "plant-market";
export type ProductRankEvent = "impression" | "click" | "listing_click";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// One lightweight same-origin request per visible batch; never invokes an AI API.
export function trackProductRankEvents(
  market: ProductRankMarket,
  eventType: ProductRankEvent,
  productIds: string[],
) {
  if (typeof window === "undefined") return;
  if ((("globalPrivacyControl" in navigator) && navigator.globalPrivacyControl === true) || navigator.doNotTrack === "1") return;
  const ids = [...new Set(productIds)].filter((id) => UUID.test(id)).slice(0, 32);
  if (!ids.length) return;
  void fetch("/api/product-rank/events", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ market, events: ids.map((product_id) => ({ product_id, event_type: eventType })) }),
    keepalive: true,
  }).catch(() => {
    // Ranking instrumentation is best effort and must never block shopping.
  });
}
