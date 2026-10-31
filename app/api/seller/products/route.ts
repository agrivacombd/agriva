import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

const ALLOWED_UNITS = ["kg", "g", "piece", "pack", "liter", "bag"] as const;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from("marketplace_seller_permissions")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Approved Marketplace Seller permission required. Apply separately at /sell-on-marketplace." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) || {};
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const unit = String(body.unit || "").trim();
  const description = String(body.description || "").trim();
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !(ALLOWED_UNITS as readonly string[]).includes(unit) || !category || !subcategory || description.length > 5000) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, সাব-ক্যাটাগরি, বিক্রয় একক, মূল্য ও স্টক যাচাই করুন।" }, { status: 400 });
  }

  if (imageUrl) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: "ছবির storage configuration পাওয়া যায়নি।" }, { status: 500 });
    try {
      const image = new URL(imageUrl);
      const base = new URL(supabaseUrl);
      const expectedPrefix = `/storage/v1/object/public/product-images/${user.id}/`;
      const fileName = image.pathname.startsWith(expectedPrefix)
        ? image.pathname.slice(expectedPrefix.length)
        : "";
      const validFileName = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(fileName);

      if (image.origin !== base.origin || !validFileName || image.search || image.hash || image.protocol !== "https:") {
        return NextResponse.json({ error: "শুধু নিজের account থেকে আপলোড করা পণ্যের ছবি ব্যবহার করা যাবে।" }, { status: 400 });
      }
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
    status: "draft",
  }).select("id,name,category,category_slug,subcategory_slug,image_url,status,unit").single();

  if (error) {
    console.error("Seller marketplace product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
