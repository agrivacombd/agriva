import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/marketplace",
          "/sell-on-marketplace",
          "/sell-on-plant-market",
          "/krishi-bazar",
          "/plant-market",
          "/agriculture-calculators",
                    "/fertilizer-calculator",
                    "/seed-rate-calculator",
                    "/farming-cost-profit-calculator",
                    "/en",
                    "/en/agriculture-calculators",
                    "/en/fertilizer-calculator",
                    "/en/seed-rate-calculator",
                    "/en/farming-cost-profit-calculator",
                    "/en/crop-calendar",
          "/en/soil-fertilizer",
          "/en/crop-choice",
          "/jobs",
          "/jobs/cv-builder",
          "/learn",
          "/articles",
          "/green-living",
          "/green-exchange",
          "/impact",
          "/weather",
          "/market-prices",
          "/crop-calendar",
          "/crop-choice",
          "/soil-fertilizer",
          "/sell-harvest",
          "/buyer-demands",
          "/transport",
          "/crop-disease",
        ],
        disallow: [
          "/admin/",
          "/seller/",
          "/plant-seller/",
          "/api/",
          "/dashboard/",
          "/garden",
          "/api/",
          "/auth/",
          "/orders",
          "/farms",
          "/search",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
