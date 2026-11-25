import type { Metadata } from "next";
import Link from "next/link";
import { Check, Wheat } from "lucide-react";
import { notFound, redirect } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";
import RelatedProductUpsell from "@/components/marketplace/RelatedProductUpsell";
import ProductClickTracker from "@/components/marketplace/ProductClickTracker";
import ProductImageGallery from "@/components/marketplace/ProductImageGallery";
import ProductShareCard from "@/components/marketplace/ProductShareCard";
import ProductDescription from "@/components/marketplace/ProductDescription";
import SeedProductInformation from "@/components/marketplace/SeedProductInformation";
import { getProductTaxonomy } from "@/lib/marketplace/taxonomy";
import { getSampleProduct } from "@/lib/marketplace/sample-products";
import { productDescriptionToText, sanitizeProductDescription } from "@/lib/marketplace/product-description";

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
  shipping_class?: string | null;
  shipping_weight_grams?: number | null;
  description: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  commission_percent?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  focus_keyword?: string | null;
  seo_keywords?: string[] | null;
  brand?: string | null;
  origin?: string | null;
  highlights?: string[] | null;
  usage_instructions?: string | null;
  image_alt?: string | null;
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
  const columns = "id,slug,name,category,category_slug,subcategory_slug,price,stock,unit,shipping_class,shipping_weight_grams,description,image_url,image_urls,seo_title,seo_description,focus_keyword,seo_keywords,brand,origin,highlights,usage_instructions,image_alt";
  const { data: bySlug } = await supabase.from("products").select(columns).eq("slug", normalized).eq("status", "active").eq("marketplace_channel", "marketplace").is("deleted_at", null).maybeSingle();
  if (bySlug) return bySlug as ProductRecord;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) return null;
  const { data: byId } = await supabase.from("products").select(columns).eq("id", normalized).eq("status", "active").eq("marketplace_channel", "marketplace").is("deleted_at", null).maybeSingle();
  return (byId as ProductRecord | null) ?? null;
}

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false, follow: false } };

  const name = cleanText(product.name);
  // The site layout already defines a title template. Product titles are absolute
  // so the brand is not duplicated in search previews or cut off mid-word.
  const countrySuffix = " in Bangladesh";
  const defaultTitle = name.toLocaleLowerCase().includes("bangladesh") || name.length + countrySuffix.length > 61
    ? name : name + countrySuffix;
  const unbrandedTitle = cleanText(product.seo_title || defaultTitle).replace(/\s*\|\s*AGRIVA\s*$/i, "");
  const titleBase = unbrandedTitle.length > 61
    ? (unbrandedTitle.slice(0, 61).replace(/\s+\S*$/, "").trimEnd() || unbrandedTitle.slice(0, 61))
    : unbrandedTitle;
  const title = titleBase + " | AGRIVA";
  const descriptionText = productDescriptionToText(sanitizeProductDescription(product.description || ""));
  const description = cleanText(product.seo_description || descriptionText || ("Explore " + name + " on AGRIVA Marketplace. Check product details, current price, availability and seller-provided information.")).slice(0, 160);
  const image = product.image_url || (Array.isArray(product.image_urls) ? product.image_urls.find(url => typeof url === "string" && url.trim()) : undefined) || undefined;

  return {
    title: { absolute: title },
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
  const galleryImages = [...new Set([...(Array.isArray(product.image_urls) ? product.image_urls : []), product.image_url].filter((value): value is string => typeof value === "string" && value.trim().length > 0))].slice(0, 4);
  const image = galleryImages[0];
  const description = sanitizeProductDescription(product.description || "");
  // Hard category boundary: no seed information query or rendering for any other category.
  const seedInformation = product.category_slug === "seeds" && !isSample
    ? await (async () => {
        const supabase = await createSupabaseServerClient();
        const [sectionResult, detailResult] = await Promise.all([
          supabase.from("seed_category_content_sections").select("id,title,summary").eq("category_slug", "seeds").eq("is_enabled", true).order("sort_order").order("title"),
          supabase.from("product_seed_details").select("variety_name,germination_rate,purity_rate,seed_treatment,special_warnings,seed_crop_guides(id,crop_name,summary)").eq("product_id", product.id).maybeSingle(),
        ]);
        return { sections: sectionResult.data ?? [], details: detailResult.data ?? null };
      })()
    : null;
  // Show verified, in-stock Marketplace recommendations only. Prioritize the
  // same subcategory/brand without claiming unverified "frequently bought" data.
  const relatedProducts = isSample ? [] : await (async () => {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("products")
      .select("id,slug,name,price,stock,unit,image_url,subcategory_slug,brand")
      .eq("status", "active")
      .eq("marketplace_channel", "marketplace")
      .is("deleted_at", null)
      .neq("id", product.id)
      .gt("stock", 0)
      .not("price", "is", null);
    if (product.category_slug) query = query.eq("category_slug", product.category_slug);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(24);
    if (error) return [];
    const score = (item: { subcategory_slug: string | null; brand: string | null }) =>
      (product.subcategory_slug && item.subcategory_slug === product.subcategory_slug ? 2 : 0)
      + (product.brand && item.brand?.trim().toLowerCase() === product.brand.trim().toLowerCase() ? 1 : 0);
    return (data ?? [])
      .filter(item => Number.isFinite(Number(item.price)) && Number(item.price) >= 0 && Number(item.stock) > 0)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 4);
  })();

  const descriptionText = productDescriptionToText(description);
  const descriptionSummary = descriptionText.length > 210 ? descriptionText.slice(0, 207).replace(/\s+\S*$/, "") + "…" : descriptionText;
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
    ...(galleryImages.length ? { image: galleryImages } : {}),
    ...(descriptionText ? { description: descriptionText } : {}),
    category: product.category || undefined,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.origin ? { countryOfOrigin: product.origin } : {}),
    ...((product.focus_keyword || product.seo_keywords?.length) ? { keywords: [product.focus_keyword, ...(product.seo_keywords || [])].filter(Boolean).join(", ") } : {}),
    ...(product.highlights?.length ? { additionalProperty: product.highlights.slice(0,5).map((value) => ({ "@type": "PropertyValue", name: "Product highlight", value })) } : {}),
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
    <main className="min-h-screen bg-[#f7f9f7] pb-20 text-[#17351f] sm:pb-0"><ProductClickTracker market="marketplace" productId={product.id} categorySlug={product.category_slug} subcategorySlug={product.subcategory_slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />

      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-7">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-y-1 text-xs text-slate-500 sm:mb-4 sm:text-sm">
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


        <section aria-labelledby="product-title" className="grid min-w-0 rounded-2xl border border-emerald-950/10 bg-white shadow-[0_18px_60px_rgba(19,63,43,.08)] lg:grid-cols-[minmax(0,1.03fr)_minmax(0,.97fr)] lg:items-start lg:rounded-3xl">
          <div className="min-w-0 border-b border-slate-100 bg-[#f8faf7] p-3 sm:p-5 lg:sticky lg:top-24 lg:self-start lg:border-b-0 lg:border-r lg:p-6">
            {image ? (
              <ProductImageGallery
                images={galleryImages}
                productName={product.name}
                imageAlt={product.image_alt || (product.name + " — AGRIVA Marketplace product image")}
              />
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-slate-200 bg-white p-6 text-center sm:aspect-square">
                <div>
                  <Wheat size={52} strokeWidth={1.5} aria-hidden="true" className="text-emerald-600" />
                  <p className="mt-3 text-sm text-slate-600">এই পণ্যের ছবি এখনো যোগ করা হয়নি।</p>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 px-4 pb-6 pt-5 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {(category || product.category) && <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-800">{category?.name || product.category}</span>}
              {isSample && <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-900">নমুনা প্রিভিউ</span>}
              {product.brand && <span className="min-w-0 break-words text-slate-500">{product.brand}</span>}
            </div>

            <h1 id="product-title" className="mt-3 break-words text-[1.5rem] font-black leading-[1.35] tracking-tight text-slate-950 sm:text-[1.85rem] lg:text-[2.1rem]">{product.name}</h1>
            {product.origin && <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">উৎপত্তিস্থল: {product.origin}</p>}

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#eff9f1] to-[#f9fcf8] px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-xs font-semibold text-emerald-800">বর্তমান মূল্য</p>
              <p className="mt-1 break-words text-[2rem] font-black tracking-tight text-[#123d2b] sm:text-[2.5rem]">{isSample && product.price !== null ? "নমুনা · " : ""}{formattedPrice}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                <span className={Number(product.stock) > 0 && !isSample ? "font-bold text-emerald-800" : "font-bold text-rose-700"}>{stockLabel}</span>
                {hasStock && !isSample && <span className="text-slate-600">মজুত: {Number(product.stock).toLocaleString("en-BD")}{unitLabel ? " " + unitLabel : ""}</span>}
              </div>
            </div>

            {descriptionSummary && (
              <div className="mt-3 sm:mt-4">
                <p className="line-clamp-3 break-words text-sm leading-6 text-slate-600">{descriptionSummary}</p>
                {description && <a href="#product-description" className="mt-1.5 inline-flex min-h-9 items-center text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950">সম্পূর্ণ বিবরণ দেখুন</a>}
              </div>
            )}

            <div className="mt-4 grid gap-2 text-xs font-semibold text-emerald-950 sm:grid-cols-2">
              <p className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5"><Check size={16} aria-hidden="true" className="text-emerald-700" /> ক্যাশ অন ডেলিভারিতে অর্ডার</p>
              <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"><span className="text-base" aria-hidden="true">৳</span> চূড়ান্ত চার্জ অর্ডারের আগে দেখুন</p>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              {isSample ? (
                <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">এটি শুধু UI প্রিভিউ। নমুনা পণ্যে অর্ডার করা যাবে না।</p>
              ) : (
                <CheckoutButton productId={product.id} productSlug={product.slug} productName={product.name} unitPrice={Number(product.price)} stock={Number(product.stock ?? 0)} unitLabel={unitLabel || (product.slug === "black-rice-seeds" ? "কেজি" : "টি")} shippingClass={product.shipping_class ?? null} shippingWeightGrams={product.shipping_weight_grams ?? null} disabled={!hasRealPrice || !hasStock || Number(product.stock) < 1} />
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">অর্ডার নিশ্চিত করার আগে পণ্যের পরিমাণ, স্টক ও ডেলিভারিসহ মোট মূল্য যাচাই করুন।</p>
            <ProductShareCard productName={product.name} productUrl={productUrl} imageUrl={image || null} priceLabel={formattedPrice} />
          </div>
        </section>

        <nav aria-label="পণ্যের তথ্য দ্রুত দেখুন" className="mt-4 flex min-w-0 items-center gap-2 overflow-x-auto pb-1 text-xs font-bold sm:mt-5 sm:text-sm">
          <a href="#product-details" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-emerald-200 bg-white px-4 text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">পণ্যের তথ্য</a>
          {description && <a href="#product-description" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-emerald-200 bg-white px-4 text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">সম্পূর্ণ বিবরণ</a>}
          {relatedProducts.length > 0 && <a href="#related-marketplace-products" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-emerald-200 bg-white px-4 text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">সম্পর্কিত পণ্য</a>}
          <a href="#product-faq-heading" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-emerald-200 bg-white px-4 text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">সাধারণ প্রশ্ন</a>
        </nav>

        <div className="mt-4 min-w-0 space-y-5 sm:mt-6 sm:space-y-6">
          <section id="product-details" aria-labelledby="product-details-heading" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Product information</p>
                <h2 id="product-details-heading" className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">পণ্যের বিস্তারিত তথ্য</h2>
              </div>
              <span className="text-xs text-slate-500">AGRIVA Marketplace</span>
            </div>

            <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
              <div className="border-b border-slate-100 py-3">
                <dt className="text-xs font-semibold text-slate-500">পণ্যের নাম</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{product.name}</dd>
              </div>
              {product.category && <div className="border-b border-slate-100 py-3">
                <dt className="text-xs font-semibold text-slate-500">ক্যাটাগরি</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{category ? <Link className="text-emerald-800 underline underline-offset-4" href={"/marketplace/category/" + category.slug}>{category.name}</Link> : product.category}</dd>
              </div>}
              <div className="border-b border-slate-100 py-3"><dt className="text-xs font-semibold text-slate-500">মূল্য</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{formattedPrice}</dd></div>
              <div className="border-b border-slate-100 py-3"><dt className="text-xs font-semibold text-slate-500">প্রাপ্যতা</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{stockLabel}</dd></div>
              {product.brand && <div className="border-b border-slate-100 py-3"><dt className="text-xs font-semibold text-slate-500">ব্র্যান্ড</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{product.brand}</dd></div>}
              {product.origin && <div className="border-b border-slate-100 py-3"><dt className="text-xs font-semibold text-slate-500">উৎপত্তিস্থল</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{product.origin}</dd></div>}
            </dl>

            {product.highlights && product.highlights.length > 0 && (
              <div className="mt-5">
                <h3 className="text-base font-extrabold text-slate-900">মূল বৈশিষ্ট্য</h3>
                <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                  {product.highlights.slice(0, 6).map(item => <li key={item} className="flex min-w-0 gap-2"><Check size={16} className="mt-1 shrink-0 text-emerald-700" aria-hidden="true" /><span className="break-words">{item}</span></li>)}
                </ul>
              </div>
            )}

            <div id="product-description" className="mt-5 scroll-mt-28 border-t border-slate-100 pt-5">
              {description ? <ProductDescription html={description} /> : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">পণ্যের বিস্তারিত বিবরণ এখনো যুক্ত হয়নি। অর্ডারের আগে বিক্রেতার কাছ থেকে specification নিশ্চিত করুন।</p>
              )}
            </div>
            {product.usage_instructions && (
              <section className="mt-5 rounded-xl bg-emerald-50 p-4">
                <h3 className="text-base font-extrabold text-emerald-950">ব্যবহার ও প্রয়োগ নির্দেশনা</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{product.usage_instructions}</p>
              </section>
            )}
          </section>

          {seedInformation && <SeedProductInformation sections={seedInformation.sections} details={seedInformation.details} />}

          {relatedProducts.length > 0 && (
            <div id="related-marketplace-products" className="scroll-mt-28">
            <RelatedProductUpsell
              products={relatedProducts}
              heading={product.category_slug === "seeds" ? "আপনার প্রয়োজন হতে পারে এমন আরও বীজ" : "সম্পর্কিত আরও পণ্য"}
              subtitle="একই ধরনের আরও পণ্য দেখুন। প্রয়োজন অনুযায়ী একই কার্টে যোগ করতে পারবেন।"
              categoryHref={category ? "/marketplace/category/" + category.slug : "/marketplace"}
            />
            </div>
          )}

          <section aria-labelledby="product-faq-heading" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <h2 id="product-faq-heading" className="text-xl font-extrabold text-slate-950 sm:text-2xl">সাধারণ জিজ্ঞাসা</h2>
            <div className="mt-3 divide-y divide-slate-100">
              {faqs.map(faq => (
                <details key={faq.question} className="group py-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold leading-6 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:text-base">
                    <span className="min-w-0">{faq.question}</span>
                    <span aria-hidden="true" className="shrink-0 text-lg text-emerald-700 transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-500">
          পণ্যের তথ্য বিক্রেতার দেওয়া listing-এর ভিত্তিতে দেখানো হয়। কেনার আগে specification, প্রাপ্যতা, মূল্য ও সরবরাহের শর্ত নিশ্চিত করুন।
        </footer>
      </div>
    </main>
  );
}
