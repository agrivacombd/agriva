import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let articles: Array<{ slug: string; updated_at: string | null }> = [];

  if (url && key) {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("content_drafts")
      .select("slug,updated_at")
      .eq("status", "published")
      .eq("content_type", "article");
    if (!error && data) articles = data;
  }

  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...articles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
