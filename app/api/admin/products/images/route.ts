import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

export async function PATCH(request: NextRequest) {
  const access = await requireAdminApi("catalog.edit");
  if (!access.ok) return access.response;
  const { supabase } = access;
  const body = await request.json().catch(() => ({}));
  const productId = String(body.productId || "").trim();
  const submitted: unknown[] = Array.isArray(body.image_urls) ? body.image_urls : [];
  const imageUrls = submitted.reduce<string[]>((result, value) => {
    if (typeof value === "string" && value.trim().length > 0) result.push(value.trim());
    return result;
  }, []);
  if (!productId || imageUrls.length > 4 || imageUrls.length !== submitted.length) {
    return NextResponse.json({ error: "সর্বোচ্চ ৪টি সঠিক product image URL দিন।" }, { status: 400 });
  }
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!storageUrl) return NextResponse.json({ error: "Storage configuration পাওয়া যায়নি।" }, { status: 500 });
  try {
    const origin = new URL(storageUrl).origin;
    const valid = imageUrls.every(value => {
      const url = new URL(value);
      return url.origin === origin && url.protocol === "https:" &&
        /^\/storage\/v1\/object\/public\/product-images\/[0-9a-f-]+\/[0-9a-f-]{8}-[0-9a-f-]{4}-4[0-9a-f-]{3}-[89ab][0-9a-f-]{3}-[0-9a-f-]{12}\.(?:jpg|png|webp)$/i.test(url.pathname) &&
        !url.search && !url.hash;
    });
    if (!valid) return NextResponse.json({ error: "শুধু AGRIVA product storage-এর ছবি ব্যবহার করা যাবে।" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "ছবির URL সঠিক নয়।" }, { status: 400 });
  }
  const { error } = await supabase.rpc("admin_update_product_images", { p_product_id: productId, p_image_urls: imageUrls });
  if (error) {
    console.error("Admin product image update failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "ছবিগুলো সংরক্ষণ করা যায়নি।" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
