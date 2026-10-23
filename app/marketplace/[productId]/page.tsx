import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";
import { getProductCategory } from "@/lib/marketplace/taxonomy";
import { getSampleProduct } from "@/lib/marketplace/sample-products";

type ProductPageProps = { params: Promise<{ productId: string }> };
type ProductRecord = { id: string; slug: string; name: string; category: string | null; price: number | string | null; stock: number | null; description: string | null; seo_title?: string | null; seo_description?: string | null; seo_keywords?: string | null; image_url?: string | null; image_alt?: string | null; brand?: string | null; sku?: string | null; crop_name?: string | null; seed_variety?: string | null; pack_size?: string | null; germination_rate?: number | null; sowing_season?: string | null; suitable_regions?: string | null; seed_expiry_date?: string | null; commission_percent?: number | null };

function isOptimizedProductImage(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co")
      && url.pathname.startsWith("/storage/v1/object/public/product-images/");
  } catch { return false; }
}

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
  const columns = "id,slug,name,category,price,stock,description,seo_title,seo_description,seo_keywords,image_url,image_alt,brand,sku";
  const { data: bySlug } = await supabase.from("products").select(columns).eq("slug", normalized).eq("status", "active").maybeSingle();
  if (bySlug) return bySlug as ProductRecord;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) return null;
  const { data: byId } = await supabase.from("products").select(columns).eq("id", normalized).eq("status", "active").maybeSingle();
  return (byId as ProductRecord | null) ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };
  const title = product.seo_title?.trim() || `${product.name} | কৃষি পণ্য বাংলাদেশ`;
  const description = product.seo_description?.trim() || (typeof product.description === "string" && product.description.trim()
    ? product.description.trim().replace(/\s+/g, " ").slice(0, 155)
    : `AGRIVA Marketplace-এ ${product.name} পণ্যের মূল্য, বিবরণ ও মজুত দেখুন।`);
  return {
    title: { absolute: title }, description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    ...(product.id.startsWith("sample-") ? { robots: { index: false, follow: false } } : {}),
    keywords: [...(product.seo_keywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean) ?? []), product.name, product.category || "কৃষি পণ্য", "কৃষি পণ্য বাংলাদেশ", "AGRIVA"],
    openGraph: { title, description, type: "website", locale: "bn_BD", url: `/marketplace/${product.slug}`, ...(product.image_url ? { images: [{ url: product.image_url, width: 1200, height: 1200, alt: product.image_alt?.trim() || product.name }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(product.image_url ? { images: [{ url: product.image_url, alt: product.image_alt?.trim() || product.name }] } : {}) },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();
  const category = getProductCategory(product.category);
  const canonicalPath = `/marketplace/${product.slug}`;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd";
  const canonicalUrl = `${base}${canonicalPath}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: base },
      { "@type": "ListItem", position: 2, name: "মার্কেটপ্লেস", item: `${base}/marketplace` },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${base}/marketplace/category/${category.slug}` }] : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: product.name, item: canonicalUrl },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.image_url ? { image: [{ "@type": "ImageObject", url: product.image_url, width: 1200, height: 1200, caption: product.image_alt?.trim() || product.name }] } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.category ? { category: product.category } : {}),
    url: canonicalUrl,
    ...(product.crop_name || product.seed_variety || product.pack_size || product.germination_rate != null || product.sowing_season || product.suitable_regions ? { additionalProperty: [
      ...(product.crop_name ? [{ "@type": "PropertyValue", name: "ফসল", value: product.crop_name }] : []),
      ...(product.seed_variety ? [{ "@type": "PropertyValue", name: "জাত", value: product.seed_variety }] : []),
      ...(product.pack_size ? [{ "@type": "PropertyValue", name: "প্যাকেটের পরিমাণ", value: product.pack_size }] : []),
      ...(product.germination_rate != null ? [{ "@type": "PropertyValue", name: "অঙ্কুরোদ্গমের হার (%)", value: product.germination_rate }] : []),
      ...(product.sowing_season ? [{ "@type": "PropertyValue", name: "বপনের মৌসুম", value: product.sowing_season }] : []),
      ...(product.suitable_regions ? [{ "@type": "PropertyValue", name: "উপযোগী অঞ্চল", value: product.suitable_regions }] : []),
    ] } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "BDT",
      price: Number(product.price),
      availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "AGRIVA", url: base },
    },
  };
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link>{category && <><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}`} className="hover:text-emerald-800">{category.name}</Link></>}<span className="mx-2" aria-hidden="true">/</span><span className="font-semibold text-slate-700">{product.name}</span></nav>
      <div className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-[.85fr_1.15fr]">
        <div className="flex aspect-square min-h-56 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-5 sm:p-8 md:min-h-[420px]">{product.image_url ? <Image src={product.image_url} alt={product.image_alt?.trim() || product.name} width={1200} height={1200} sizes="(max-width: 768px) 100vw, 42vw" quality={88} priority unoptimized={!isOptimizedProductImage(product.image_url)} className="max-h-[420px] w-full rounded-2xl object-contain" /> : <div className="text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm" aria-hidden="true">🌾</span><p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">AGRIVA Marketplace</p></div>}</div>
        <div className="p-5 sm:p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-600" /> {product.id.startsWith("sample-") ? "নমুনা পণ্য · প্রিভিউ" : "অনুমোদিত পণ্য"}</span>
          <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          {product.category && <p className="mt-3 text-sm font-bold text-emerald-800">{product.category}</p>}
          {(product.crop_name || product.seed_variety || product.pack_size || product.germination_rate != null || product.sowing_season || product.suitable_regions) && <section className="mt-5 rounded-xl bg-emerald-50 p-4"><h2 className="font-extrabold">বীজের তথ্য</h2><dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{product.crop_name && <div><dt className="text-slate-500">ফসল</dt><dd className="font-bold">{product.crop_name}</dd></div>}{product.seed_variety && <div><dt className="text-slate-500">জাত</dt><dd className="font-bold">{product.seed_variety}</dd></div>}{product.pack_size && <div><dt className="text-slate-500">প্যাকেটের পরিমাণ</dt><dd className="font-bold">{product.pack_size}</dd></div>}{product.germination_rate != null && <div><dt className="text-slate-500">অঙ্কুরোদ্গম</dt><dd className="font-bold">{product.germination_rate}%</dd></div>}{product.sowing_season && <div><dt className="text-slate-500">বপনের মৌসুম</dt><dd className="font-bold">{product.sowing_season}</dd></div>}{product.suitable_regions && <div><dt className="text-slate-500">উপযোগী অঞ্চল</dt><dd className="font-bold">{product.suitable_regions}</dd></div>}</dl></section>}
          {typeof product.description === "string" && product.description.trim() && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{product.description}</p>}
          <p className="mt-6 text-3xl font-black text-emerald-900">{product.id.startsWith("sample-") ? "নমুনা মূল্য " : ""}৳{Number(product.price || 0).toLocaleString("bn-BD")}</p>
          <p className="mt-2 text-sm text-slate-500">{product.id.startsWith("sample-") ? "ডেমো মজুত: বাস্তব স্টক নয়" : `প্রাপ্য মজুত: ${Number(product.stock || 0).toLocaleString("bn-BD")}`}</p>
          <div className="mt-6">{product.id.startsWith("sample-") ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">এটি শুধু UI প্রিভিউ। নমুনা পণ্যে অর্ডার করা যাবে না।</p> : <CheckoutButton productId={product.id} disabled={Number(product.stock || 0) < 1} />}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">মূল্য ও মজুত পরিবর্তিত হতে পারে। অর্ডার নিশ্চিত করার আগে checkout-এ তথ্য যাচাই করুন।</p>
        </div>
      </div>
    </div>
  </main>;
}
