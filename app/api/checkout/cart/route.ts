import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "লগইন করে অর্ডার করুন।" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawAddress = body?.shippingAddress;
  if (!rawAddress || typeof rawAddress !== "object" || Array.isArray(rawAddress)) {
    return NextResponse.json({ error: "ডেলিভারির তথ্য সঠিক নয়।" }, { status: 400 });
  }

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

  const { data: settings, error: settingsError } = await supabase.rpc("get_public_site_settings");
  if (settingsError) {
    return NextResponse.json({ error: "Checkout settings যাচাই করা যাচ্ছে না। পরে আবার চেষ্টা করুন।" }, { status: 503 });
  }
  const codSetting = (settings ?? []).find((setting: { key: string; value: string }) => setting.key === "cod_enabled");
  if (codSetting?.value !== "true") {
    return NextResponse.json({ error: "এই মুহূর্তে Cash on Delivery বন্ধ আছে।" }, { status: 403 });
  }

  const code = request.cookies.get("agriva_reseller")?.value ?? null;
  const visitorToken = request.cookies.get("agriva_visitor")?.value ?? null;
  const { data: checkout, error } = await supabase.rpc("finalize_marketplace_cart_checkout", {
    p_shipping_address: shippingAddress,
    p_attribution_code: code,
    p_visitor_token: visitorToken,
  });

  if (error) {
    const message = error.message || "অর্ডার তৈরি করা যায়নি।";
    const status = /Authentication required/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
  if (!checkout?.checkoutId) {
    return NextResponse.json({ error: "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।" }, { status: 400 });
  }

  return NextResponse.json({
    orderId: checkout.checkoutId,
    total: Number(checkout.total),
    itemOrderCount: Number(checkout.itemOrderCount ?? 0),
    paymentMethod: "cod",
  });
}
