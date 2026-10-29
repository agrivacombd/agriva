import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";
import { getProductTaxonomy } from "@/lib/marketplace/taxonomy";
import { getSampleProduct } from "@/lib/marketplace/sample-products";

type ProductPageProps = { params: Promise<{ productId: string }> };
type SeoFaq = { question: string; answer: string };
type ProductImageVariant = { image_url: string; card_url: string; thumbnail_url: string; width: number; height: number; alt: string; filename: string };
type ProductRecord = { id: string; slug: string; name: string; category: string | null; category_slug?: string | null; subcategory_slug?: string | null; price: number | string | null; stock: number | null; description: string | null; image_url?: string | null; image_urls?: string[] | null; image_variants?: ProductImageVariant[] | null; product_attributes?: Record<string, string> | null; seo_title?: string | null; seo_description?: string | null; seo_keywords?: string[] | null; seo_content?: string | null; seo_faqs?: SeoFaq[] | null; seo_image_alt_texts?: string[] | null; commission_percent?: number | null };

function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC").trim().toLocaleLowerCase();
  } catch {
    return value.normalize("NFC").trim().toLocaleLowerCase();
  }
}

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max - 1);
  const boundary = slice.lastIndexOf(" ");
  return `${(boundary > max * 0.65 ? slice.slice(0, boundary) : slice).trim()}…`;
}

async function getPublicProduct(slugOrId: string): Promise<ProductRecord | null> {
  const normalized = normalizeSlug(slugOrId);
  const sample = process.env.NODE_ENV !== "production" ? getSampleProduct(normalized) : null;
  if (sample) return { ...sample, id: sample.id, slug: sample.slug, commission_percent: null } as ProductRecord;

  const supabase = await createSupabaseServerClient();
  const columns = "id,slug,name,category,category_slug,subcategory_slug,price,stock,description,image_url,image_urls,image_variants,product_attributes,seo_title,seo_description,seo_keywords,seo_content,seo_faqs,seo_image_alt_texts";
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
  const taxonomy = getProductTaxonomy(product.category, product.category_slug, product.subcategory_slug);
  const isPlantProduct = taxonomy?.category.slug === "plants-gardening";
  const titleSuffix = isPlantProduct ? "AGRIVA Plant Market" : "AGRIVA Marketplace";
  const fallbackTitle = `${truncate(product.name, isPlantProduct ? 40 : 43)} | ${titleSuffix}`;
  const title = truncate(cleanText(product.seo_title) || fallbackTitle, 70);
  const rawDescription = cleanText(product.description);
  const fallbackDescription = `AGRIVA-তে ${product.name}${product.price !== null && Number.isFinite(Number(product.price)) ? ` — মূল্য ৳${Number(product.price).toLocaleString("en-BD")}` : ""}। পণ্যের ছবি, বিবরণ ও মজুতের তথ্য দেখুন।`;
  const description = truncate(cleanText(product.seo_description) || (rawDescription.length >= 60 ? rawDescription : fallbackDescription), 155);
  const canonicalPath = `/marketplace/${product.slug}`;
  const imageVariants = (Array.isArray(product.image_variants) ? product.image_variants : []).filter((item): item is ProductImageVariant => Boolean(item && typeof item.image_url === "string" && typeof item.card_url === "string" && typeof item.thumbnail_url === "string" && Number.isFinite(item.width) && Number.isFinite(item.height) && typeof item.alt === "string")).slice(0, 4).map((item, index) => ({ ...item, alt: product.seo_image_alt_texts?.[index] || item.alt }));
  const image = imageVariants[0]?.image_url || product.image_url || product.image_urls?.[0] || undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalPath },
    ...(product.seo_keywords?.length ? { keywords: product.seo_keywords } : {}),
    ...(product.id.startsWith("sample-") ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, type: "website", locale: "bn_BD", url: canonicalPath, ...(image ? { images: [{ url: image, alt: product.name }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
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
  const isPlantProduct = category?.slug === "plants-gardening";
  const canonicalPath = `/marketplace/${product.slug}`;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const hasRealPrice = !product.id.startsWith("sample-") && product.price !== null && Number.isFinite(Number(product.price)) && Number(product.price) > 0;
  const imageVariants = (Array.isArray(product.image_variants) ? product.image_variants : []).filter((item): item is ProductImageVariant => Boolean(item && typeof item.image_url === "string" && typeof item.card_url === "string" && typeof item.thumbnail_url === "string" && Number.isFinite(item.width) && Number.isFinite(item.height) && typeof item.alt === "string")).slice(0, 4).map((item, index) => ({ ...item, alt: product.seo_image_alt_texts?.[index] || item.alt }));
  const productImages = Array.from(new Set([...(imageVariants.length ? imageVariants.map((item) => item.image_url) : product.image_urls ?? []), ...(product.image_url ? [product.image_url] : [])])).slice(0, 4);
  const hasRealImage = !product.id.startsWith("sample-") && productImages.length > 0;
  const description = cleanText(product.description);
  const seoContent = (product.seo_content ?? "").replace(/<[^>]*>/g, " ").replace(/\r\n?/g, "\n").trim();
  const attributeLabels: Record<string, string> = { brand: "ব্র্যান্ড / প্রস্তুতকারক", sku: "Seller SKU", condition: "পণ্যের অবস্থা", crop_name: "ফসল", variety: "জাত / variety", pack_size: "প্যাক সাইজ", germination_rate: "Germination rate (%)", batch_number: "Lot / batch number", expiry_date: "মেয়াদ শেষের তারিখ", fertilizer_type: "সারের ধরন", composition: "Composition", usage_instructions: "ব্যবহারবিধি", active_ingredient: "Active ingredient", registration_number: "Registration number", plant_size: "গাছের আকার", suitable_season: "উপযুক্ত মৌসুম", care_instructions: "যত্নের নির্দেশনা", model: "Model", material: "উপাদান", dimensions: "মাপ", warranty: "Warranty", food_type: "পণ্যের ধরন", ingredients: "উপাদান", origin: "উৎপত্তিস্থল" };
  const productAttributes = Object.entries(product.product_attributes && typeof product.product_attributes === "object" ? product.product_attributes : {}).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim())).slice(0, 24);
  const productAttributeMap = Object.fromEntries(productAttributes);
  const condition = (productAttributeMap.condition || "").toLowerCase();
  const schemaCondition = condition === "new" ? "NewCondition" : condition === "used" ? "UsedCondition" : condition === "refurbished" ? "RefurbishedCondition" : null;
  const seoFaqs = (Array.isArray(product.seo_faqs) ? product.seo_faqs : []).filter((faq) => faq && typeof faq.question === "string" && faq.question.trim() && typeof faq.answer === "string" && faq.answer.trim()).slice(0, 8);
  const hasProductRichResultData = hasRealPrice && hasRealImage && product.stock !== null && product.stock !== undefined;
  const graph = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: base },
        { "@type": "ListItem", position: 2, name: isPlantProduct ? "Plant Market" : "Marketplace", item: `${base}${isPlantProduct ? "/plant-market" : "/marketplace"}` },
        ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${base}/marketplace/category/${category.slug}` }] : []),
        ...(subcategory ? [{ "@type": "ListItem", position: category ? 4 : 3, name: subcategory.name, item: `${base}/marketplace/category/${category?.slug}/${subcategory.slug}` }] : []),
        { "@type": "ListItem", position: 3 + (category ? 1 : 0) + (subcategory ? 1 : 0), name: product.name, item: `${base}${canonicalPath}` },
      ],
    },
    ...(seoFaqs.length ? [{
      "@type": "FAQPage",
      mainEntity: seoFaqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
    }] : []),
    ...(hasProductRichResultData ? [{
      "@type": "Product",
      "@id": `${base}${canonicalPath}#product`,
      name: product.name,
      url: `${base}${canonicalPath}`,
      image: productImages,
      ...(description ? { description } : {}),
      ...(product.category ? { category: product.category } : {}),
      ...(productAttributeMap.brand ? { brand: { "@type": "Brand", name: productAttributeMap.brand } } : {}),
      ...(productAttributeMap.sku ? { sku: productAttributeMap.sku } : {}),
      ...(schemaCondition ? { itemCondition: "https://schema.org/" + schemaCondition } : {}),
      ...(productAttributes.length ? { additionalProperty: productAttributes.map(([key, value]) => ({ "@type": "PropertyValue", name: attributeLabels[key] || key, value })) } : {}),
      offers: {
        "@type": "Offer",
        url: `${base}${canonicalPath}`,
        priceCurrency: "BDT",
        price: Number(product.price),
        availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    }] : []),
  ];
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };
  const marketHref = isPlantProduct ? "/plant-market" : "/marketplace";

  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span><Link href={marketHref} className="hover:text-emerald-800">{isPlantProduct ? "Plant Market" : "মার্কেটপ্লেস"}</Link>{category && <><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}`} className="hover:text-emerald-800">{category.name}</Link>{subcategory && <><span className="mx-2" aria-hidden="true">/</span><Link href={`/marketplace/category/${category.slug}/${subcategory.slug}`} className="hover:text-emerald-800">{subcategory.name}</Link></>}</>}<span className="mx-2" aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-slate-700">{product.name}</span></nav>
      <div className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-[.85fr_1.15fr]">
        <div className="flex min-h-56 flex-col justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-5 md:min-h-[420px]">{productImages.length ? <><img src={imageVariants[0]?.image_url || productImages[0]} srcSet={imageVariants[0] ? imageVariants[0].thumbnail_url + " 320w, " + imageVariants[0].card_url + " 640w, " + imageVariants[0].image_url + " 1200w" : undefined} sizes="(max-width: 768px) 100vw, 42vw" alt={imageVariants[0]?.alt || (product.name + " — " + (isPlantProduct ? "Plant Market" : "AGRIVA"))} width={imageVariants[0]?.width || 720} height={imageVariants[0]?.height || 720} fetchPriority="high" decoding="async" className="max-h-[420px] w-full rounded-2xl object-contain" />{productImages.length > 1 && <div className="mt-3 grid grid-cols-3 gap-2">{productImages.slice(1).map((src, index) => { const variant = imageVariants[index + 1]; return <img key={src} src={variant?.thumbnail_url || src} srcSet={variant ? variant.thumbnail_url + " 320w, " + variant.card_url + " 640w" : undefined} sizes="(max-width: 768px) 30vw, 12vw" alt={variant?.alt || (product.name + " — অতিরিক্ত ছবি " + (index + 2))} width={variant?.width || 180} height={variant?.height || 180} loading="lazy" decoding="async" className="h-20 w-full rounded-xl border border-emerald-900/10 bg-white object-contain sm:h-24" />; })}</div>}</> : <div className="text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm" aria-hidden="true">🌾</span><p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">AGRIVA Marketplace</p></div>}</div>
        <div className="p-5 sm:p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-600" /> {product.id.startsWith("sample-") ? "নমুনা পণ্য · প্রিভিউ" : "অনুমোদিত পণ্য"}</span>
          <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          {product.category && <p className="mt-3 text-sm font-bold text-emerald-800">{product.category}</p>}
          {description && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
          <p className="mt-6 text-3xl font-black text-emerald-900">{product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price)) ? <>{product.id.startsWith("sample-") ? "নমুনা মূল্য " : ""}৳{Number(product.price).toLocaleString("bn-BD")}</> : "মূল্য উল্লেখ নেই"}</p>
          <p className="mt-2 text-sm text-slate-500">{product.id.startsWith("sample-") ? "ডেমো মজুত: বাস্তব স্টক নয়" : product.stock !== null && product.stock !== undefined ? `প্রাপ্য মজুত: ${Number(product.stock).toLocaleString("bn-BD")}` : "মজুতের তথ্য নেই"}</p>
          <div className="mt-6">{product.id.startsWith("sample-") ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">এটি শুধু UI প্রিভিউ। নমুনা পণ্যে অর্ডার করা যাবে না।</p> : <CheckoutButton productId={product.id} disabled={Number(product.stock || 0) < 1} />}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">মূল্য ও মজুত পরিবর্তিত হতে পারে। অর্ডার নিশ্চিত করার আগে checkout-এ তথ্য যাচাই করুন।</p>
        </div>
      </div>
      {productAttributes.length > 0 && <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"><h2 className="text-xl font-black sm:text-2xl">পণ্যের বৈশিষ্ট্য</h2><dl className="mt-4 grid gap-3 sm:grid-cols-2">{productAttributes.map(([key, value]) => <div key={key} className="rounded-xl bg-[#f7faf5] p-3"><dt className="text-xs font-bold text-slate-500">{attributeLabels[key] || key.replace(/_/g, " ")}</dt><dd className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></section>}
      {seoContent && <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"><h2 className="text-xl font-black sm:text-2xl">পণ্য সম্পর্কে বিস্তারিত</h2><div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{seoContent}</div></section>}
      {seoFaqs.length > 0 && <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"><h2 className="text-xl font-black sm:text-2xl">সাধারণ জিজ্ঞাসা</h2><div className="mt-4 divide-y divide-emerald-950/10">{seoFaqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="py-4 first:pt-0 last:pb-0"><summary className="cursor-pointer font-bold text-slate-800">{faq.question}</summary><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}</div></section>}
    </div>
  </main>;
}
