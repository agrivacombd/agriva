import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";
import { MAX_PRODUCT_DESCRIPTION_HTML_LENGTH, productDescriptionToText, sanitizeProductDescription } from "@/lib/marketplace/product-description";

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("catalog.create");
  if (!access.ok) return access.response;
  const { supabase } = access;
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const description = sanitizeProductDescription(String(body.description || ""));
  if (description.length > MAX_PRODUCT_DESCRIPTION_HTML_LENGTH) {
    return NextResponse.json({ error: "পণ্যের বিবরণ অনেক বড় হয়েছে। সর্বোচ্চ ২,৫০,০০০ অক্ষরের মধ্যে ভাগ করে লিখুন; কোনো লেখা কেটে সংরক্ষণ করা হবে না।" }, { status: 413 });
  }
  const price = Number(body.price);
  const stock = Number(body.stock);
  const commission = Number(body.commission);
  const categorySlug = String(body.category_slug || "").trim();
  const subcategorySlug = String(body.subcategory_slug || "").trim();
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  const submittedImages: unknown[] = Array.isArray(body.image_urls) ? body.image_urls : [];
  const imageUrls = submittedImages.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map(value => value.trim());

  if (imageUrls.length > 4 || imageUrls.length !== submittedImages.length) {
    return NextResponse.json({ error: "সর্বোচ্চ ৪টি সঠিক product image URL জমা দিন।" }, { status: 400 });
  }
  if (!name || name.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 ||
      !Number.isFinite(commission) || commission < 0 || commission > 100 || !category || !subcategory) {
    return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি, মূল্য, স্টক ও কমিশনের তথ্য যাচাই করুন।" }, { status: 400 });
  }

  if (imageUrls.length) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (authError || !user || !storageUrl) return NextResponse.json({ error: "ছবির upload authorization যাচাই করা যায়নি।" }, { status: 401 });
    try {
      const origin = new URL(storageUrl).origin;
      const valid = imageUrls.every(value => {
        const url = new URL(value);
        const prefix = `/storage/v1/object/public/product-images/${user.id}/`;
        const filename = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : "";
        return url.origin === origin && url.protocol === "https:" && !url.search && !url.hash &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(filename);
      });
      if (!valid) return NextResponse.json({ error: "শুধু Admin account থেকে আপলোড করা সর্বোচ্চ ৪টি ছবি ব্যবহার করা যাবে।" }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "ছবির URL সঠিক নয়।" }, { status: 400 });
    }
  }

  const { data, error } = await supabase.rpc("admin_create_marketplace_product", {
    p_name: name,
    p_slug: slug,
    p_description: description || null,
    p_price: price,
    p_stock: stock,
    p_commission_percent: commission,
    p_category_slug: category.slug,
    p_subcategory_slug: subcategory.slug,
  });
  if (error) {
    console.error("Admin product creation failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: error.code === "23505" ? "এই URL slug-টি আগে থেকেই ব্যবহৃত হয়েছে। অন্য slug দিন।" : "পণ্য সংরক্ষণ করা যায়নি। Product slug migration প্রয়োগ হয়েছে কি না যাচাই করুন।" }, { status: 400 });
  }

  if (imageUrls.length) {
    const { error: imageError } = await supabase.rpc("admin_update_product_images", {
      p_product_id: data.id,
      p_image_urls: imageUrls,
    });
    if (imageError) {
      console.error("Admin product image save failed", { code: imageError.code || "unknown" });
      return NextResponse.json({ product: data, warning: "পণ্য তৈরি হয়েছে, তবে ছবিগুলো সংরক্ষণ করা যায়নি। পণ্যটি Edit করে আবার ছবি যোগ করুন।" }, { status: 201 });
    }
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
