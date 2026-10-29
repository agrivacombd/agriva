import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: membership, error: membershipError } = await supabase.from("user_role_memberships").select("role").eq("user_id", user.id).in("role", ["seller", "organization"]).limit(1).maybeSingle();
  if (membershipError || !membership) return NextResponse.json({ error: "Seller or approved organization access required. Farmers can list their crops on Sell Harvest." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const description = String(body.description || "").trim();
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !category || !subcategory || description.length > 5000) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, সাব-ক্যাটাগরি, মূল্য, স্টক ও কমিশন যাচাই করুন।" }, { status: 400 });
  }

  if (imageUrl) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: "ছবির storage configuration পাওয়া যায়নি।" }, { status: 500 });
    try {
      const image = new URL(imageUrl);
      const base = new URL(supabaseUrl);
      const requiredPrefix = `${base.origin}/storage/v1/object/public/product-images/${user.id}/`;
      if (image.origin !== base.origin || !image.href.startsWith(requiredPrefix) || !/^https?:$/.test(image.protocol)) {
        return NextResponse.json({ error: "শুধু নিজের account থেকে আপলোড করা পণ্যের ছবি ব্যবহার করা যাবে।" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "ছবির URL সঠিক নয়।" }, { status: 400 });
    }
  }

  const slugBase = name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 100) || "product";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("products").insert({
    farmer_id: user.id, name, slug, category: subcategory.name,
    category_slug: category.slug, subcategory_slug: subcategory.slug,
    price, stock, description,
    image_url: imageUrl, status: "draft",
  }).select("id,name,category,category_slug,subcategory_slug,image_url,status").single();

  if (error) {
    console.error("Seller marketplace product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
