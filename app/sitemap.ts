import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { MARKETPLACE_CATEGORIES, matchesProductCategory, matchesSubcategory } from "@/lib/marketplace/taxonomy";

type SitemapArticle = { slug: string; updated_at: string | null; title: string; body_markdown: string | null };
type SitemapProduct = { slug: string; updated_at?: string | null; category?: string | null; category_slug?: string | null; subcategory_slug?: string | null };
type SitemapJob = { slug: string; updated_at: string | null };
type SitemapExchangeListing = { slug: string; updated_at: string | null };
const isValidSlug = (slug: unknown): slug is string => typeof slug === "string" && /^[a-z0-9\u0980-\u09ff]+(?:-[a-z0-9\u0980-\u09ff]+)*$/.test(slug);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let articles: SitemapArticle[] = [];
  let products: SitemapProduct[] = [];
  let jobs: SitemapJob[] = [];
  let exchangeListings: SitemapExchangeListing[] = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  const now = new Date();

  if (url && key) {
    const supabase = createClient(url, key);
    const [articleResult, productResult, jobsResult, exchangeResult] = await Promise.all([
      supabase.from("content_drafts").select("slug,updated_at,title,body_markdown").eq("status", "published").eq("content_type", "article"),
      supabase.from("products").select("slug,updated_at,category").eq("status", "active").not("slug", "is", null).limit(5000),
      supabase.from("job_posts").select("slug,updated_at").eq("status", "published").or("application_deadline.is.null,application_deadline.gt." + now.toISOString()).limit(5000),
      supabase.from("green_exchange_listings").select("slug,updated_at").eq("status", "active").eq("moderation_status", "approved").limit(5000),
    ]);
    if (!articleResult.error && articleResult.data) articles = (articleResult.data as SitemapArticle[]).filter((article) => isValidSlug(article.slug) && Boolean(article.title?.trim()) && Boolean(article.body_markdown?.trim()));
    if (!jobsResult.error && jobsResult.data) jobs = (jobsResult.data as SitemapJob[]).filter((job) => isValidSlug(job.slug));
    if (!exchangeResult.error && exchangeResult.data) exchangeListings = (exchangeResult.data as SitemapExchangeListing[]).filter((listing) => isValidSlug(listing.slug));
    if (!productResult.error && productResult.data) {
      products = (productResult.data as SitemapProduct[]).filter((product) => isValidSlug(product.slug));
      categoryUrls = MARKETPLACE_CATEGORIES.flatMap((category) => {
        const categoryHasProducts = products.some((product) => matchesProductCategory(product.category ?? null, category, product.category_slug));
        if (!categoryHasProducts) return [];
        const urls: MetadataRoute.Sitemap = [{ url: `${base}/marketplace/category/${category.slug}`, lastModified: now, changeFrequency: "daily", priority: 0.8 }];
        for (const subcategory of category.subcategories) {
          const subcategoryHasProducts = products.some((product) => matchesSubcategory(product.category ?? null, category, subcategory, product.category_slug, product.subcategory_slug));
          if (subcategoryHasProducts) urls.push({ url: `${base}/marketplace/category/${category.slug}/${subcategory.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
        }
        return urls;
      });
    }
  }

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/plant-market`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/jobs/cv-builder`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/krishi-calculator`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...["boro-rice-season-preparation", "soil-health-basics", "integrated-pest-management", "vegetable-garden-water-management"].map((slug) => ({ url: `${base}/articles/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/green-living`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/green-exchange`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/impact`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/weather`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/market-prices`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/crop-calendar`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/crop-choice`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/soil-fertilizer`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/sell-harvest`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/buyer-demands`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/transport`, lastModified: now, changeFrequency: "weekly", priority: 0.65 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/crop-disease`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about-us`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact-us`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms-of-service`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticUrls,
    ...categoryUrls,
    ...products.map((product) => ({
      url: `${base}/marketplace/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...exchangeListings.map((listing) => ({
      url: `${base}/green-exchange/${encodeURIComponent(listing.slug)}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...jobs.map((job) => ({
      url: `${base}/jobs/${job.slug}`,
      lastModified: job.updated_at ? new Date(job.updated_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
    ...articles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
