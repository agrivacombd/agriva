import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory, slugifyProductName } from "@/lib/marketplace/taxonomy";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return { response: NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 }) };
  if (profile?.role !== "admin") return { response: NextResponse.json({ error: "Admin role required" }, { status: 403 }) };
  return { supabase, user };
}
const clean = (v: unknown, max = 2000) => typeof v === "string" ? v.trim().slice(0, max) : "";
const list = (v: unknown, maxItems = 20, maxLength = 120): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string").map(x => x.trim().slice(0, maxLength)).filter(Boolean))].slice(0, maxItems) : [];
function makeSlug(value: string) {
  const slug = slugifyProductName(value).replace(/^-+|-+$/g, "").slice(0, 100);
  return slug || `agri-product-${crypto.randomUUID().slice(0, 8)}`;
}
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Valid product payload required" }, { status: 400 });

  const name = clean(body.name, 160), description = clean(body.description, 10000);
  const price = Number(body.price), stock = Number(body.stock), commission = Number(body.commission ?? 0);
  const categorySlug = clean(body.categorySlug, 100), subcategorySlug = clean(body.subcategorySlug, 100);
  const category = getCategory(categorySlug);
  const subcategory = subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
  const status = clean(body.status, 20);
  if (!name || !description || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0 ||
      !Number.isFinite(commission) || commission < 0 || commission > 100 ||
      !category || (subcategorySlug && !subcategory) || !["draft","active"].includes(status)) {
    return NextResponse.json({ error: "Name, description, valid category, price, stock and status are required." }, { status: 400 });
  }
  const images = list(body.imageUrls, 8, 1000);
  if (images.some(url => { try { const u = new URL(url); return !["https:","http:"].includes(u.protocol); } catch { return true; } })) {
    return NextResponse.json({ error: "Product images must be valid HTTP(S) URLs." }, { status: 400 });
  }
  const slug = makeSlug(clean(body.slug, 120) || name);
  const keywords = list(body.searchKeywords, 20, 100);
  const hashtags = list(body.hashtags, 20, 60).map(tag => tag.startsWith("#") ? tag : `#${tag.replace(/[^\p{L}\p{N}_-]/gu, "")}`).filter(tag => tag.length > 1);
  const seoTitle = clean(body.seoTitle, 70) || `${name} | AGRIVA`;
  const metaDescription = clean(body.metaDescription, 180) || description.replace(/\s+/g, " ").slice(0, 155);
  const seoReady = Boolean(name && description.length >= 80 && category && images.length > 0 && price > 0 && metaDescription.length >= 70);
  const values = {
    farmer_id: auth.user.id, name, slug, description, price, stock,
    reseller_commission_percent: commission,
    status: status === "active" && seoReady ? "active" : "draft",
    category: category.name, category_slug: category.slug, subcategory_slug: subcategory?.slug ?? null,
    brand_name: clean(body.brandName, 160) || null, sku: clean(body.sku, 100) || null,
    unit_label: clean(body.unitLabel, 80) || null, product_type: clean(body.productType, 120) || null,
    crop_suitability: list(body.cropSuitability, 20, 100), composition: clean(body.composition, 2000) || null,
    usage_instructions: clean(body.usageInstructions, 4000) || null, safety_information: clean(body.safetyInformation, 4000) || null,
    origin_district: clean(body.originDistrict, 100) || null, packaging_details: clean(body.packagingDetails, 300) || null,
    image_urls: images, seo_title: seoTitle, meta_description: metaDescription,
    search_keywords: keywords, hashtags, canonical_slug: slug,
    seo_review_status: seoReady ? "ready" : "needs_review",
    moderation_status: "pending",
  };
  const { data, error } = await auth.supabase.rpc("admin_create_agri_product", { p_product: values });
  if (error) {
    return NextResponse.json({ error: error.code === "23505" ? "এই SKU বা slug আগে থেকেই আছে। আলাদা SKU/slug দিন।" : "পণ্য সংরক্ষণ করা যায়নি। Draft migration/schema ও required fields যাচাই করুন।" }, { status: 400 });
  }
  return NextResponse.json({
    product: data,
    seoReady,
    message: status === "active" && !seoReady ? "তথ্য অসম্পূর্ণ—পণ্যটি নিরাপদভাবে draft রাখা হয়েছে।" : "পণ্য সংরক্ষিত হয়েছে। Public marketplace-এ দেখানোর আগে moderation review প্রয়োজন।",
  }, { status: 201 });
}
