import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "farmer") {
    return NextResponse.json({ error: "Farmer access required" }, { status: 403 });
  }

  const parsedBody: unknown = await request.json().catch(() => ({}));
  const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody)
    ? parsedBody as Record<string, unknown>
    : {};

  const optionalStringFields = [
    body.category,
    body.description,
    body.seo_title,
    body.seo_description,
    body.seo_keywords,
  ];
  const stringsAreValid = typeof body.name === "string" &&
    optionalStringFields.every((value) => value === undefined || value === null || typeof value === "string");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const seoTitle = typeof body.seo_title === "string" ? body.seo_title.trim() : "";
  const seoDescription = typeof body.seo_description === "string" ? body.seo_description.trim() : "";
  const seoKeywords = typeof body.seo_keywords === "string" ? body.seo_keywords.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number.NaN;
  const stock = typeof body.stock === "number" ? body.stock : Number.NaN;

  if (
    !stringsAreValid ||
    !name ||
    name.length > 160 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    description.length > 5000 ||
    category.length > 120 ||
    seoTitle.length > 70 ||
    seoDescription.length > 170 ||
    seoKeywords.length > 500
  ) {
    return NextResponse.json({ error: "Please check the product details and try again." }, { status: 400 });
  }

  const seoRequested = Boolean(seoTitle || seoDescription || seoKeywords);
  let seoStudioEnabled = false;
  if (seoRequested) {
    const { data: feature, error: featureError } = await supabase
      .from("product_form_feature_settings")
      .select("enabled")
      .eq("feature_key", "seo_studio")
      .maybeSingle();
    if (featureError || feature?.enabled !== true) {
      return NextResponse.json({ error: "SEO Studio is not enabled for seller products." }, { status: 403 });
    }
    seoStudioEnabled = true;
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
  const slug = `${slugBase || "product"}-${crypto.randomUUID().slice(0, 8)}`;

  // Optional SEO columns are written only when the server-side feature flag is enabled.
  // Ensure the product SEO compatibility migration has been applied before enabling SEO Studio.
  const productInsert: Record<string, string | number | null> = {
    farmer_id: user.id,
    name,
    slug,
    price,
    stock,
    description: description || null,
    category: category || null,
    status: "draft",
  };
  if (seoStudioEnabled) {
    productInsert.seo_title = seoTitle || null;
    productInsert.seo_description = seoDescription || null;
    productInsert.seo_keywords = seoKeywords || null;
  }

  const { data, error } = await supabase
    .from("products")
    .insert(productInsert)
    .select("id,name,status")
    .single();

  if (error) {
    console.error("Farmer product creation failed", { code: error.code });
    return NextResponse.json({ error: "Could not submit the product. Please try again." }, { status: 400 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
