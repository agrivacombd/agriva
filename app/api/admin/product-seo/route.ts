import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin/authz";
import { getCategory, getSubcategory, slugifyProductName } from "@/lib/marketplace/taxonomy";

type Faq = { question: string; answer: string };
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
const list = (value: unknown, maxItems: number, maxLength: number): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string")
      .map(item => text(item, maxLength)).filter(Boolean))].slice(0, maxItems)
    : [];

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("catalog.create");
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "সঠিক product payload দিন।" }, { status: 400 });
  }

  const name = text(body.name, 160);
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 10000) : "";
  const shortDescription = text(body.short_description, 320);
  const categorySlug = text(body.category_slug, 100);
  const subcategorySlug = text(body.subcategory_slug, 100);
  const category = getCategory(categorySlug);
  const subcategory = subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
  const price = Number(body.price);
  const stock = Number(body.stock);
  const commission = Number(body.commission ?? 0);
  const images = list(body.image_urls, 8, 1000);
  const keywords = list(body.search_keywords, 20, 100);
  const faqs: Faq[] = Array.isArray(body.seo_faqs)
    ? body.seo_faqs.slice(0, 8).map((item: unknown) => ({
        question: text((item as Faq)?.question, 180),
        answer: text((item as Faq)?.answer, 800),
      })).filter((item: Faq) => item.question && item.answer)
    : [];

  if (!name || description.length < 30 || !category || (subcategorySlug && !subcategory) ||
      !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0 ||
      !Number.isFinite(commission) || commission < 0 || commission > 100) {
    return NextResponse.json({
      error: "পণ্যের নাম, কমপক্ষে ৩০ অক্ষরের বিবরণ, ক্যাটাগরি, সঠিক মূল্য, স্টক ও কমিশন যাচাই করুন।",
    }, { status: 400 });
  }

  if (images.some(value => {
    try { return new URL(value).protocol !== "https:"; } catch { return true; }
  })) {
    return NextResponse.json({ error: "ছবির URL অবশ্যই valid HTTPS URL হতে হবে।" }, { status: 400 });
  }

  const slugInput = text(body.slug, 120) || slugifyProductName(name);
  const slug = slugInput.toLocaleLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  if (!slug) return NextResponse.json({ error: "একটি ইংরেজি URL slug দিন।" }, { status: 400 });

  const seoTitle = text(body.seo_title, 70) || `${name} | AGRIVA`.slice(0, 70);
  const metaDescription = text(body.meta_description, 180) ||
    text(shortDescription || description, 155);
  const checklist = [
    Boolean(name),
    Boolean(category),
    description.length >= 80,
    Boolean(price > 0),
    images.length > 0,
    Boolean(metaDescription.length >= 70),
    Boolean(text(body.image_alt_text, 180)),
    Boolean(keywords.length > 0),
    Boolean(text(body.origin_district, 100)),
  ];
  const seoReady = checklist.every(Boolean);

  const payload = {
    name, slug, description, short_description: shortDescription || null,
    price, stock, commission, category_slug: category.slug,
    subcategory_slug: subcategory?.slug ?? null,
    brand_name: text(body.brand_name, 160) || null,
    sku: text(body.sku, 100) || null,
    origin_district: text(body.origin_district, 100) || null,
    unit_label: text(body.unit_label, 80) || null,
    composition: text(body.composition, 2000) || null,
    usage_instructions: text(body.usage_instructions, 4000) || null,
    safety_information: text(body.safety_information, 4000) || null,
    packaging_details: text(body.packaging_details, 500) || null,
    image_urls: images,
    image_alt_text: text(body.image_alt_text, 180) || null,
    seo_title: seoTitle,
    meta_description: metaDescription,
    search_keywords: keywords,
    seo_faqs: faqs,
    seo_ready: seoReady,
  };

  const { data, error } = await access.supabase.rpc("admin_create_product_with_seo", { p_product: payload });
  if (error) {
    console.error("Admin SEO product creation failed", { code: error.code || "unknown" });
    const message = error.code === "23505"
      ? "এই slug বা SKU আগে থেকেই আছে। আলাদা slug/SKU ব্যবহার করুন।"
      : error.code === "42883"
        ? "SEO Studio database migration এখনো প্রয়োগ হয়নি।"
        : "পণ্য সংরক্ষণ করা যায়নি। Product SEO migration ও database schema যাচাই করুন।";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  return NextResponse.json({
    product: data,
    seo: { ready: seoReady, score: Math.round(checklist.filter(Boolean).length / checklist.length * 100), checks: checklist.length },
    message: "পণ্যটি Draft হিসেবে সংরক্ষিত হয়েছে। SEO checklist ও moderation review সম্পন্ন না হওয়া পর্যন্ত এটি public marketplace-এ প্রকাশিত হবে না।",
  }, { status: 201 });
}
