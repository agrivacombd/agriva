import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";
import { getProductTaxonomy } from "@/lib/marketplace/taxonomy";
import { getSampleProduct } from "@/lib/marketplace/sample-products";

type ProductPageProps = { params: Promise<{ productId: string }> };
type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  category_slug?: string | null;
  subcategory_slug?: string | null;
  price: number | string | null;
  stock: number | null;
  unit?: string | null;
  description: string | null;
  image_url?: string | null;
  commission_percent?: number | null;
  brand_name?: string | null;
  sku?: string | null;
  short_description?: string | null;
  origin_district?: string | null;
  unit_label?: string | null;
  composition?: string | null;
  usage_instructions?: string | null;
  safety_information?: string | null;
  packaging_details?: string | null;
  image_urls?: string[] | null;
  image_alt_text?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  seo_faqs?: { question: string; answer: string }[] | null;
};

function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC").trim().toLocaleLowerCase();
  } catch {
    return value.normalize("NFC").trim().toLocaleLowerCase();
  }
}

async function getPublicProduct(slugOrId: string): Promise<ProductRecord | null> {
  const normalized = normalizeSlug(slugOrId);
  const sample = process.env.NODE_ENV !== "production" ? getSampleProduct(normalized) : null;
  if (sample) return { ...sample, id: sample.id, slug: sample.slug, commission_percent: null } as ProductRecord;

  const supabase = await createSupabaseServerClient();
  const legacyColumns = "id,slug,name,category,category_slug,subcategory_slug,price,stock,unit,description,image_url";
  const seoColumns = legacyColumns + ",brand_name,sku,short_description,origin_district,unit_label,composition,usage_instructions,safety_information,packaging_details,image_urls,image_alt_text,seo_title,meta_description,seo_faqs";
  const load = async (columnSet: string) => supabase.from("products").select(columnSet).eq("slug", normalized).eq("status", "active").maybeSingle();
  let { data: bySlug, error } = await load(seoColumns);
  if (error) ({ data: bySlug } = await load(legacyColumns));
  if (bySlug) return bySlug as ProductRecord;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) return null;
  const byIdSeo = await supabase.from("products").select(seoColumns).eq("id", normalized).eq("status", "active").maybeSingle();
  if (byIdSeo.data) return byIdSeo.data as ProductRecord;
  const byIdLegacy = await supabase.from("products").select(legacyColumns).eq("id", normalized).eq("status", "active").maybeSingle();
  return (byIdLegacy.data as ProductRecord | null) ?? null;
}

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };

  const name = cleanText(product.name);
  const title = cleanText(product.seo_title || (name.toLocaleLowerCase().includes("bangladesh") ? name + " | AGRIVA" : name + " in Bangladesh | AGRIVA")).slice(0, 70);
  const description = cleanText(product.meta_description || product.short_description || product.description || ("Explore " + name + " on AGRIVA Marketplace. Check product details, current price, availability and seller-provided information.")).slice(0, 180);
  const image = product.image_url || product.image_urls?.[0] || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    ...(product.id.startsWith("sample-") ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "bn_BD",
      url: "/marketplace/" + product.slug,
      ...(image ? { images: [{ url: image, alt: name + " product image" }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();
  if (normalizeSlug(productId) !== product.slug) redirect(`/marketplace/${product.slug}`);

  const taxonomy = getProductTaxonomy(product.category, product.category_slug, product.subcategory_slug);
  const category = taxonomy?.category;
  const subcategory = taxonomy?.subcategory;
  const canonicalPath = "/marketplace/" + product.slug;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const productUrl = base + canonicalPath;
  const isSample = product.id.startsWith("sample-");
  const hasRealPrice = !isSample && product.price !== null && Number.isFinite(Number(product.price)) && Number(product.price) >= 0;
  const hasStock = product.stock !== null && product.stock !== undefined;
  const image = product.image_url?.trim() || undefined;
  const description = product.description?.trim() || "";
  const descriptionSummary = description.length > 260 ? description.slice(0, 257).replace(/\\s+\\S*$/, "") + "…" : description;
  const unitLabels: Record<string, string> = { kg: "কেজি", g: "গ্রাম", piece: "পিস", pack: "প্যাকেট", liter: "লিটার", bag: "বস্তা" };
  const unitLabel = product.unit ? unitLabels[product.unit] || null : null;
  const formattedPrice = product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price))
    ? "৳" + Number(product.price).toLocaleString("en-BD") + (unitLabel ? " / " + unitLabel : "")
    : "মূল্য উল্লেখ নেই";
  const stockLabel = isSample
    ? "নমুনা তথ্য · বাস্তব স্টক নয়"
    : hasStock
      ? Number(product.stock) > 0
        ? "স্টকে আছে"
        : "স্টকে নেই"
      : "মজুতের তথ্য নেই";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: productUrl,
    ...(image ? { image: [image] } : {}),
    ...(description ? { description } : {}),
    category: product.category || undefined,
    ...(product.brand_name ? { brand: { "@type": "Brand", name: product.brand_name } } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(hasRealPrice ? {
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: Number(product.price),
        ...(hasStock ? { availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } : {}),
        url: productUrl,
      },
    } : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: base },
      { "@type": "ListItem", position: 2, name: "মার্কেটপ্লেস", item: base + "/marketplace" },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: base + "/marketplace/category/" + category.slug }] : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: product.name, item: productUrl },
    ],
  };
  const faqs = [
    {
      question: product.name + " এর দাম কত?",
      answer: product.price !== null && product.price !== undefined
        ? "এই listing-এ দেখানো বর্তমান মূল্য " + formattedPrice + "। অর্ডারের আগে checkout-এ চূড়ান্ত মূল্য ও প্রযোজ্য চার্জ যাচাই করুন।"
        : "এই listing-এ মূল্য উল্লেখ নেই। মূল্য জানতে বিক্রেতার সঙ্গে যোগাযোগ করুন বা পণ্যের অর্ডার-সংক্রান্ত নির্দেশনা দেখুন।",
    },
    {
      question: product.name + " কি এখন পাওয়া যাচ্ছে?",
      answer: isSample
        ? "এটি শুধু প্রিভিউ নমুনা; বাস্তব বিক্রির তালিকা বা স্টক নয়।"
        : hasStock
          ? Number(product.stock) > 0 ? "Listing অনুযায়ী বর্তমানে মজুত আছে। অর্ডার নিশ্চিত করার সময় স্টক আবার যাচাই করুন।" : "Listing অনুযায়ী বর্তমানে স্টক নেই। প্রাপ্যতা জানতে বিক্রেতার সঙ্গে যোগাযোগ করুন।"
          : "এই listing-এ মজুতের তথ্য দেওয়া নেই। অর্ডারের আগে বিক্রেতার কাছ থেকে প্রাপ্যতা নিশ্চিত করুন।",
    },
    {
      question: "কেনার আগে কী কী যাচাই করা উচিত?",
      answer: "পণ্যের নাম ও ধরন, প্যাকেটের পরিমাণ, বিক্রেতার দেওয়া specification, মূল্য, মজুত, ডেলিভারি এবং প্রযোজ্য শর্ত যাচাই করুন। প্রয়োজন হলে অর্ডারের আগে বিক্রেতার কাছে অতিরিক্ত তথ্য চান।",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-y-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-800">হোম</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link>
          {category && <>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href={"/marketplace/category/" + category.slug} className="hover:text-emerald-800">{category.name}</Link>
          </>}
          {subcategory && <>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href={"/marketplace/category/" + category?.slug + "/" + subcategory.slug} className="hover:text-emerald-800">{subcategory.name}</Link>
          </>}
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-slate-700">{product.name}</span>
        </nav>

        <section aria-labelledby="product-title" className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-100 p-5 sm:min-h-[420px] sm:p-8 md:h-[560px] md:min-h-0 md:p-10">
            {image ? (
              <img
                src={image}
                alt={product.image_alt_text || product.name + " — product photo on AGRIVA Marketplace"}
                width={900}
                height={900}
                fetchPriority="high"
                decoding="async"
                className="block h-[260px] w-full max-w-[560px] rounded-2xl object-contain sm:h-[360px] md:h-[480px]"
              />
            ) : (
              <div className="flex max-w-xs flex-col items-center text-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm" aria-hidden="true">🌾</span>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">AGRIVA Marketplace</p>
                <p className="mt-2 text-sm text-slate-500">এই পণ্যের ছবি এখনো যোগ করা হয়নি।</p>
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-full border border-emerald-900/10 bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm">AGRIVA Marketplace</span>
          </div>

          <div className="flex flex-col p-5 sm:p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                {isSample ? "নমুনা পণ্য · প্রিভিউ" : "পণ্যের বিবরণ"}
              </span>
              {product.category && <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">{product.category}</span>}
            </div>

            <h1 id="product-title" className="mt-5 break-words text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.7rem]">{product.name}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              {descriptionSummary || "এই পণ্যের উপলভ্য তথ্য, মূল্য ও মজুত দেখে সিদ্ধান্ত নিন। বিস্তারিত specification নিশ্চিত করতে বিক্রেতার দেওয়া তথ্য যাচাই করুন।"}
            </p>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">বর্তমান তালিকাভুক্ত মূল্য</p>
              <p className="mt-1 text-3xl font-black text-emerald-950">{isSample && product.price !== null ? "নমুনা মূল্য · " : ""}{formattedPrice}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-700">{stockLabel}</span>
                {hasStock && !isSample && <span className="rounded-lg bg-white px-3 py-2 text-slate-600">স্টক: {Number(product.stock).toLocaleString("en-BD")}{unitLabel ? " " + unitLabel : " (একক উল্লেখ নেই)"}</span> }
              </div>
            </div>

            <div className="mt-6">
              {isSample ? (
                <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">এটি শুধু UI প্রিভিউ। নমুনা পণ্যে অর্ডার করা যাবে না।</p>
              ) : (
                <CheckoutButton productId={product.id} disabled={Number(product.stock || 0) < 1} />
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">অর্ডারের আগে পণ্যের specification, পরিমাণ, ডেলিভারি ও চূড়ান্ত মূল্য যাচাই করুন। মূল্য ও মজুত পরিবর্তিত হতে পারে।</p>
            <a href="#product-details" className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700">পণ্যের বিস্তারিত দেখুন ↓</a>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <section id="product-details" className="scroll-mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Product information</p>
              <h2 className="mt-2 text-2xl font-black">পণ্যের বিস্তারিত তথ্য</h2>
              <dl className="mt-5 divide-y divide-slate-100">
                <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-sm font-bold text-slate-500">পণ্যের নাম</dt>
                  <dd className="break-words text-sm font-semibold text-slate-900">{product.name}</dd>
                </div>
                {product.category && <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"><dt className="text-sm font-bold text-slate-500">ক্যাটাগরি</dt><dd className="text-sm font-semibold text-slate-900">{category ? <Link className="text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={"/marketplace/category/" + category.slug}>{category.name}</Link> : product.category}</dd></div>}
                <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"><dt className="text-sm font-bold text-slate-500">মূল্য</dt><dd className="text-sm font-semibold text-slate-900">{formattedPrice}</dd></div>
                <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"><dt className="text-sm font-bold text-slate-500">প্রাপ্যতা</dt><dd className="text-sm font-semibold text-slate-900">{stockLabel}</dd></div>
                {description && <div className="border-t border-slate-100 py-5"><dt className="text-base font-extrabold text-slate-900">বিবরণ</dt><dd className="mt-3 min-w-0 text-sm leading-8 text-slate-700"><p className="whitespace-pre-line break-words">{descriptionSummary}</p>{description.length > 260 && <details className="mt-3"><summary className="inline-flex min-h-10 cursor-pointer items-center rounded-lg font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">সম্পূর্ণ বিবরণ পড়ুন <span aria-hidden="true" className="ml-1">＋</span></summary><p className="mt-3 whitespace-pre-line break-words">{description}</p></details>}</dd></div>}
              </dl>
              {!description && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">এই পণ্যের বিস্তারিত বিবরণ বিক্রেতার কাছ থেকে নিশ্চিত করুন। সঠিক তথ্য যোগ করলে ক্রেতার সিদ্ধান্ত নেওয়া সহজ হবে এবং পেজের নিজস্ব উপযোগী কনটেন্টও বাড়বে।</p>}
            </section>

            {(product.brand_name || product.sku || product.origin_district || product.unit_label || product.composition || product.usage_instructions || product.safety_information || product.packaging_details) && <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Verified product attributes</p><h2 className="mt-2 text-2xl font-black">পণ্যের অতিরিক্ত তথ্য</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2">{[["ব্র্যান্ড",product.brand_name],["SKU",product.sku],["উৎপত্তির জেলা",product.origin_district],["প্যাক / একক",product.unit_label],["উপাদান",product.composition],["প্যাকেজিং",product.packaging_details],["ব্যবহারবিধি",product.usage_instructions],["সতর্কতা ও নিরাপত্তা",product.safety_information]].filter((item): item is [string,string] => Boolean(item[1])).map(([term,value])=><div key={term} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold text-slate-500">{term}</dt><dd className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-800">{value}</dd></div>)}</dl></section>}

            {product.seo_faqs?.length ? <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Product FAQ</p><h2 className="mt-2 text-2xl font-black">সাধারণ জিজ্ঞাসা</h2><div className="mt-4 divide-y divide-slate-100">{product.seo_faqs.map((faq,index)=><details key={index} className="py-4"><summary className="cursor-pointer font-bold text-slate-900">{faq.question}</summary><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}</div></section> : null}

            <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Buyer guide</p>
              <h2 className="mt-2 text-2xl font-black">কেনার আগে যা যাচাই করবেন</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">সঠিক পণ্য বেছে নিতে শুধু নাম ও দাম নয়, প্যাকেটের পরিমাণ, পণ্যের ধরন, বিক্রেতার specification এবং সরবরাহের শর্তও যাচাই করুন।</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">1</span><span><strong>পণ্যের পরিচয়:</strong> নাম, variety বা model এবং প্যাকেটের label মিলিয়ে নিন।</span></li>
                <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">2</span><span><strong>মূল্য ও পরিমাণ:</strong> তালিকাভুক্ত মূল্য কোন unit বা প্যাকেটের জন্য তা নিশ্চিত করুন।</span></li>
                <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">3</span><span><strong>প্রাপ্যতা ও ডেলিভারি:</strong> মজুত, delivery area, সময় এবং অতিরিক্ত চার্জ জেনে নিন।</span></li>
                <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">4</span><span><strong>প্রয়োজনীয় প্রমাণ:</strong> বীজ হলে variety, lot/label ও germination সংক্রান্ত উপলভ্য তথ্য; অন্য পণ্য হলে প্রাসঙ্গিক specification যাচাই করুন।</span></li>
              </ul>
            </section>

            <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">FAQs</p>
              <h2 className="mt-2 text-2xl font-black">সাধারণ জিজ্ঞাসা</h2>
              <div className="mt-4 divide-y divide-slate-100">
                {faqs.map((faq) => <details key={faq.question} className="group py-4">
                  <summary className="cursor-pointer list-none pr-6 text-base font-extrabold leading-6 text-slate-900 marker:content-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{faq.question}<span aria-hidden="true" className="float-right ml-3 text-emerald-800 transition group-open:rotate-45">＋</span></summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>)}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl bg-[#103f2b] p-5 text-white shadow-sm sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-lime-300">Need more information?</p>
              <h2 className="mt-3 text-xl font-black">পণ্যটি সম্পর্কে নিশ্চিত হয়ে নিন</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/85">পণ্যের specification, পরিমাণ, মূল্য বা সরবরাহ সম্পর্কে নিশ্চিত না হলে অর্ডারের আগে তথ্য যাচাই করুন।</p>
              <a href="#product-details" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200">বিস্তারিত ও শর্ত দেখুন</a>
            </section>
            <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm">
              <h2 className="font-black">আরও পণ্য খুঁজুন</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">AGRIVA Marketplace-এ অন্যান্য কৃষিপণ্য ও উপলভ্য listing দেখুন।</p>
              {category && <Link href={"/marketplace/category/" + category.slug} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-800 px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50">{category.name} দেখুন</Link>}
              <Link href="/marketplace" className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-900 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800">সব পণ্য দেখুন</Link>
            </section>
          </aside>
        </div>

        <footer className="mt-8 rounded-2xl border border-emerald-950/10 bg-white px-5 py-4 text-xs leading-6 text-slate-500">
          পণ্যের তথ্য বিক্রেতার দেওয়া listing-এর ভিত্তিতে দেখানো হয়। কেনার আগে specification, প্রাপ্যতা, মূল্য ও সরবরাহের শর্ত নিশ্চিত করুন।
        </footer>
      </div>
    </main>
  );
}
