import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";
import { getProductTaxonomy } from "@/lib/marketplace/taxonomy";
import { getSampleProduct } from "@/lib/marketplace/sample-products";

type ProductPageProps = { params: Promise<{ productId: string }> };
type ProductRecord = { id: string; slug: string; name: string; category: string | null; category_slug?: string | null; subcategory_slug?: string | null; price: number | string | null; stock: number | null; description: string | null; commission_percent?: number | null };

function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC").trim().toLocaleLowerCase();
  } catch {
    return value.normalize("NFC").trim().toLocaleLowerCase();
  }
}

async function getPublicProduct(slugOrId: string): Promise<ProductRecord | null> {
  const normalized = normalizeSlug(slugOrId);
  const sample = getSampleProduct(normalized);
  if (sample) return { ...sample, id: sample.id, slug: sample.slug, commission_percent: null } as ProductRecord;

  const supabase = await createSupabaseServerClient();
  const columns = "id,slug,name,category,price,stock,description";
  const { data: bySlug } = await supabase.from("products").select(columns).eq("slug", normalized).eq("status", "active").eq("moderation_status", "approved").maybeSingle();
  if (bySlug) return bySlug as ProductRecord;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) return null;
  const { data: byId } = await supabase.from("products").select(columns).eq("id", normalized).eq("status", "active").eq("moderation_status", "approved").maybeSingle();
  return (byId as ProductRecord | null) ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };
  const title = `${product.name} | কৃষি পণ্য`;
  const description = typeof product.description === "string" && product.description.trim()
    ? product.description.trim().replace(/\s+/g, " ").slice(0, 155)
    : `AGRIVA Marketplace-এ ${product.name} পণ্যের মূল্য, বিবরণ ও মজুত দেখুন।`;
  return {
    title, description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    ...(product.id.startsWith("sample-") ? { robots: { index: false, follow: false } } : {}),
    keywords: [product.name, product.category || "কৃষি পণ্য", "কৃষি পণ্য বাংলাদেশ", "AGRIVA"],
    openGraph: { title, description, type: "website", locale: "bn_BD", url: `/marketplace/${product.slug}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();
  const taxonomy = getProductTaxonomy(product.category, product.category_slug, product.subcategory_slug);
  const category = taxonomy?.category;
  const subcategory = taxonomy?.subcategory;
  const canonicalPath = `/marketplace/${product.slug}`;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd";
  const hasRealPrice = !product.id.startsWith("sample-") && product.price !== null && Number.isFinite(Number(product.price)) && Number(product.price) >= 0;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    description: typeof product.description === "string" ? product.description : undefined,
    category: product.category || undefined,
    ...(hasRealPrice ? {
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: Number(product.price),
        ...(product.stock !== null && product.stock !== undefined ? { availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } : {}),
        url: `${base}${canonicalPath}`,
      },
    } : {}),
  };
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link>{category && <><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}`} className="hover:text-emerald-800">{category.name}</Link>{subcategory && <><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}/${subcategory.slug}`} className="hover:text-emerald-800">{subcategory.name}</Link></>}</>}<span className="mx-2" aria-hidden="true">/</span><span className="font-semibold text-slate-700">{product.name}</span></nav>
      <div className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-[.85fr_1.15fr]">
        <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-8 md:min-h-[420px]"><div className="text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm" aria-hidden="true">🌾</span><p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">AGRIVA Marketplace</p></div></div>
        <div className="p-5 sm:p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-600" /> {product.id.startsWith("sample-") ? "নমুনা পণ্য · প্রিভিউ" : "অনুমোদিত পণ্য"}</span>
          <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          {product.category && <p className="mt-3 text-sm font-bold text-emerald-800">{product.category}</p>}
          {typeof product.description === "string" && product.description.trim() && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{product.description}</p>}
          <p className="mt-6 text-3xl font-black text-emerald-900">{product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price)) ? <>{product.id.startsWith("sample-") ? "নমুনা মূল্য " : ""}৳{Number(product.price).toLocaleString("bn-BD")}</> : "মূল্য উল্লেখ নেই"}</p>
          <p className="mt-2 text-sm text-slate-500">{product.id.startsWith("sample-") ? "ডেমো মজুত: বাস্তব স্টক নয়" : product.stock !== null && product.stock !== undefined ? `প্রাপ্য মজুত: ${Number(product.stock).toLocaleString("bn-BD")}` : "মজুতের তথ্য নেই"}</p>
          <div className="mt-6">{product.id.startsWith("sample-") ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">এটি শুধু UI প্রিভিউ। নমুনা পণ্যে অর্ডার করা যাবে না।</p> : <CheckoutButton productId={product.id} disabled={Number(product.stock || 0) < 1} />}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">মূল্য ও মজুত পরিবর্তিত হতে পারে। অর্ডার নিশ্চিত করার আগে checkout-এ তথ্য যাচাই করুন।</p>
        </div>
      </div>
    </div>
  </main>;
}
