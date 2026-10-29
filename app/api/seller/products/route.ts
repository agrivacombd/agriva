import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

const MIN_PLANT_DESCRIPTION_LENGTH = 80;
const ATTRIBUTE_KEYS = new Set([
  "brand", "crop_name", "variety", "pack_size", "germination_rate", "batch_number", "expiry_date",
  "fertilizer_type", "composition", "usage_instructions", "active_ingredient", "registration_number",
  "plant_size", "suitable_season", "care_instructions", "model", "material", "dimensions", "warranty",
  "food_type", "ingredients", "origin",
]);
const PROFILE_LIMITS: Record<string, number> = {
  business_name: 160,
  business_address: 300,
  business_district: 100,
  trade_license_number: 100,
  seed_registration_number: 100,
  other_registration_details: 500,
};

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from("user_role_memberships")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["seller", "organization"])
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Seller or approved organization access required. Farmers can list their crops on Sell Harvest." }, { status: 403 });
  }

  const parsedBody = await request.json().catch(() => null);
  const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody as Record<string, unknown> : {};
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const description = String(body.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const requestedImageUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
  const imageUrls = requestedImageUrls.filter((value: unknown): value is string => typeof value === "string" && value.trim()).map((value: string) => value.trim());
  const imageUrl = imageUrls[0] || (typeof body.image_url === "string" && body.image_url.trim().length > 0 ? body.image_url.trim() : null);
  const allImageUrls = imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [];
  const isPlantListing = categorySlug === "plants-gardening";

  if (!name || name.length < 3 || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !category || !subcategory || description.length > 5000) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, সাব-ক্যাটাগরি, মূল্য ও স্টক যাচাই করুন।" }, { status: 400 });
  }

  if (!allImageUrls.length) {
    return NextResponse.json({ error: "পণ্যের অন্তত একটি পরিষ্কার ছবি আবশ্যক।" }, { status: 400 });
  }
  if (isPlantListing && description.length < MIN_PLANT_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Plant Market-এর বিবরণ অন্তত ${MIN_PLANT_DESCRIPTION_LENGTH} অক্ষরের হতে হবে। গাছের ধরন, আকার, যত্ন বা পণ্যের উপাদানের মতো নির্দিষ্ট তথ্য যোগ করুন।` }, { status: 400 });
  }
  if (!isPlantListing && description.length < 30) {
    return NextResponse.json({ error: "পণ্যের বিবরণ অন্তত ৩০ অক্ষরের হতে হবে।" }, { status: 400 });
  }
  if (allImageUrls.length > 4) {
    return NextResponse.json({ error: "সর্বোচ্চ ৪টি পণ্যের ছবি আপলোড করা যাবে।" }, { status: 400 });
  }

  if (allImageUrls.length) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: "ছবির storage configuration পাওয়া যায়নি।" }, { status: 500 });
    try {
      const base = new URL(supabaseUrl);
      const validFileName = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;
      for (const imageUrlValue of allImageUrls) {
        const image = new URL(imageUrlValue);
        const expectedPrefix = `/storage/v1/object/public/product-images/${user.id}/`;
        const fileName = image.pathname.startsWith(expectedPrefix) ? image.pathname.slice(expectedPrefix.length) : "";
        if (image.origin !== base.origin || !validFileName.test(fileName) || image.search.length > 0 || image.hash.length > 0 || image.protocol !== "https:") {
          return NextResponse.json({ error: "শুধু নিজের account থেকে আপলোড করা পণ্যের ছবি ব্যবহার করা যাবে।" }, { status: 400 });
        }
      }
    } catch {
      return NextResponse.json({ error: "ছবির URL সঠিক নয়।" }, { status: 400 });
    }
  }

  const rawAttributes = body.product_attributes && typeof body.product_attributes === "object" && !Array.isArray(body.product_attributes)
    ? body.product_attributes as Record<string, unknown>
    : {};
  const productAttributes: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(rawAttributes)) {
    if (!ATTRIBUTE_KEYS.has(key) || typeof rawValue !== "string") continue;
    const value = cleanString(rawValue, key === "usage_instructions" || key === "care_instructions" ? 1000 : 160);
    if (value) productAttributes[key] = value;
  }
  if (["seeds", "fertilizer", "crop-protection", "premium-food-grains"].includes(categorySlug) && !productAttributes.pack_size) {
    return NextResponse.json({ error: "এই ক্যাটাগরির পণ্যের pack size / পরিমাণ আবশ্যক।" }, { status: 400 });
  }
  if (productAttributes.germination_rate && (!Number.isFinite(Number(productAttributes.germination_rate)) || Number(productAttributes.germination_rate) < 0 || Number(productAttributes.germination_rate) > 100)) {
    return NextResponse.json({ error: "Germination rate ০ থেকে ১০০-এর মধ্যে দিন।" }, { status: 400 });
  }

  const profileBody = body.seller_profile && typeof body.seller_profile === "object" && !Array.isArray(body.seller_profile)
    ? body.seller_profile as Record<string, unknown>
    : null;
  if (profileBody) {
    const profileUpdate: Record<string, string | null> = {};
    for (const [key, max] of Object.entries(PROFILE_LIMITS)) {
      if (key in profileBody) profileUpdate[key] = cleanString(profileBody[key], max) || null;
    }
    if ("trade_license_expiry" in profileBody) {
      const expiry = cleanString(profileBody.trade_license_expiry, 10);
      if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        return NextResponse.json({ error: "Trade licence expiry date সঠিক নয়।" }, { status: 400 });
      }
      profileUpdate.trade_license_expiry = expiry || null;
    }
    if (Object.keys(profileUpdate).length) {
      const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
      if (profileError) {
        console.error("Seller business profile update failed", { code: profileError.code || "unknown" });
        return NextResponse.json({ error: "Seller profile তথ্য সংরক্ষণ করা যায়নি। Database migration প্রয়োগ হয়েছে কি না যাচাই করুন।" }, { status: 400 });
      }
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
    description,
    image_url: imageUrl,
    image_urls: allImageUrls,
    product_attributes: productAttributes,
    status: "draft",
  }).select("id,name,category,category_slug,subcategory_slug,image_url,image_urls,product_attributes,status").single();

  if (error) {
    console.error("Seller marketplace product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
