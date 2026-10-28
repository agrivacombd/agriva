import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, MARKETPLACE_CATEGORIES, matchesProductCategory } from "@/lib/marketplace/taxonomy";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import { MARKETPLACE_SAMPLE_PRODUCTS } from "@/lib/marketplace/sample-products";
import { hasIndexableCategoryProducts } from "@/lib/marketplace/indexability";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ categorySlug: string }> };
export function generateStaticParams() {
  return MARKETPLACE_CATEGORIES.map((category) => ({ categorySlug: category.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) return { title: "ক্যাটাগরি পাওয়া যায়নি", robots: { index: false, follow: false } };
  const hasProducts = await hasIndexableCategoryProducts(categorySlug);
  const title = `${category.name} | কৃষি পণ্য`;
  const description = `${category.name} কিনুন ও পণ্যের তথ্য দেখুন AGRIVA Marketplace-এ। ${category.description}।`;
  return {
    title, description,
    ...(hasProducts !== true ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/marketplace/category/${category.slug}` },
    keywords: [category.name, `${category.name} বাংলাদেশ`, "কৃষি পণ্য", "AGRIVA Marketplace"],
    openGraph: { title, description, type: "website", locale: "bn_BD" },
  };
}
export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) notFound();
  let products: MarketplaceProduct[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products").select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock")
      .eq("status", "active").order("created_at", { ascending: false }).limit(200);
    if (!error && data) products = (data as MarketplaceProduct[]).filter((product) => matchesProductCategory(product.category, category, product.category_slug));
  } catch (error) { console.error("Marketplace category load failed:", error); }
  const isSamplePreview = process.env.NODE_ENV !== "production" && products.length === 0;
  if (isSamplePreview) products = MARKETPLACE_SAMPLE_PRODUCTS.filter((product) => matchesProductCategory(product.category, category));
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd";
  const pageUrl = `${base}/marketplace/category/${category.slug}`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: category.name,
    description: category.description, url: pageUrl,
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: base },
      { "@type": "ListItem", position: 2, name: "মার্কেটপ্লেস", item: `${base}/marketplace` },
      { "@type": "ListItem", position: 3, name: category.name, item: pageUrl },
    ] },
  };
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-7xl">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link><span className="mx-2" aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-slate-700">{category.name}</span></nav>
      <header className="rounded-3xl bg-gradient-to-br from-[#103f2b] to-[#24734a] p-6 text-white sm:p-10">
        <span className="text-5xl" aria-hidden="true">{category.icon}</span><h1 className="mt-4 text-3xl font-black sm:text-5xl">{category.name}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85 sm:text-base">{category.description}। AGRIVA Marketplace-এ এই ক্যাটাগরির পণ্য ও বিবরণ খুঁজুন।</p>
      </header>
      <section className="mt-8"><h2 className="text-xl font-black">সাব-ক্যাটাগরি</h2><div className="mt-3 flex flex-wrap gap-2">{category.subcategories.map((sub) => <Link key={sub.slug} href={`/marketplace/category/${category.slug}/${sub.slug}`} className="rounded-full border border-emerald-900/15 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700">{sub.name}</Link>)}</div></section>
      {isSamplePreview && <p role="status" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">প্রিভিউ মোড: নমুনা পণ্য — বাস্তব বিক্রির তালিকা নয়।</p>}<section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-700">Category catalogue</p><h2 className="mt-2 text-2xl font-black">{category.name} — পণ্য তালিকা</h2></div><span className="text-sm text-slate-500">{products.length.toLocaleString("bn-BD")}টি</span></div>
        {products.length ? <MarketplaceCore products={products} showCategories={false} /> : <div className="rounded-2xl border border-dashed border-emerald-950/20 bg-white p-8 text-center"><p className="font-extrabold">এই ক্যাটাগরিতে এখনো পণ্য নেই</p><p className="mt-2 text-sm text-slate-500">নতুন পণ্য অনুমোদিত হলে এখানে দেখা যাবে।</p><Link href="/marketplace" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold text-white">সব পণ্য দেখুন</Link></div>}
      </section>
    </div>
  </main>;
}
