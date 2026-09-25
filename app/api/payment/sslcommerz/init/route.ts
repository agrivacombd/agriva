import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { orderId } = await request.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 503 });

  const { data: order } = await supabase.from("marketplace_orders").select("id,total_amount,buyer_id,status").eq("id", orderId).maybeSingle();
  if (!order || (order.buyer_id && order.buyer_id !== user?.id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ error: "Order is not payable" }, { status: 400 });

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL is not configured" }, { status: 503 });
  const tranId = `AGRIVA-${order.id}`;
  const endpoint = process.env.SSLCOMMERZ_SANDBOX === "true" ? "https://sandbox-gw.sslcommerz.com/gwprocess/v4/api.php" : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";
  const form = new URLSearchParams({ store_id: process.env.SSLCOMMERZ_STORE_ID, store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD, total_amount: String(order.total_amount), currency: "BDT", tran_id: tranId, product_category: "agriculture", success_url: `${base}/api/payment/sslcommerz/success`, fail_url: `${base}/api/payment/sslcommerz/fail`, cancel_url: `${base}/api/payment/sslcommerz/cancel`, ipn_url: `${base}/api/payment/sslcommerz/ipn`, cus_name: user?.email || "AGRIVA Customer", cus_email: user?.email || "customer@example.com", cus_add1: "Bangladesh", cus_city: "Bangladesh", cus_country: "Bangladesh" });
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.GatewayPageURL) return NextResponse.json({ error: "Unable to initialize payment" }, { status: 502 });
  await supabase.from("marketplace_orders").update({ payment_reference: tranId }).eq("id", order.id);
  return NextResponse.json({ gatewayUrl: data.GatewayPageURL });
}
