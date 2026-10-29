import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

const MIN_PLANT_DESCRIPTION_LENGTH = 80;

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

  const body = await request.json().catch(() => ({}));
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
  const imageUrl = imageUrls[0] || (typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null);
  const allImageUrls = imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [];
  const isPlantListing = categorySlug === "plants-gardening";

  if (!name || name.length < 3 || name.length > 160 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !category || !subcategory || description.length > 5000) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, সাব-ক্যাটাগরি, মূল্য ও স্টক যাচাই করুন।" }, { status: 400 });
  }

  if (isPlantListing && !imageUrl) {
    return NextResponse.json({ error: "Plant Market-এর পণ্যের জন্য পরিষ্কার পণ্যের ছবি আবশ্যক।" }, { status: 400 });
  }
  if (isPlantListing && description.length < MIN_PLANT_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Plant Market-এর বিবরণ অন্তত ${MIN_PLANT_DESCRIPTION_LENGTH} অক্ষরের হতে হবে। গাছের ধরন, আকার, যত্ন বা পণ্যের উপাদানের মতো নির্দিষ্ট তথ্য যোগ করুন।` }, { status: 400 });
  }

  if (allImageUrls.length > 4) {
    return NextResponse.json({ error: "সর্বোচ্চ ৪টি পণ্যের ছবি আপলোড করা যাবে।" }, { status: 400 });
  }
  if (isPlantListing && !imageUrl) {
    return NextResponse.json({ error: "Plant Market-এর পণ্যের জন্য পরিষ্কার পণ্যের ছবি আবশ্যক।" }, { status: 400 });
  }
  if (isPlantListing && description.length < MIN_PLANT_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Plant Market-এর বিবরণ অন্তত ${MIN_PLANT_DESCRIPTION_LENGTH} অক্ষরের হতে হবে। গাছের ধরন, আকার, যত্ন বা পণ্যের উপাদানের মতো নির্দিষ্ট তথ্য যোগ করুন।` }, { status: 400 });
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
        if (image.origin !== base.origin || !validFileName.test(fileName) || image.search || image.hash || image.protocol !== "https:") {
          return NextResponse.json({ error: "শুধু নিজের account থেকে আপলোড করা পণ্যের ছবি ব্যবহার করা যাবে।" }, { status: 400 });
        }
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
    description,
    image_url: imageUrl,
    image_urls: allImageUrls,
    status: "draft",
  }).select("id,name,category,category_slug,subcategory_slug,image_url,image_urls,status").single();

  if (error) {
    console.error("Seller marketplace product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
