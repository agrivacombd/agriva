import { NextRequest, NextResponse } from "next/server";
import { readRequestBodyWithLimit } from "@/lib/http/read-limited-request-body";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const boundedBody = await readRequestBodyWithLimit(request, 8192);
  if (!boundedBody.ok) return NextResponse.json({ error: "Request body exceeds size limit" }, { status: 413 });
  let body: any;
  try { body = JSON.parse(boundedBody.text); }
  catch { return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 }); }
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
    return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 503 });
  }

  const { data: order, error: orderError } = await supabase.from("marketplace_orders")
    .select("id,total_amount,buyer_id,status,payment_status,payment_method").eq("id", orderId).maybeSingle();
  if (orderError) return NextResponse.json({ error: "Unable to verify order" }, { status: 500 });
  if (!order || order.buyer_id !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_method !== "online" || order.payment_status !== "pending" || order.status !== "pending") {
    return NextResponse.json({ error: "Order is not payable" }, { status: 400 });
  }
  const amount = Number(order.total_amount);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL is not configured" }, { status: 503 });
  const tranId = `AGRIVA-${order.id}`;
  const endpoint = process.env.SSLCOMMERZ_SANDBOX === "true"
    ? "https://sandbox-gw.sslcommerz.com/gwprocess/v4/api.php"
    : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";
  const form = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID, store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: amount.toFixed(2), currency: "BDT", tran_id: tranId, product_category: "agriculture",
    success_url: `${base}/api/payment/sslcommerz/success`, fail_url: `${base}/api/payment/sslcommerz/fail`,
    cancel_url: `${base}/api/payment/sslcommerz/cancel`, ipn_url: `${base}/api/payment/sslcommerz/ipn`,
    cus_name: user.email || "AGRIVA Customer", cus_email: user.email || "customer@example.com",
    cus_add1: "Bangladesh", cus_city: "Bangladesh", cus_country: "Bangladesh",
  });

  let response: Response;
  let data: any;
  try {
    response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    data = await response.json().catch(() => null);
  } catch {
    return NextResponse.json({ error: "Payment gateway unavailable" }, { status: 502 });
  }
  if (!response.ok || typeof data?.GatewayPageURL !== "string") {
    return NextResponse.json({ error: "Unable to initialize payment" }, { status: 502 });
  }

  let gatewayUrl: URL;
  try {
    gatewayUrl = new URL(data.GatewayPageURL);
  } catch {
    return NextResponse.json({ error: "Invalid payment gateway response" }, { status: 502 });
  }
  if (gatewayUrl.protocol !== "https:" ||
      !(gatewayUrl.hostname === "sslcommerz.com" || gatewayUrl.hostname.endsWith(".sslcommerz.com"))) {
    return NextResponse.json({ error: "Invalid payment gateway response" }, { status: 502 });
  }

  // Compare-and-set the payment reference only while the order remains payable.
  // Re-read the returned row so a concurrent status change cannot still yield a gateway URL.
  const { data: referencedOrder, error: referenceError } = await supabase.from("marketplace_orders")
    .update({ payment_reference: tranId })
    .eq("id", order.id).eq("buyer_id", user.id).eq("payment_method", "online")
    .eq("payment_status", "pending").eq("status", "pending")
    .select("id").maybeSingle();
  if (referenceError) return NextResponse.json({ error: "Unable to save payment reference" }, { status: 500 });
  if (!referencedOrder) return NextResponse.json({ error: "Order is no longer payable" }, { status: 409 });
  return NextResponse.json({ gatewayUrl: gatewayUrl.toString() });
}
