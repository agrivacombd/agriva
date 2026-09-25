import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tranId = String(form.get("tran_id") || "");
  const valId = String(form.get("val_id") || "");
  const status = String(form.get("status") || "");
  if (!tranId || !valId) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) return NextResponse.json({ error: "Gateway not configured" }, { status: 503 });

  const validationBase = process.env.SSLCOMMERZ_SANDBOX === "true" ? "https://sandbox-gw.sslcommerz.com/validator/api/validationserverAPI.php" : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";
  const validation = await fetch(`${validationBase}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_ID)}&store_passwd=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_PASSWORD)}&format=json`);
  const validated = await validation.json().catch(() => null);
  if (!validation.ok || validated?.status !== "VALID" || validated?.tran_id !== tranId) return NextResponse.json({ error: "Payment validation failed" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const orderId = tranId.replace(/^AGRIVA-/, "");
  const { data: order } = await supabase.from("marketplace_orders").select("id,status").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "paid") await supabase.from("marketplace_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);

  // Commission remains pending until fulfillment/hold policy releases it.
  return NextResponse.json({ ok: true, status });
}
