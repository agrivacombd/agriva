"use client";

import { useEffect } from "react";
import { trackProductRankEvents, type ProductRankMarket } from "@/lib/marketplace/product-rank-tracking";
import { trackClarityEvent } from "@/lib/analytics";

// A product detail view is an intentional click-through, including visits
// from search or external links. Duplicates are ignored by the database.
export default function ProductClickTracker({ market, productId }: { market: ProductRankMarket; productId: string }) {
  useEffect(() => {
    trackProductRankEvents(market, "click", [productId]);
    if (market === "marketplace") trackClarityEvent("product_viewed");
  }, [market, productId]);
  return null;
}
