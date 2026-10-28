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
          "/plant-market",
          "/krishi-calculator",
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
