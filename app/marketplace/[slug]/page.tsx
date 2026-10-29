import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Product = {
  id: string; name: string; slug: string; category: string | null;
  category_slug: string | null; subcategory_slug: string | null;
  description: string | null; price: number | string | null; stock: number | null;
  image_url: string | null; listing_source: "platform" | "seller" | "company" | null;
  seed_company_id: string | null; updated_at: string | null;
};

async function getPublishedProduct(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products")
    .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url,listing_source,seed_company_id,updated_at")
    .eq("slug", slug).eq("status", "active").eq("moderation_status", "approved").maybeSingle();
  if (error) {
    console.error("Public product page load failed", { code: error.code || "unknown" });
    return null;
  }
  return data as Product | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };
  const description = (product.description || `${product.name} — AGRIVA Marketplace-এ পণ্যের বিবরণ, মূল্য ও উপলভ্য স্টকের তথ্য দেখুন।`).replace(/\s+/g, " ").slice(0, 155);
  const title = `${product.name} — মূল্য ও বিবরণ`;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  return {
    title,
    description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    keywords: [product.name, product.category || "কৃষি পণ্য", "বাংলাদেশে কৃষি পণ্য", "কৃষি পণ্যের মূল্য"],
    openGraph: {
      type: "website", locale: "bn_BD", siteName: "AGRIVA",
      title, description, url: `${base}/marketplace/${product.slug}`,
      ...(product.image_url ? { images: [{ url: product.image_url, alt: product.name }] } : {}),
    },
    twitter: { card: product.image_url ? "summary_large_image" : "summary", title, description, ...(product.image_url ? { images: [product.image_url] } : {}) },
  };
}

export default async function MarketplaceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: companyRows } = product.seed_company_id
    ? await supabase.rpc("get_public_seed_company_profile_by_id", { p_company_id: product.seed_company_id })
    : { data: null };
  const company = Array.isArray(companyRows) ? companyRows[0] : companyRows;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const price = Number(product.price);
  const inStock = Number(product.stock || 0) > 0;
  const description = (product.description || `${product.name} — AGRIVA Marketplace-এ পণ্যের বিবরণ, মূল্য ও উপলভ্য স্টকের তথ্য দেখুন।`).replace(/\s+/g, " ").slice(0, 5000);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.id,
    category: product.category || "কৃষি পণ্য",
    url: `${base}/marketplace/${product.slug}`,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    ...(company?.company_name ? { brand: { "@type": "Brand", name: company.company_name } } : product.listing_source === "platform" ? { brand: { "@type": "Brand", name: "AGRIVA Official" } } : {}),
    offers: {
      "@type": "Offer",
      url: `${base}/marketplace/${product.slug}`,
      priceCurrency: "BDT",
      price: Number.isFinite(price) ? price.toFixed(2) : "0.00",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600"><Link href="/marketplace" className="underline underline-offset-4">AGRIVA Marketplace</Link><span aria-hidden="true"> / </span><Link href={`/marketplace/category/${product.category_slug || "seeds"}`} className="underline underline-offset-4">{product.category || "কৃষি পণ্য"}</Link><span aria-hidden="true"> / </span><span aria-current="page" className="font-semibold text-emerald-950">{product.name}</span></nav>
      <article className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-2">
        <div className="flex min-h-72 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-6 sm:min-h-[440px]">
          {product.image_url ? <img src={product.image_url} alt={product.name} className="max-h-[440px] w-full object-contain" fetchPriority="high" /> : <span aria-hidden="true" className="text-7xl">🌾</span>}
        </div>
        <div className="p-6 sm:p-9 lg:p-12">
          <p className="text-sm font-extrabold text-emerald-700">{product.category || "কৃষি পণ্য"}</p>
          <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-950">{company?.company_name || (product.listing_source === "platform" ? "AGRIVA Official" : "Marketplace seller")}</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-5 text-3xl font-black text-emerald-900">৳{Number.isFinite(price) ? price.toLocaleString("bn-BD", { maximumFractionDigits: 2 }) : "—"}</p>
          <p className={`mt-2 text-sm font-bold ${inStock ? "text-emerald-800" : "text-rose-700"}`}>{inStock ? `স্টকে আছে: ${Number(product.stock).toLocaleString("bn-BD")}` : "বর্তমানে স্টকে নেই"}</p>
          <div className="mt-6 border-t border-slate-100 pt-5"><h2 className="text-lg font-black">পণ্যের বিবরণ</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{description}</p></div>
          {company?.slug && <div className="mt-6 rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">সরবরাহকারী কোম্পানি</p><p className="mt-1 font-extrabold">{company.company_name}</p><p className="mt-1 text-sm text-slate-600">{company.district || "বাংলাদেশ"}</p><Link href={`/companies/${company.slug}`} className="mt-3 inline-flex font-bold text-emerald-900 underline underline-offset-4">কোম্পানির প্রোফাইল দেখুন</Link></div>}
          <Link href="/marketplace" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">আরও পণ্য দেখুন</Link>
          <p className="mt-4 text-xs leading-5 text-slate-500">মূল্য, স্টক ও পণ্যের তথ্য বিক্রেতার দেওয়া তথ্যের ভিত্তিতে দেখানো হয়েছে। অর্ডারের আগে প্রয়োজনীয় লেবেল ও প্যাকেজের তথ্য যাচাই করুন।</p>
        </div>
      </article>
    </div>
  </main>;
}
