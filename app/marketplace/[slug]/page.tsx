import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProductPageData = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  price: number | string | null;
  stock: number | null;
  image_url: string | null;
  category_slug: string | null;
  subcategory_slug: string | null;
  updated_at: string | null;
};

async function getActiveProduct(slug: string): Promise<ProductPageData | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,category,description,price,stock,image_url,category_slug,subcategory_slug,updated_at")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return data as ProductPageData;
}

const money = (value: number | string | null) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(Number(value || 0));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getActiveProduct(slug);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };

  const description = product.description?.trim().slice(0, 320) || `${product.name} — AGRIVA Marketplace-এ পণ্যের মূল্য, মজুত ও বিবরণ দেখুন।`;
  return {
    title: `${product.name} | AGRIVA Marketplace`,
    description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    openGraph: {
      title: `${product.name} | AGRIVA Marketplace`,
      description,
      url: `/marketplace/${product.slug}`,
      type: "website",
      locale: "bn_BD",
      ...(product.image_url ? { images: [{ url: product.image_url, alt: product.name }] } : {}),
    },
    twitter: {
      card: product.image_url ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(product.image_url ? { images: [product.image_url] } : {}),
    },
  };
}

export default async function MarketplaceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getActiveProduct(slug);
  if (!product) notFound();

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const productUrl = `${base}/marketplace/${product.slug}`;
  const price = Number(product.price || 0);
  const inStock = Number(product.stock || 0) > 0;
  const description = product.description?.trim() || `${product.name} — AGRIVA Marketplace-এ পণ্যের মূল্য ও মজুতের তথ্য দেখুন।`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.id,
    url: productUrl,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    category: product.category || "কৃষি পণ্য",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: Number.isFinite(price) ? price.toFixed(2) : "0.00",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span>
          <Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link><span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-slate-700">{product.name}</span>
        </nav>
        <article className="grid gap-6 overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-2">
          <div className="flex min-h-72 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-6 text-7xl">
            {product.image_url
              ? <div role="img" aria-label={product.name} className="h-72 w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${product.image_url}")` }} />
              : <span aria-hidden="true">🌾</span>}
          </div>
          <div className="p-6 sm:p-9">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">{product.category || "কৃষি পণ্য"}</span>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{product.name}</h1>
            <p className="mt-5 text-3xl font-black text-emerald-900">৳{money(product.price)}</p>
            <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ${inStock ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
              {inStock ? `মজুত: ${money(product.stock)}` : "বর্তমানে স্টকে নেই"}
            </p>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="text-lg font-black">পণ্যের বিবরণ</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-700">{description}</p>
            </div>
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              অর্ডারের আগে প্যাক সাইজ, উৎপত্তিস্থল, মেয়াদ ও বর্তমান স্টক বিক্রেতার সঙ্গে নিশ্চিত করুন। কৃষি উপকরণ ব্যবহারের ক্ষেত্রে পণ্যের লেবেল ও স্থানীয় নির্দেশনা অনুসরণ করুন।
            </p>
            <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-800">← মার্কেটপ্লেসে ফিরুন</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
