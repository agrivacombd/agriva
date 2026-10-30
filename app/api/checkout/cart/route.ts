import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeBangladeshPhone(input: string): string | null {
  let digits = input.trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (digits.startsWith("00880")) digits = digits.slice(2);
  if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
  if (/^1[3-9]\d{8}$/.test(digits)) return `+880${digits}`;
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "অর্ডার করতে আগে লগইন করুন।" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawAddress = body?.shippingAddress;
  if (!rawAddress || typeof rawAddress !== "object" || Array.isArray(rawAddress)) {
    return NextResponse.json({ error: "ডেলিভারির তথ্য সঠিক নয়।" }, { status: 400 });
  }
  const phone = normalizeBangladeshPhone(cleanText(rawAddress.phone, 30));
  if (!phone) {
    return NextResponse.json({ error: "বাংলাদেশের সঠিক মোবাইল নম্বর দিন: 01XXXXXXXXX অথবা +8801XXXXXXXXX।" }, { status: 400 });
  }

  const shippingAddress = {
    fullName: cleanText(rawAddress.fullName, 100),
    phone,
    division: cleanText(rawAddress.division, 80),
    district: cleanText(rawAddress.district, 80),
    upazila: cleanText(rawAddress.upazila, 100),
    unionOrArea: cleanText(rawAddress.unionOrArea, 120),
    villageRoadHouse: cleanText(rawAddress.villageRoadHouse, 250),
    landmark: cleanText(rawAddress.landmark, 200),
    postalCode: cleanText(rawAddress.postalCode, 20),
    deliveryInstructions: cleanText(rawAddress.deliveryInstructions, 500),
    address: [
      cleanText(rawAddress.upazila, 100),
      cleanText(rawAddress.unionOrArea, 120),
      cleanText(rawAddress.villageRoadHouse, 250),
    ].filter(Boolean).join(", "),
  };
  if (!shippingAddress.fullName || !shippingAddress.division || !shippingAddress.district ||
      !shippingAddress.upazila || !shippingAddress.unionOrArea || !shippingAddress.villageRoadHouse) {
    return NextResponse.json({ error: "নাম, বিভাগ, জেলা, উপজেলা/থানা, ইউনিয়ন/এলাকা এবং সম্পূর্ণ ঠিকানা পূরণ করুন।" }, { status: 400 });
  }

  const idempotencyKey = cleanText(body?.idempotencyKey, 100);
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
    return NextResponse.json({ error: "Checkout request key অনুপস্থিত। আবার চেষ্টা করুন।" }, { status: 400 });
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
    p_idempotency_key: idempotencyKey,
    p_attribution_code: code,
    p_visitor_token: visitorToken,
  });

  if (error) {
    console.error("[checkout/cart] Checkout RPC failed", { code: error.code, message: error.message });
    if (/Authentication required/i.test(error.message)) {
      return NextResponse.json({ error: "সেশন শেষ হয়েছে। আবার লগইন করুন।" }, { status: 401 });
    }
    if (/Maximum quantity per product/i.test(error.message)) {
      return NextResponse.json({ error: "একটি পণ্যের জন্য সর্বোচ্চ ১০০টি অর্ডার করা যাবে। কার্টের পরিমাণ কমিয়ে আবার চেষ্টা করুন।" }, { status: 400 });
    }
    if (/Insufficient stock|Product unavailable/i.test(error.message)) {
      return NextResponse.json({ error: "কার্টের একটি পণ্যের স্টক বা availability বদলে গেছে। কার্ট যাচাই করে আবার চেষ্টা করুন।" }, { status: 409 });
    }
    if (/Cart is empty|Active cart not found/i.test(error.message)) {
      return NextResponse.json({ error: "আপনার কার্ট খালি। আগে পণ্য যোগ করুন।" }, { status: 400 });
    }
    if (/Complete Bangladesh shipping details are required/i.test(error.message)) {
      return NextResponse.json({ error: "ডেলিভারির সব প্রয়োজনীয় তথ্য পূরণ করুন।" }, { status: 400 });
    }
    return NextResponse.json({ error: "অর্ডার তৈরি করা যায়নি। আপনার কার্ট যাচাই করে আবার চেষ্টা করুন।" }, { status: 400 });
  }
  if (!checkout?.checkoutId) {
    return NextResponse.json({ error: "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({
    orderId: checkout.checkoutId,
    total: Number(checkout.total),
    itemOrderCount: Number(checkout.itemOrderCount ?? 0),
    paymentMethod: "cod",
    idempotentReplay: Boolean(checkout.idempotentReplay),
  });
}
