import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompanyProfile = {
  id: string; slug: string; company_name: string; district: string; website: string | null;
  product_categories: string[]; public_description: string | null; logo_url: string | null;
};
type Product = { id: string; name: string; slug: string; category: string | null; description: string | null; price: number | string; stock: number; image_url: string | null; listing_source: string | null };

async function getCompany(slug: string): Promise<CompanyProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_seed_company_profile", { p_slug: slug });
  if (error) {
    console.error("Public company profile load failed", { code: error.code || "unknown" });
    return null;
  }
  const profile = Array.isArray(data) ? data[0] : data;
  return (profile as CompanyProfile | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) return { title: "কোম্পানি প্রোফাইল পাওয়া যায়নি", robots: { index: false, follow: false } };
  const title = `${company.company_name} — যাচাইকৃত কৃষি পণ্য সরবরাহকারী`;
  const description = (company.public_description || `${company.company_name} বাংলাদেশের ${company.district || ""} এলাকার AGRIVA-তে যাচাইকৃত কৃষি পণ্য সরবরাহকারী কোম্পানি। কোম্পানির অনুমোদিত পণ্য, ক্যাটাগরি ও বিস্তারিত দেখুন।`).replace(/\s+/g, " ").slice(0, 155);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  return {
    title,
    description,
    alternates: { canonical: `/companies/${company.slug}` },
    keywords: [company.company_name, `${company.company_name} বীজ`, "বাংলাদেশ বীজ কোম্পানি", "যাচাইকৃত কৃষি সরবরাহকারী", ...(company.product_categories || [])],
    openGraph: { type: "profile", siteName: "AGRIVA", locale: "bn_BD", title, description, url: `${base}/companies/${company.slug}`, ...(company.logo_url ? { images: [{ url: company.logo_url, alt: company.company_name }] } : {}) },
    twitter: { card: company.logo_url ? "summary_large_image" : "summary", title, description, ...(company.logo_url ? { images: [company.logo_url] } : {}) },
  };
}

export default async function PublicCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products")
    .select("id,name,slug,category,description,price,stock,image_url,listing_source")
    .eq("seed_company_id", company.id).eq("status", "active").eq("moderation_status", "approved")
    .order("created_at", { ascending: false }).limit(100);
  const products = (data ?? []) as Product[];
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const companyJsonLd = {
    "@context": "https://schema.org", "@type": "Organization",
    name: company.company_name, url: `${base}/companies/${company.slug}`,
    description: company.public_description || `${company.company_name} — AGRIVA-তে যাচাইকৃত কৃষি পণ্য সরবরাহকারী।`,
    areaServed: { "@type": "Country", name: "Bangladesh" },
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...(company.logo_url ? { logo: company.logo_url } : {}),
  };
  const categories = { seeds: "বীজ", fertilizer: "সার", fertilizers: "সার", "crop-protection": "ফসল সুরক্ষা", machinery: "কৃষি যন্ত্রপাতি", "tools-equipment": "কৃষি যন্ত্রপাতি", other: "কৃষি উপকরণ" } as Record<string, string>;

  return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(companyJsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600"><Link href="/marketplace" className="underline underline-offset-4">AGRIVA Marketplace</Link><span aria-hidden="true"> / </span><span aria-current="page">{company.company_name}</span></nav>
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] p-6 text-white sm:p-10">
        <div className="flex flex-wrap items-start gap-5">
          {company.logo_url ? <img src={company.logo_url} alt={`${company.company_name} logo`} className="h-20 w-20 rounded-2xl bg-white object-contain p-2" /> : <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-4xl">🌱</div>}
          <div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-200">AGRIVA Verified Company</p><h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{company.company_name}</h1><p className="mt-3 text-sm text-emerald-50/90">{company.district ? `${company.district}, বাংলাদেশ` : "বাংলাদেশ"} · যাচাইকৃত কৃষি পণ্য সরবরাহকারী</p></div>
        </div>
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-base leading-8 text-emerald-50/90">{company.public_description || `${company.company_name} AGRIVA-র যাচাইকৃত কোম্পানি নেটওয়ার্কের সদস্য। এই পেজে কোম্পানির অনুমোদিত ও বর্তমানে উপলভ্য পণ্য দেখুন।`}</p>
        <div className="mt-5 flex flex-wrap gap-2">{(company.product_categories || []).map((category) => <span key={category} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold">{categories[category] || category}</span>)}</div>
        {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-xl bg-lime-300 px-4 py-3 text-sm font-extrabold text-emerald-950 hover:bg-lime-200">কোম্পানির ওয়েবসাইট</a>}
      </header>
      <section className="mt-8" aria-labelledby="company-products">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Approved catalogue</p>
        <h2 id="company-products" className="mt-2 text-2xl font-black sm:text-3xl">{company.company_name} — পণ্যের তালিকা</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">এখানে কেবল কোম্পানির অনুমোদিত এবং বর্তমানে প্রকাশিত পণ্য দেখানো হয়। মূল্য ও স্টক পরিবর্তিত হতে পারে।</p>
        {error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">পণ্যের তালিকা এই মুহূর্তে লোড করা যায়নি।</p>}
        {products.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
          <Link href={`/marketplace/${product.slug}`} className="flex h-40 items-center justify-center bg-emerald-50 p-3">{product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-contain" /> : <span aria-hidden="true" className="text-4xl">🌾</span>}</Link>
          <div className="p-3 sm:p-4"><p className="text-xs font-bold text-emerald-700">{product.category || "কৃষি পণ্য"}</p><h3 className="mt-2 line-clamp-2 font-extrabold"><Link href={`/marketplace/${product.slug}`} className="hover:text-emerald-800">{product.name}</Link></h3><p className="mt-3 text-lg font-black">৳{Number(product.price).toLocaleString("bn-BD", { maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-slate-500">{Number(product.stock) > 0 ? "স্টকে আছে" : "স্টকে নেই"}</p></div>
        </article>)}</div> : !error && <div className="mt-5 rounded-2xl border border-dashed border-emerald-900/20 bg-white p-8 text-center"><p className="font-extrabold">এখনো কোনো প্রকাশিত পণ্য নেই</p><p className="mt-2 text-sm text-slate-600">কোম্পানির পণ্য অনুমোদিত হলে এখানে দেখাবে।</p></div>}
      </section>
      <footer className="mt-10 border-t border-emerald-900/10 pt-5 text-sm text-slate-600"><Link href="/marketplace" className="font-bold text-emerald-900 underline">AGRIVA Marketplace-এ ফিরে যান</Link></footer>
    </div>
  </main>;
}
