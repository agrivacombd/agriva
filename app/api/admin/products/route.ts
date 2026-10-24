import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "সঠিক তথ্য পাঠান" }, { status: 400 });
  }

  const farmerId = typeof body.farmerId === "string" ? body.farmerId.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = parseNumber(body.price);
  const stock = parseNumber(body.stock);
  const commission = parseNumber(body.commission);
  const categorySlug = typeof body.categorySlug === "string" ? body.categorySlug.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const subcategorySlug = typeof body.subcategorySlug === "string" ? body.subcategorySlug.trim() || null : null;
  const validImageUrl = /^https:\/\/[^/]+\/storage\/v1\/object\/public\/product-images\/[A-Za-z0-9_./-]+$/.test(imageUrl);

  if (
    !farmerId ||
    !name ||
    name.length > 160 ||
    price === null ||
    price < 0 ||
    stock === null ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    commission === null ||
    commission < 0 ||
    commission > 100 ||
    !categorySlug ||
    !validImageUrl ||
    description.length > 10000
  ) {
    return NextResponse.json({ error: "সব তথ্য সঠিকভাবে দিন; দাম, স্টক ও কমিশন যাচাই করুন" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("admin_create_product", {
    p_farmer_id: farmerId,
    p_name: name,
    p_description: description || null,
    p_price: price,
    p_stock: stock,
    p_commission_percent: commission,
    p_category_slug: categorySlug,
    p_subcategory_slug: subcategorySlug,
    p_image_url: imageUrl,
  });
  if (error) {
    return NextResponse.json({
      error: error.message.includes("Admin role required")
        ? "Admin access required"
        : "পণ্য যোগ করা যায়নি। বিক্রেতা, ক্যাটাগরি ও তথ্য যাচাই করুন।",
    }, { status: 400 });
  }
  return NextResponse.json({ product: { id: data.id, name: data.name, status: data.status } }, { status: 201 });
}
