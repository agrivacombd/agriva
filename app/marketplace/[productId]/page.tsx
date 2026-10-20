import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

type ProductPageProps = { params: Promise<{ productId: string }> };
type ProductRecord = { id: string; slug: string; name: string; category: string | null; price: number | string | null; stock: number | null; description: string | null; commission_percent?: number | null };

async function getPublicProduct(slugOrId: string): Promise<ProductRecord | null> {
  const supabase = await createSupabaseServerClient();
  const columns = "id,slug,name,category,price,stock,description,commission_percent";
  const { data: bySlug } = await supabase.from("products").select(columns).eq("slug", slugOrId).eq("status", "active").eq("moderation_status", "approved").maybeSingle();
  if (bySlug) return bySlug as ProductRecord;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId)) return null;
  const { data: byId } = await supabase.from("products").select(columns).eq("id", slugOrId).eq("status", "active").eq("moderation_status", "approved").maybeSingle();
  return (byId as ProductRecord | null) ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };
  const title = `${product.name} | কৃষি পণ্য | AGRIVA`;
  const description = typeof product.description === "string" && product.description.trim()
    ? product.description.trim().replace(/\s+/g, " ").slice(0, 155)
    : `AGRIVA Marketplace-এ ${product.name} পণ্যের মূল্য, বিবরণ ও মজুত দেখুন।`;
  return {
    title, description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    keywords: [product.name, product.category || "কৃষি পণ্য", "কৃষি পণ্য বাংলাদেশ", "AGRIVA"],
    openGraph: { title, description, type: "website", locale: "bn_BD", url: `/marketplace/${product.slug}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();
  const category = MARKETPLACE_CATEGORIES.find((item) => item.name === product.category || item.match.some((term) => (product.category || "").toLowerCase().includes(term.toLowerCase())));
  const canonicalPath = `/marketplace/${product.slug}`;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd";
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    description: typeof product.description === "string" ? product.description : undefined,
    category: product.category || undefined,
    offers: { "@type": "Offer", priceCurrency: "BDT", price: Number(product.price), availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${base}${canonicalPath}` },
  };
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link>{category && <><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}`} className="hover:text-emerald-800">{category.name}</Link></>}<span className="mx-2" aria-hidden="true">/</span><span className="font-semibold text-slate-700">{product.name}</span></nav>
      <div className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-[.85fr_1.15fr]">
        <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-8 md:min-h-[420px]"><div className="text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm" aria-hidden="true">🌾</span><p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">AGRIVA Marketplace</p></div></div>
        <div className="p-5 sm:p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-600" /> অনুমোদিত পণ্য</span>
          <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          {product.category && <p className="mt-3 text-sm font-bold text-emerald-800">{product.category}</p>}
          {typeof product.description === "string" && product.description.trim() && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{product.description}</p>}
          <p className="mt-6 text-3xl font-black text-emerald-900">৳{Number(product.price || 0).toLocaleString("bn-BD")}</p>
          <p className="mt-2 text-sm text-slate-500">প্রাপ্য মজুত: {Number(product.stock || 0).toLocaleString("bn-BD")}</p>
          <div className="mt-6"><CheckoutButton productId={product.id} disabled={Number(product.stock || 0) < 1} /></div>
          <p className="mt-4 text-xs leading-5 text-slate-500">মূল্য ও মজুত পরিবর্তিত হতে পারে। অর্ডার নিশ্চিত করার আগে checkout-এ তথ্য যাচাই করুন।</p>
        </div>
      </div>
    </div>
  </main>;
}
