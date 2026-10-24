import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { MARKETPLACE_CATEGORIES, matchesProductCategory } from "@/lib/marketplace/taxonomy";

type SitemapArticle = { slug: string; updated_at: string | null };
type SitemapProduct = { slug: string; updated_at?: string | null; category?: string | null; category_slug?: string | null; subcategory_slug?: string | null };
type SitemapCategory = { slug: string; name: string; is_active: boolean };
type SitemapSubcategory = { category_slug: string; slug: string; is_active: boolean };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let articles: SitemapArticle[] = [];
  let products: SitemapProduct[] = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  const now = new Date();

  if (url && key) {
    const supabase = createClient(url, key);
    const [articleResult, productResult, categoryResult, subcategoryResult] = await Promise.all([
      supabase.from("content_drafts").select("slug,updated_at").eq("status", "published").eq("content_type", "article"),
      supabase.from("products").select("slug,updated_at,category,category_slug,subcategory_slug").eq("status", "active").eq("moderation_status", "approved").not("slug", "is", null).limit(5000),
      supabase.from("product_categories").select("slug,name,is_active,sort_order").eq("is_active", true).order("sort_order").order("name"),
      supabase.from("product_subcategories").select("category_slug,slug,is_active,sort_order").eq("is_active", true).order("sort_order").order("name"),
    ]);
    if (!articleResult.error && articleResult.data) articles = articleResult.data as SitemapArticle[];
    if (!productResult.error && productResult.data) products = productResult.data as SitemapProduct[];

    if (!productResult.error && productResult.data) {
      const categories: SitemapCategory[] = !categoryResult.error && categoryResult.data
        ? categoryResult.data as SitemapCategory[]
        : MARKETPLACE_CATEGORIES.map((item) => ({ slug: item.slug, name: item.name, is_active: true }));
      const subcategories: SitemapSubcategory[] = !subcategoryResult.error && subcategoryResult.data
        ? subcategoryResult.data as SitemapSubcategory[]
        : MARKETPLACE_CATEGORIES.flatMap((category) => category.subcategories.map((item) => ({ category_slug: category.slug, slug: item.slug, is_active: true })));

      categoryUrls = categories.flatMap((category) => {
        const legacyCategory = MARKETPLACE_CATEGORIES.find((item) => item.slug === category.slug) ?? category;
        const categoryHasProducts = products.some((product) =>
          product.category_slug
            ? product.category_slug === category.slug
            : matchesProductCategory(product.category ?? null, legacyCategory)
        );
        if (!categoryHasProducts) return [];
        const urls: MetadataRoute.Sitemap = [{
          url: `${base}/marketplace/category/${category.slug}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.8,
        }];
        for (const subcategory of subcategories.filter((item) => item.category_slug === category.slug)) {
          const subcategoryHasProducts = products.some((product) =>
            product.category_slug === category.slug && product.subcategory_slug === subcategory.slug
          );
          if (subcategoryHasProducts) urls.push({
            url: `${base}/marketplace/category/${category.slug}/${subcategory.slug}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
        return urls;
      });
    }
  }

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
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
    ...articles.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
