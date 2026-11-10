import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { MARKETPLACE_CATEGORIES, matchesProductCategory, matchesSubcategory } from "@/lib/marketplace/taxonomy";

type SitemapProduct = { slug: string; updated_at?: string | null; category?: string | null; category_slug?: string | null; subcategory_slug?: string | null };
type SitemapPlantProduct = { slug: string; updated_at?: string | null };
type SitemapJob = { slug: string; updated_at: string | null };
type SitemapExchangeListing = { slug: string; updated_at: string | null };
type SitemapLandingPage = { slug: string; updated_at: string | null };
type SitemapArticle = { slug: string; updated_at: string | null };
const isValidSlug = (slug: unknown): slug is string => typeof slug === "string" && /^[a-z0-9\u0980-\u09ff]+(?:-[a-z0-9\u0980-\u09ff]+)*$/.test(slug);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let products: SitemapProduct[] = [];
  let plantProducts: SitemapPlantProduct[] = [];
  let jobs: SitemapJob[] = [];
  let exchangeListings: SitemapExchangeListing[] = [];
  let landingPages: SitemapLandingPage[] = [];
  let cmsArticles: SitemapArticle[] = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  const now = new Date();

  if (url && key) {
    const supabase = createClient(url, key);
    const [productResult, plantProductResult, jobsResult, exchangeResult, landingResult, articleResult] = await Promise.all([
      supabase.from("products").select("slug,updated_at,category,category_slug,subcategory_slug").eq("status", "active").eq("marketplace_channel", "marketplace").not("slug", "is", null).limit(5000),
      supabase.from("plant_market_products").select("slug,updated_at").eq("status", "active").not("slug", "is", null).limit(5000),
      supabase.from("job_posts").select("slug,updated_at").eq("status", "published").or("application_deadline.is.null,application_deadline.gt." + now.toISOString()).limit(5000),
      supabase.from("green_exchange_listings").select("slug,updated_at").eq("status", "active").eq("moderation_status", "approved").limit(5000),
      supabase.from("seo_landing_pages").select("slug,updated_at").eq("status", "published").eq("noindex", false).limit(2000),
      supabase.from("content_drafts").select("slug,updated_at").eq("status", "published").eq("content_type", "article").limit(2000),
    ]);
    if (!plantProductResult.error && plantProductResult.data) plantProducts = (plantProductResult.data as SitemapPlantProduct[]).filter((product) => isValidSlug(product.slug));
    if (!jobsResult.error && jobsResult.data) jobs = (jobsResult.data as SitemapJob[]).filter((job) => isValidSlug(job.slug));
    if (!exchangeResult.error && exchangeResult.data) exchangeListings = (exchangeResult.data as SitemapExchangeListing[]).filter((listing) => isValidSlug(listing.slug));
    if (!landingResult.error && landingResult.data) landingPages = (landingResult.data as SitemapLandingPage[]).filter((page) => isValidSlug(page.slug));
    if (!articleResult.error && articleResult.data) cmsArticles = (articleResult.data as SitemapArticle[]).filter((article) => isValidSlug(article.slug));
    if (!productResult.error && productResult.data) {
      products = (productResult.data as SitemapProduct[]).filter((product) => isValidSlug(product.slug));
      categoryUrls = MARKETPLACE_CATEGORIES.flatMap((category) => {
        const categoryHasProducts = products.some((product) => matchesProductCategory(product.category ?? null, category, product.category_slug));
        if (!categoryHasProducts) return [];
        const urls: MetadataRoute.Sitemap = [{ url: `${base}/marketplace/category/${category.slug}`, changeFrequency: "daily", priority: 0.8 }];
        for (const subcategory of category.subcategories) {
          const subcategoryHasProducts = products.some((product) => matchesSubcategory(product.category ?? null, category, subcategory, product.category_slug, product.subcategory_slug));
          if (subcategoryHasProducts) urls.push({ url: `${base}/marketplace/category/${category.slug}/${subcategory.slug}`, changeFrequency: "weekly", priority: 0.7 });
        }
        return urls;
      });
    }
  }

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sell-on-marketplace`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/sell-on-plant-market`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/krishi-bazar`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/plant-market`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/ai`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/jobs`, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/jobs/cv-builder`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/agriculture-calculators`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/land-calculator`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tools`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/en/tools`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/tools/fertilizer-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/tools/seed-rate-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/tools/irrigation-water-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/tools/harvest-date-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/tools/farm-weather`, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/tools/farm-cost-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/tools/crop-profit-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/tools/crop-calendar`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/krishi-calculator`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/fertilizer-calculator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/seed-rate-calculator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/farming-cost-profit-calculator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/en`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/en/agriculture-calculators`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/en/fertilizer-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/en/seed-rate-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/en/farming-cost-profit-calculator`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/en/crop-calendar`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/en/soil-fertilizer`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/en/crop-choice`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/learn`, changeFrequency: "weekly", priority: 0.8 },
    ...["boro-rice-season-preparation", "soil-health-basics", "integrated-pest-management", "vegetable-garden-water-management"].map((slug) => ({ url: `${base}/blog/${slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/green-living`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/green-exchange`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/impact`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/weather`, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/market-prices`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/crop-calendar`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/crop-choice`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/soil-fertilizer`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/sell-harvest`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/buyer-demands`, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/transport`, changeFrequency: "weekly", priority: 0.65 },
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
      ...(product.updated_at ? { lastModified: new Date(product.updated_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...plantProducts.map((product) => ({
      url: `${base}/plant-market/${product.slug}`,
      ...(product.updated_at ? { lastModified: new Date(product.updated_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...exchangeListings.map((listing) => ({
      url: `${base}/green-exchange/${encodeURIComponent(listing.slug)}`,
      ...(listing.updated_at ? { lastModified: new Date(listing.updated_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...jobs.map((job) => ({
      url: `${base}/jobs/${job.slug}`,
      ...(job.updated_at ? { lastModified: new Date(job.updated_at) } : {}),
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
    ...cmsArticles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      ...(article.updated_at ? { lastModified: new Date(article.updated_at) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...landingPages.map((page) => ({
      url: `${base}/landing/${page.slug}`,
      ...(page.updated_at ? { lastModified: new Date(page.updated_at) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
