import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory, MARKETPLACE_CATEGORIES, matchesCategory } from "@/lib/marketplace/taxonomy";
import type { MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import MarketplaceCore from "@/components/marketplace/MarketplaceCore";

type Props = { params: Promise<{ categorySlug: string; subcategorySlug: string }> };
export function generateStaticParams() {
  return MARKETPLACE_CATEGORIES.flatMap((category) => category.subcategories.map((subcategory) => ({ categorySlug: category.slug, subcategorySlug: subcategory.slug })));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  if (!category || !subcategory) return { title: "সাব-ক্যাটাগরি পাওয়া যায়নি", robots: { index: false, follow: false } };
  const title = `${subcategory.name} | ${category.name} | AGRIVA`;
  return { title, description: `${subcategory.name} ও ${category.name}-এর কৃষি পণ্য দেখুন AGRIVA Marketplace-এ।`, alternates: { canonical: `/marketplace/category/${category.slug}/${subcategory.slug}` }, keywords: [subcategory.name, category.name, "কৃষি পণ্য বাংলাদেশ"], openGraph: { title, description: `${subcategory.name} ও ${category.name}-এর পণ্য`, type: "website", locale: "bn_BD" } };
}
export default async function SubcategoryPage({ params }: Props) {
  const { categorySlug, subcategorySlug } = await params;
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  if (!category || !subcategory) notFound();
  let products: MarketplaceProduct[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products").select("id,name,slug,category,description,price,stock").eq("status", "active").eq("moderation_status", "approved").order("created_at", { ascending: false }).limit(200);
    if (!error && data) products = (data as MarketplaceProduct[]).filter((product) => matchesCategory(product.category, subcategory.match));
  } catch (error) { console.error("Marketplace subcategory load failed:", error); }
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12"><div className="mx-auto max-w-7xl">
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2">/</span><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link><span className="mx-2">/</span><Link href={`/marketplace/category/${category.slug}`} className="hover:text-emerald-800">{category.name}</Link><span className="mx-2">/</span><span className="font-semibold text-slate-700">{subcategory.name}</span></nav>
    <header className="rounded-3xl bg-gradient-to-br from-[#103f2b] to-[#24734a] p-6 text-white sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-lime-200">{category.name}</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{subcategory.name}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85 sm:text-base">{subcategory.name} সম্পর্কিত সক্রিয় ও অনুমোদিত কৃষি পণ্য খুঁজুন।</p></header>
    <section className="mt-8"><h2 className="text-2xl font-black">{subcategory.name} — পণ্য তালিকা</h2>{products.length ? <div className="mt-4"><MarketplaceCore products={products} /></div> : <p className="mt-4 rounded-2xl border border-dashed border-emerald-950/20 bg-white p-8 text-center text-slate-600">এই সাব-ক্যাটাগরিতে এখনো পণ্য নেই।</p>}</section>
  </div></main>;
}
