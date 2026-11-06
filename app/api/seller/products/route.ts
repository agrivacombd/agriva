import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";
import { findMarketplaceOrganizationWithAccess } from "@/lib/authz/module-access";

const ALLOWED_UNITS = ["kg", "g", "piece", "pack", "liter", "bag"] as const;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await findMarketplaceOrganizationWithAccess("create");
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason === "authorization_unavailable" ? "Seller authorization is temporarily unavailable." : "A verified business organization with Marketplace approval is required." },
      { status: access.reason === "authorization_unavailable" ? 503 : access.reason === "unauthenticated" ? 401 : 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const unit = String(body.unit || "").trim();
  const description = String(body.description || "").trim();
  const seoTitle = String(body.seo_title || "").trim();
  const seoDescription = String(body.seo_description || "").trim();
  const focusKeyword = String(body.focus_keyword || "").trim();
  const relatedKeywords = String(body.related_keywords || "").split(",").map((value: string) => value.trim()).filter(Boolean).slice(0,10);
  const highlights = String(body.highlights || "").split(/\r?\n/).map((value: string) => value.trim()).filter(Boolean).slice(0,5);
  const brand = String(body.brand || "").trim();
  const origin = String(body.origin || "").trim();
  const usageInstructions = String(body.usage_instructions || "").trim();
  const imageAlt = String(body.image_alt || "").trim();
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const submittedImages: unknown[] = Array.isArray(body.image_urls) ? body.image_urls : body.image_url ? [body.image_url] : [];
  const imageUrls = submittedImages.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim());
  if (imageUrls.length > 4 || imageUrls.length !== submittedImages.length) {
    return NextResponse.json({ error: "সর্বোচ্চ ৪টি সঠিক product image URL জমা দিন।" }, { status: 400 });
  }
  const imageUrl = imageUrls[0] ?? null;

  if (!name || name.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !(ALLOWED_UNITS as readonly string[]).includes(unit) || !category || !subcategory || description.length > 5000 || seoTitle.length > 70 || seoDescription.length > 200 || focusKeyword.length > 100 || relatedKeywords.some((value: string) => value.length > 80) || brand.length > 120 || origin.length > 120 || highlights.some((value: string) => value.length > 200) || usageInstructions.length > 2000 || imageAlt.length > 180) {
    return NextResponse.json({ error: "পণ্যের নাম, বৈধ URL slug (ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন), ক্যাটাগরি, বিক্রয় একক, মূল্য ও স্টক যাচাই করুন।" }, { status: 400 });
  }

  if (imageUrls.length) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: "ছবির storage configuration পাওয়া যায়নি।" }, { status: 500 });
    try {
      const base = new URL(supabaseUrl);
      const validImageUrls = imageUrls.every((imageUrl) => {
        const image = new URL(imageUrl);
        const expectedPrefix = `/storage/v1/object/public/product-images/${user.id}/`;
        const fileName = image.pathname.startsWith(expectedPrefix) ? image.pathname.slice(expectedPrefix.length) : "";
        const validFileName = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(fileName);
        return image.origin === base.origin && validFileName && !image.search && !image.hash && image.protocol === "https:";
      });
      if (!validImageUrls) return NextResponse.json({ error: "শুধু নিজের account থেকে আপলোড করা সর্বোচ্চ ৪টি ছবি ব্যবহার করা যাবে।" }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "ছবির URL সঠিক নয়।" }, { status: 400 });
    }
  }

   const { data, error } = await supabase.from("products").insert({
    farmer_id: user.id,
    name,
    slug,
    category: subcategory.name,
    category_slug: category.slug,
    subcategory_slug: subcategory.slug,
    price,
    stock,
    unit,
    description,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    focus_keyword: focusKeyword || null,
    seo_keywords: relatedKeywords,
    brand: brand || null,
    origin: origin || null,
    highlights,
    usage_instructions: usageInstructions || null,
    image_alt: imageAlt || null,
    image_url: imageUrl,
    image_urls: imageUrls,
    status: "draft",
    marketplace_channel: "marketplace",
  }).select("id,name,slug,category,category_slug,subcategory_slug,image_url,status,unit").single();

  if (error) {
    console.error("Seller marketplace product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: error.code === "23505" ? "এই URL slug-টি আগে থেকেই ব্যবহৃত হয়েছে। অন্য slug দিন।" : "পণ্য সংরক্ষণ করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
