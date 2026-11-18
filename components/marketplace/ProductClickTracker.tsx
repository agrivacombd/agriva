"use client";

import { useEffect, useRef } from "react";
import { trackProductRankEvents, type ProductRankMarket } from "@/lib/marketplace/product-rank-tracking";
import { recordInterest } from "@/lib/marketplace/personalization";
import { hasMarketingConsent, trackMetaEvent } from "@/lib/meta-pixel";

// A product detail view is an intentional click-through, including visits
// from search or external links. Duplicates are ignored by the database.
export default function ProductClickTracker({ market, productId, categorySlug, subcategorySlug, productPrice }: {
  market: ProductRankMarket; productId: string; categorySlug?: string | null; subcategorySlug?: string | null; productPrice?: number | null;
}) {
  const viewContentTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    trackProductRankEvents(market, "click", [productId]);
    if (market==="marketplace") recordInterest({id:productId,category_slug:categorySlug,subcategory_slug:subcategorySlug},"view");
  }, [market, productId, categorySlug, subcategorySlug]);
  useEffect(() => {
    if (market !== "marketplace" || productPrice == null || !Number.isFinite(productPrice) || productPrice < 0) return;
    const fireViewContent = () => {
      if (viewContentTrackedRef.current === productId) return;
      if (!hasMarketingConsent() || typeof window.fbq !== "function") return;
      trackMetaEvent("ViewContent", {
        currency: "BDT", value: productPrice, content_type: "product", content_ids: [productId], num_items: 1,
      });
      viewContentTrackedRef.current = productId;
    };
    fireViewContent();
    window.addEventListener("agriva:meta-pixel-ready", fireViewContent);
    window.addEventListener("agriva:consent-changed", fireViewContent);
    return () => {
      window.removeEventListener("agriva:meta-pixel-ready", fireViewContent);
      window.removeEventListener("agriva:consent-changed", fireViewContent);
    };
  }, [market, productId, productPrice]);
  return null;
}
