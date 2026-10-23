import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory, MARKETPLACE_CATEGORIES, matchesSubcategory } from "@/lib/marketplace/taxonomy";
import type { MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import MarketplaceCore from "@/components/marketplace/MarketplaceCore";
import { MARKETPLACE_SAMPLE_PRODUCTS } from "@/lib/marketplace/sample-products";
import { hasIndexableSubcategoryProducts } from "@/lib/marketplace/indexability";

type Props = { params: Promise<{ categorySlug: string; subcategorySlug: string }> };
export function generateStaticParams() {
  return MARKETPLACE_CATEGORIES.flatMap((category) => category.subcategories.map((subcategory) => ({ categorySlug: category.slug, subcategorySlug: subcategory.slug })));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  if (!category || !subcategory) return { title: "সাব-ক্যাটাগরি পাওয়া যায়নি", robots: { index: false, follow: false } };
  const hasProducts = await hasIndexableSubcategoryProducts(categorySlug, subcategorySlug);
  const title = `${subcategory.name} | ${category.name} | AGRIVA`;
  const description = `${subcategory.description} ${category.name} ক্যাটাগরির পণ্য AGRIVA Marketplace-এ দেখুন।`;
  return {
    title, description,
    ...(hasProducts === false ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/marketplace/category/${category.slug}/${subcategory.slug}` },
    keywords: [subcategory.name, category.name, "কৃষি পণ্য বাংলাদেশ", "AGRIVA"],
    openGraph: { title, description, type: "website", locale: "bn_BD" },
  };
}
export default async function SubcategoryPage({ params }: Props) {
  const { categorySlug, subcategorySlug } = await params;
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  if (!category || !subcategory) notFound();
  let products: MarketplaceProduct[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products").select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url,image_alt")
      .eq("status", "active").order("created_at", { ascending: false }).limit(200);
    if (!error && data) products = (data as MarketplaceProduct[]).filter((product) => matchesSubcategory(product.category, category, subcategory, product.category_slug, product.subcategory_slug));
  } catch (error) { console.error("Marketplace subcategory load failed:", error); }
  const isSamplePreview = products.length === 0;
  if (isSamplePreview) products = MARKETPLACE_SAMPLE_PRODUCTS.filter((product) => matchesSubcategory(product.category, category, subcategory));
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd";
  const pageUrl = `${base}/marketplace/category/${category.slug}/${subcategory.slug}`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: subcategory.name,
    description: subcategory.description, url: pageUrl,
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: base },
      { "@type": "ListItem", position: 2, name: "মার্কেটপ্লেস", item: `${base}/marketplace` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${base}/marketplace/category/${category.slug}` },
      { "@type": "ListItem", position: 4, name: subcategory.name, item: pageUrl },
    ] },
  };
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><div className="mx-auto max-w-7xl">
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}`} className="hover:text-emerald-800">{category.name}</Link><span className="mx-2" aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-slate-700">{subcategory.name}</span></nav>
    <header className="rounded-3xl bg-gradient-to-br from-[#103f2b] to-[#24734a] p-6 text-white sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-lime-200">{category.name}</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{subcategory.name}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85 sm:text-base">{subcategory.description}</p></header>
    {isSamplePreview && <p role="status" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">প্রিভিউ মোড: নমুনা পণ্য — বাস্তব বিক্রির তালিকা নয়।</p>}<section className="mt-8"><div className="mb-5 flex items-end justify-between gap-3"><h2 className="text-2xl font-black">{subcategory.name} — পণ্য তালিকা</h2><span className="text-sm text-slate-500">{products.length.toLocaleString("bn-BD")}টি</span></div>{products.length ? <MarketplaceCore products={products} showCategories={false} /> : <div className="rounded-2xl border border-dashed border-emerald-950/20 bg-white p-8 text-center"><p className="font-extrabold">এই সাব-ক্যাটাগরিতে এখনো পণ্য নেই</p><p className="mt-2 text-sm text-slate-500">নতুন পণ্য অনুমোদিত হলে এখানে দেখা যাবে।</p><Link href={`/marketplace/category/${category.slug}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold text-white">ক্যাটাগরির সব পণ্য দেখুন</Link></div>}</section>
  </div></main>;
}
