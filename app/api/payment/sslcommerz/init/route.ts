import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { orderId } = await request.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 503 });

  const { data: publicSettings } = await supabase.rpc("get_public_site_settings");
  const onlinePaymentEnabled = (publicSettings ?? []).find((setting: { key: string; value: string }) => setting.key === "online_payment_enabled")?.value;
  if (onlinePaymentEnabled !== "true") return NextResponse.json({ error: "Online payment is currently disabled" }, { status: 503 });

  const { data: order } = await supabase.from("marketplace_orders").select("id,total_amount,buyer_id,status,payment_status").eq("id", orderId).maybeSingle();
  if (!order || (order.buyer_id && order.buyer_id !== user?.id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!["pending", "processing"].includes(order.status) || order.payment_status === "paid") return NextResponse.json({ error: "Order is not payable" }, { status: 400 });

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL is not configured" }, { status: 503 });
  const tranId = `AGRIVA-${order.id}`;
  const endpoint = process.env.SSLCOMMERZ_SANDBOX === "true" ? "https://sandbox-gw.sslcommerz.com/gwprocess/v4/api.php" : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";
  const form = new URLSearchParams({ store_id: process.env.SSLCOMMERZ_STORE_ID, store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD, total_amount: String(order.total_amount), currency: "BDT", tran_id: tranId, product_category: "agriculture", success_url: `${base}/api/payment/sslcommerz/success`, fail_url: `${base}/api/payment/sslcommerz/fail`, cancel_url: `${base}/api/payment/sslcommerz/cancel`, ipn_url: `${base}/api/payment/sslcommerz/ipn`, cus_name: user?.email || "AGRIVA Customer", cus_email: user?.email || "customer@example.com", cus_add1: "Bangladesh", cus_city: "Bangladesh", cus_country: "Bangladesh" });
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.GatewayPageURL) return NextResponse.json({ error: "Unable to initialize payment" }, { status: 502 });
  const { data: reservedOrder, error: referenceError } = await supabase.from("marketplace_orders")
    .update({ payment_reference: tranId, payment_method: "sslcommerz" })
    .eq("id", order.id)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  if (referenceError || !reservedOrder) return NextResponse.json({ error: "Unable to reserve payment reference" }, { status: 409 });
  return NextResponse.json({ gatewayUrl: data.GatewayPageURL });
}
