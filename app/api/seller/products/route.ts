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
  const price = Number(body.price);
  const stock = Number(body.stock);
  const unit = String(body.unit || "").trim();
  const description = String(body.description || "").trim();
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const submittedImages = Array.isArray(body.image_urls) ? body.image_urls : body.image_url ? [body.image_url] : [];
  const imageUrls = submittedImages.filter((value: unknown): value is string => typeof value === "string" && value.trim()).map((value: string) => value.trim());
  if (imageUrls.length > 4 || imageUrls.length !== submittedImages.length) {
    return NextResponse.json({ error: "সর্বোচ্চ ৪টি সঠিক product image URL জমা দিন।" }, { status: 400 });
  }
  const imageUrl = imageUrls[0] ?? null;

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !(ALLOWED_UNITS as readonly string[]).includes(unit) || !category || !subcategory || description.length > 5000) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, সাব-ক্যাটাগরি, বিক্রয় একক, মূল্য ও স্টক যাচাই করুন।" }, { status: 400 });
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
        const validFileName = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(?:jpg|png|webp)$/i.test(fileName);
        return image.origin === base.origin && validFileName && !image.search && !image.hash && image.protocol === "https:";
      });
      if (!validImageUrls) return NextResponse.json({ error: "শুধু নিজের account থেকে আপলোড করা সর্বোচ্চ ৪টি ছবি ব্যবহার করা যাবে।" }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "ছবির URL সঠিক নয়।" }, { status: 400 });
    }
  }

  const slugBase = name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 100) || "product";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
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
    image_url: imageUrl,
    image_urls: imageUrls,
    status: "draft",
    marketplace_channel: "marketplace",
  }).select("id,name,category,category_slug,subcategory_slug,image_url,status,unit").single();

  if (error) {
    console.error("Seller marketplace product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
