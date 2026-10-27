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
          "/tools",
          "/jobs",
          "/jobs/cv-builder",
          "/learn",\n          "/articles",
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
