import { NextRequest, NextResponse } from "next/server";
import { authorizePermission } from "@/lib/auth/server-authorization";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

export async function POST(request: NextRequest) {
  const auth = await authorizePermission("catalog.create_own");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.roles.some((role) => role === "farmer" || role === "seller")) {
    return NextResponse.json({ error: "Seller or farmer access required" }, { status: 403 });
  }
  const { supabase, user } = auth;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const description = String(body.description || "").trim();
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !category || !subcategory || description.length > 5000) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, সাব-ক্যাটাগরি, মূল্য ও স্টক যাচাই করুন।" }, { status: 400 });
  }

  const slugBase = name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 100) || "product";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("products").insert({
    farmer_id: user.id, name, slug, category: subcategory.name,
    category_slug: category.slug, subcategory_slug: subcategory.slug,
    price, stock, reseller_commission_percent: 0, description,
    status: "draft",
  }).select("id,name,category,category_slug,subcategory_slug,status").single();

  if (error) {
    console.error("Farmer product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
