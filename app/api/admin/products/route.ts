import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const farmerId = String(body.farmerId ?? "");
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const commission = Number(body.commission);
  const categorySlug = String(body.categorySlug ?? "").trim();
  const subcategorySlug = String(body.subcategorySlug ?? "").trim() || null;
  if (!farmerId || !name || name.length > 160 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !categorySlug || description.length > 10000) {
    return NextResponse.json({ error: "সব তথ্য সঠিকভাবে দিন; কমিশন ০–১০০% হতে হবে" }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("admin_create_product", {
    p_farmer_id: farmerId, p_name: name, p_description: description || null,
    p_price: price, p_stock: stock, p_commission_percent: commission,
    p_category_slug: categorySlug, p_subcategory_slug: subcategorySlug,
  });
  if (error) return NextResponse.json({ error: error.message.includes("Admin role required") ? "Admin access required" : "পণ্য যোগ করা যায়নি। বিক্রেতা, ক্যাটাগরি ও তথ্য যাচাই করুন।" }, { status: 400 });
  return NextResponse.json({ product: { id: data.id, name: data.name, status: data.status, moderation_status: data.moderation_status } }, { status: 201 });
}
