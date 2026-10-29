import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readRequestBodyWithLimit } from "@/lib/http/read-limited-request-body";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "পণ্য যোগ করতে আগে লগইন করুন।" }, { status: 401 });

  const { data: company, error: companyError } = await supabase
    .from("seed_companies")
    .select("id,verification_status")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (companyError) return NextResponse.json({ error: "কোম্পানির অনুমোদন যাচাই করা যায়নি। Database migration যাচাই করুন।" }, { status: 503 });
  if (!company || company.verification_status !== "verified") {
    return NextResponse.json({ error: "শুধু অনুমোদিত কোম্পানি পণ্য যোগ করতে পারবে।" }, { status: 403 });
  }

  const bounded = await readRequestBodyWithLimit(request, 16384);
  if (!bounded.ok) return NextResponse.json({ error: "অনুরোধের তথ্য সীমার বেশি।" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(bounded.text); } catch {
    return NextResponse.json({ error: "সঠিক পণ্যের তথ্য পাঠান।" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "সঠিক পণ্যের তথ্য পাঠান।" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const price = Number(input.price);
  const stock = Number(input.stock);
  const categorySlug = typeof input.category_slug === "string" ? input.category_slug.trim() : "";
  const subcategorySlug = typeof input.subcategory_slug === "string" ? input.subcategory_slug.trim() : "";
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const imageUrl = typeof input.image_url === "string" ? input.image_url.trim() : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const imagePrefix = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/product-images/${user.id}/` : "";

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0 || description.length > 5000 ||
      !category || !subcategory || !imagePrefix || imageUrl.length > 1000 ||
      !imageUrl.startsWith(imagePrefix) || !/^[A-Za-z0-9._-]{1,255}$/.test(imageUrl.slice(imagePrefix.length))) {
    return NextResponse.json({ error: "ছবি, পণ্যের নাম, ক্যাটাগরি, মূল্য ও স্টকের তথ্য সঠিকভাবে দিন।" }, { status: 400 });
  }

  const slugBase = name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 100) || "product";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("products").insert({
    farmer_id: user.id,
    seed_company_id: company.id,
    listing_source: "company",
    name,
    slug,
    category: subcategory.name,
    category_slug: category.slug,
    subcategory_slug: subcategory.slug,
    price,
    stock,
    reseller_commission_percent: 0,
    description: description || null,
    image_url: imageUrl,
    status: "draft",
    moderation_status: "pending",
  }).select("id,name,slug,status,moderation_status").single();

  if (error) {
    console.error("Company product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Company catalogue migration ও database permission যাচাই করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
