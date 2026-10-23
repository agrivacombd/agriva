import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

type SitemapArticle = { slug: string; updated_at: string | null };
type SitemapProduct = { slug: string; updated_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let articles: SitemapArticle[] = [];
  let products: SitemapProduct[] = [];

  if (url && key) {
    const supabase = createClient(url, key);
    const [articleResult, productResult] = await Promise.all([
      supabase.from("content_drafts").select("slug,updated_at").eq("status", "published").eq("content_type", "article"),
      supabase.from("products").select("slug,updated_at").eq("status", "active").not("slug", "is", null).limit(5000),
    ]);
    if (!articleResult.error && articleResult.data) articles = articleResult.data as SitemapArticle[];
    if (!productResult.error && productResult.data) products = productResult.data as SitemapProduct[];
  }

  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/market-prices`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/weather`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/crop-calendar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/crop-choice`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/soil-fertilizer`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.8 },
    ...["seed-selection", "sowing-preparation", "seed-storage"].map((slug) => ({ url: `${base}/guides/${slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/crop-disease`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about-us`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact-us`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms-of-service`, changeFrequency: "yearly", priority: 0.3 },
    ...MARKETPLACE_CATEGORIES.map((category) => ({
      url: `${base}/marketplace/category/${category.slug}`,
      lastModified: now, changeFrequency: "daily" as const, priority: 0.8,
    })),
    ...MARKETPLACE_CATEGORIES.flatMap((category) => category.subcategories.map((subcategory) => ({
      url: `${base}/marketplace/category/${category.slug}/${subcategory.slug}`,
      lastModified: now, changeFrequency: "weekly" as const, priority: 0.7,
    }))),
  ];

  return [
    ...staticUrls,
    ...products.map((product) => ({
      url: `${base}/marketplace/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...articles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
