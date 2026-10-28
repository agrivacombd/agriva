import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim(), description = String(body.description || "").trim();
  const price = Number(body.price), stock = Number(body.stock), commission = Number(body.commission);
  const categorySlug = String(body.category_slug || "").trim(), subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug), subcategory = getSubcategory(categorySlug, subcategorySlug);
  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !Number.isFinite(commission) || commission < 0 || commission > 100 || description.length > 5000 || !category || !subcategory) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, মূল্য, স্টক ও কমিশনের তথ্য যাচাই করুন।" }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("admin_create_marketplace_product", {
    p_name: name, p_description: description || null, p_price: price, p_stock: stock,
    p_commission_percent: commission, p_category_slug: category.slug, p_subcategory_slug: subcategory.slug,
  });
  if (error) {
    console.error("Admin product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। নতুন category migration প্রয়োগ হয়েছে কি না যাচাই করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
