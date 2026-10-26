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
          "/tools",
          "/jobs",
          "/jobs/cv-builder",
          "/learn",
          "/green-living",
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
