import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { slug: string[] };
async function getCategoryProducts(categorySlug: string, subcategorySlug?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products")
    .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url,listing_source")
    .eq("status", "active").eq("moderation_status", "approved")
    .eq("category_slug", categorySlug).order("created_at", { ascending: false }).limit(120);
  if (subcategorySlug) query = query.eq("subcategory_slug", subcategorySlug);
  const { data, error } = await query;
  if (error) {
    console.error("Marketplace category load failed", { code: error.code || "unknown" });
    return [];
  }
  return (data ?? []) as MarketplaceProduct[];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug[0] || "");
  const subcategory = slug[1] ? getSubcategory(slug[0], slug[1]) : undefined;
  if (!category || (slug.length > 1 && !subcategory) || slug.length > 2) {
    return { title: "ক্যাটাগরি পাওয়া যায়নি", robots: { index: false, follow: false } };
  }
  const title = subcategory ? `${subcategory.name} — ${category.name} পণ্য` : `${category.name} — কৃষি পণ্য ও সরবরাহকারী`;
  const description = (subcategory?.description || `${category.name} ক্যাটাগরিতে বাংলাদেশের কৃষি পণ্য, পণ্যের বিবরণ, মূল্য ও উপলভ্য স্টক দেখুন।`).slice(0, 155);
  const canonical = `/marketplace/category/${category.slug}${subcategory ? `/${subcategory.slug}` : ""}`;
  return {
    title, description, alternates: { canonical },
    keywords: [category.name, subcategory?.name || category.name, `${category.name} বাংলাদেশ`, "কৃষি পণ্যের মূল্য"],
    openGraph: { type: "website", siteName: "AGRIVA", locale: "bn_BD", title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function MarketplaceCategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const category = getCategory(slug[0] || "");
  const subcategory = slug[1] ? getSubcategory(slug[0], slug[1]) : undefined;
  if (!category || (slug.length > 1 && !subcategory) || slug.length > 2) notFound();
  const products = await getCategoryProducts(category.slug, subcategory?.slug);
  const title = subcategory?.name || category.name;
  const description = subcategory?.description || category.description;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const breadcrumbs = [
    { "@type": "ListItem", position: 1, name: "AGRIVA Marketplace", item: `${base}/marketplace` },
    { "@type": "ListItem", position: 2, name: category.name, item: `${base}/marketplace/category/${category.slug}` },
    ...(subcategory ? [{ "@type": "ListItem", position: 3, name: subcategory.name, item: `${base}/marketplace/category/${category.slug}/${subcategory.slug}` }] : []),
  ];

  return <main className="min-h-screen bg-[#f5f8f1] pb-20 text-[#17351f]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs }).replace(/</g, "\\u003c") }} />
    <header className="bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="text-sm text-emerald-50/80"><Link href="/marketplace" className="underline underline-offset-4">Marketplace</Link><span aria-hidden="true"> / </span>{subcategory ? <><Link href={`/marketplace/category/${category.slug}`} className="underline underline-offset-4">{category.name}</Link><span aria-hidden="true"> / </span></> : null}<span aria-current="page">{title}</span></nav>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-emerald-200">AGRIVA Product Category</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">{title} — বাংলাদেশে কৃষি পণ্য</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-emerald-50/90">{description} পণ্যের ছবি, মূল্য ও স্টক যাচাই করে উপযুক্ত পণ্য বেছে নিন।</p>
        {category.subcategories.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{category.subcategories.map((item) => <Link key={item.slug} href={`/marketplace/category/${category.slug}/${item.slug}`} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${subcategory?.slug === item.slug ? "border-lime-300 bg-lime-300 text-emerald-950" : "border-white/25 bg-white/10 hover:bg-white/20"}`}>{item.name}</Link>)}</div>}
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6"><h2 className="text-2xl font-black">{title} পণ্যের তালিকা</h2><p className="mt-2 text-sm leading-6 text-slate-600">শুধু সক্রিয় ও অনুমোদিত পণ্য দেখানো হচ্ছে।</p></div>
      <MarketplaceCore products={products} showCategories={false} />
      {!products.length && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">এই ক্যাটাগরিতে এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য নেই। পরে আবার দেখুন অথবা অন্য ক্যাটাগরি বেছে নিন।</p>}
      <div className="mt-10 rounded-2xl border border-emerald-900/10 bg-white p-5 sm:p-7"><h2 className="text-xl font-black">{title} কেনার আগে কী দেখবেন?</h2><p className="mt-3 text-sm leading-7 text-slate-700">পণ্যের লেবেল, প্যাক সাইজ, উৎপত্তি, মেয়াদ ও ব্যবহারের নির্দেশনা পড়ুন। বীজের ক্ষেত্রে ফসলের মৌসুম ও জাত আপনার এলাকার সঙ্গে মানানসই কি না যাচাই করুন। মূল্য ও স্টক বদলাতে পারে—অর্ডারের আগে বিক্রেতার তথ্য নিশ্চিত করুন।</p><Link href="/marketplace" className="mt-4 inline-flex font-bold text-emerald-900 underline underline-offset-4">সব কৃষি পণ্য দেখুন</Link></div>
    </section>
  </main>;
}
