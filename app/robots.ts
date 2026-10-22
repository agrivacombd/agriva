import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/marketplace/", "/blog/", "/guides/", "/tools/"],
        disallow: [
          "/admin",
          "/dashboard",
          "/api",
          "/auth",
          "/orders",
          "/checkout",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
