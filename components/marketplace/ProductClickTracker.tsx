"use client";

import { useEffect } from "react";
import { trackProductRankEvents, type ProductRankMarket } from "@/lib/marketplace/product-rank-tracking";
import { recordInterest } from "@/lib/marketplace/personalization";

// A product detail view is an intentional click-through, including visits
// from search or external links. Duplicates are ignored by the database.
export default function ProductClickTracker({ market, productId, categorySlug, subcategorySlug }: {
  market: ProductRankMarket; productId: string; categorySlug?: string | null; subcategorySlug?: string | null;
}) {
  useEffect(() => {
    trackProductRankEvents(market, "click", [productId]);
    if (market==="marketplace") recordInterest({id:productId,category_slug:categorySlug,subcategory_slug:subcategorySlug},"view");
  }, [market, productId, categorySlug, subcategorySlug]);
  return null;
}
