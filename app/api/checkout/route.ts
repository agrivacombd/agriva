import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: "লগইন করে অর্ডার করুন।" }, { status: 401 });
  if (!user) return NextResponse.json({ error: "লগইন করে অর্ডার করুন।" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "অর্ডারের তথ্য সঠিক নয়।" }, { status: 400 });
  const productId = cleanText(body.productId, 64);
  const quantity = Number(body.quantity ?? 1);
  if (!productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    return NextResponse.json({ error: "পণ্য ও পরিমাণ যাচাই করুন।" }, { status: 400 });
  }
  if (body.paymentMethod && body.paymentMethod !== "cod") {
    return NextResponse.json({ error: "অনলাইন পেমেন্ট এখনো চালু হয়নি।" }, { status: 400 });
  }
  const { data: settings, error: settingsError } = await supabase.rpc("get_public_site_settings");
  if (settingsError) return NextResponse.json({ error: "Checkout settings যাচাই করা যাচ্ছে না।" }, { status: 503 });
  const codSetting = (settings ?? []).find((setting: { key: string; value: string }) => setting.key === "cod_enabled");
  if (codSetting?.value !== "true") return NextResponse.json({ error: "Cash on Delivery বর্তমানে বন্ধ আছে।" }, { status: 403 });

  const raw = body.shippingAddress && typeof body.shippingAddress === "object" && !Array.isArray(body.shippingAddress)
    ? body.shippingAddress as Record<string, unknown> : {};
  const shippingAddress = {
    fullName: cleanText(raw.fullName, 100),
    phone: cleanText(raw.phone, 20),
    district: cleanText(raw.district, 80),
    upazila: cleanText(raw.upazila, 100),
    address: cleanText(raw.address, 500),
  };
  if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.district || !shippingAddress.upazila || !shippingAddress.address) {
    return NextResponse.json({ error: "নাম, মোবাইল, জেলা, উপজেলা ও সম্পূর্ণ ঠিকানা দিন।" }, { status: 400 });
  }
  if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(shippingAddress.phone.replace(/[\s()-]/g, ""))) {
    return NextResponse.json({ error: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন।" }, { status: 400 });
  }
  const { data: order, error } = await supabase.rpc("finalize_marketplace_cod_order_safe", {
    p_product_id: productId,
    p_quantity: quantity,
    p_shipping_address: shippingAddress,
    p_attribution_code: request.cookies.get("agriva_reseller")?.value ?? null,
    p_visitor_token: request.cookies.get("agriva_visitor")?.value ?? null,
  });
  if (error) {
    console.error("Marketplace checkout RPC failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "অর্ডার সম্পন্ন করা যায়নি। পণ্য ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।" }, { status: 409 });
  }
  if (!order) return NextResponse.json({ error: "অর্ডার তৈরি করা যায়নি।" }, { status: 400 });
  return NextResponse.json({ orderId: order.id, total: Number(order.total_amount), commission: Number(order.commission_amount), resellerAttributed: Boolean(order.reseller_id), paymentMethod: "cod" });
}
