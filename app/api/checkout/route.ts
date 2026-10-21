import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ResellerAttribution {
  reseller_id: string | null;
  expires_at: string | null;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "লগইন করে অর্ডার করুন।" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "অর্ডারের তথ্য সঠিক নয়।" }, { status: 400 });
  }

  const productId = cleanText(body.productId, 64);
  const rawQuantity = Number(body.quantity ?? 1);
  if (!productId) return NextResponse.json({ error: "পণ্য নির্বাচন করুন।" }, { status: 400 });
  if (!Number.isSafeInteger(rawQuantity) || rawQuantity < 1 || rawQuantity > 100) {
    return NextResponse.json({ error: "পরিমাণ ১ থেকে ১০০-এর মধ্যে দিন।" }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod === "online" ? "online" : "cod";
  if (paymentMethod !== "cod") {
    return NextResponse.json({ error: "অনলাইন পেমেন্ট এখনো চালু হয়নি। ক্যাশ অন ডেলিভারি নির্বাচন করুন।" }, { status: 400 });
  }

  const rawAddress = body.shippingAddress && typeof body.shippingAddress === "object" && !Array.isArray(body.shippingAddress)
    ? body.shippingAddress as Record<string, unknown>
    : {};
  const shippingAddress = {
    fullName: cleanText(rawAddress.fullName, 100),
    phone: cleanText(rawAddress.phone, 20),
    district: cleanText(rawAddress.district, 80),
    address: cleanText(rawAddress.address, 500),
  };

  if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.district || !shippingAddress.address) {
    return NextResponse.json({ error: "নাম, মোবাইল নম্বর, জেলা ও সম্পূর্ণ ঠিকানা দিন।" }, { status: 400 });
  }
  const phoneDigits = shippingAddress.phone.replace(/[\s()-]/g, "");
  if (!/^\+?\d{10,14}$/.test(phoneDigits)) {
    return NextResponse.json({ error: "সঠিক মোবাইল নম্বর দিন।" }, { status: 400 });
  }

  let resellerId: string | null = null;
  let attributionExpiresAt: string | null = null;
  const cookieCode = request.cookies.get("agriva_reseller")?.value;
  const visitorToken = request.cookies.get("agriva_visitor")?.value;

  if (cookieCode && visitorToken) {
    const { data: rawAttribution, error: attributionError } = await supabase.rpc("resolve_reseller_attribution", {
      p_code: cookieCode,
      p_visitor_token: visitorToken,
      p_product_id: productId,
    }).maybeSingle();

    if (!attributionError && rawAttribution) {
      const attribution: ResellerAttribution = {
        reseller_id: typeof (rawAttribution as Record<string, unknown>).reseller_id === "string"
          ? (rawAttribution as Record<string, unknown>).reseller_id as string
          : null,
        expires_at: typeof (rawAttribution as Record<string, unknown>).expires_at === "string"
          ? (rawAttribution as Record<string, unknown>).expires_at as string
          : null,
      };
      resellerId = attribution.reseller_id;
      attributionExpiresAt = attribution.expires_at;
    }
  }

  const { data: order, error } = await supabase.rpc("finalize_marketplace_cod_order", {
    p_product_id: productId,
    p_quantity: rawQuantity,
    p_shipping_address: shippingAddress,
    p_reseller_id: resellerId,
    p_attribution_code: resellerId ? cookieCode : null,
    p_attribution_expires_at: resellerId ? attributionExpiresAt : null,
    p_visitor_token: resellerId ? visitorToken : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!order) return NextResponse.json({ error: "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।" }, { status: 400 });

  return NextResponse.json({
    orderId: order.id,
    total: Number(order.total_amount),
    commission: Number(order.commission_amount),
    resellerAttributed: Boolean(order.reseller_id),
    paymentMethod: "cod",
  });
}
