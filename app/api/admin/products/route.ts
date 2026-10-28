import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify admin permissions" }, { status: 500 });
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Valid product data is required" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = Number(body.price);
  const stock = Number(body.stock);
  const commission = Number(body.commission);
  const categorySlug = typeof body.category_slug === "string" ? body.category_slug.trim() : "";
  const subcategorySlug = typeof body.subcategory_slug === "string" ? body.subcategory_slug.trim() : "";
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;

  if (
    !name || name.length > 160 ||
    !Number.isFinite(price) || price <= 0 ||
    !Number.isInteger(stock) || stock < 0 ||
    !Number.isFinite(commission) || commission < 0 || commission > 100 ||
    description.length > 5000 || !category || !subcategory
  ) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, মূল্য, স্টক ও কমিশনের তথ্য যাচাই করুন।" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const expectedImagePrefix = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/product-images/${user.id}/` : "";
  if (
    imageUrl &&
    (!expectedImagePrefix || imageUrl.length > 1000 || !imageUrl.startsWith(expectedImagePrefix) ||
      !/\/[A-Za-z0-9._-]+$/.test(imageUrl))
  ) {
    return NextResponse.json({ error: "ছবিটি AGRIVA-এর অনুমোদিত product image storage থেকে হতে হবে।" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("admin_create_marketplace_product_with_image", {
    p_name: name,
    p_description: description || null,
    p_price: price,
    p_stock: stock,
    p_commission_percent: commission,
    p_category_slug: category.slug,
    p_subcategory_slug: subcategory.slug,
    p_image_url: imageUrl,
  });

  if (error) {
    if (imageUrl) {
      const prefix = "/storage/v1/object/public/product-images/";
      const index = imageUrl.indexOf(prefix);
      const path = index >= 0 ? imageUrl.slice(index + prefix.length) : "";
      if (path) await supabase.storage.from("product-images").remove([path]).catch(() => undefined);
    }
    console.error("Admin product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Product image migration ও database schema যাচাই করুন।" }, { status: 400 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
