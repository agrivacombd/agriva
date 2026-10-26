import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function sameAmount(actual: unknown, expected: unknown) {
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);
  return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) &&
    actualNumber > 0 && Math.round(actualNumber * 100) === Math.round(expectedNumber * 100);
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid notification" }, { status: 400 }); }

  const tranId = String(form.get("tran_id") || "");
  const valId = String(form.get("val_id") || "");
  if (!tranId || !valId || !/^AGRIVA-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tranId)) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
    return NextResponse.json({ error: "Gateway not configured" }, { status: 503 });
  }

  const validationBase = process.env.SSLCOMMERZ_SANDBOX === "true"
    ? "https://sandbox-gw.sslcommerz.com/validator/api/validationserverAPI.php"
    : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";
  let validation: Response;
  let validated: any;
  try {
    validation = await fetch(`${validationBase}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_ID)}&store_passwd=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_PASSWORD)}&format=json`, { cache: "no-store" });
    validated = await validation.json().catch(() => null);
  } catch {
    return NextResponse.json({ error: "Payment validation unavailable" }, { status: 502 });
  }

  if (!validation.ok ||
      !["VALID", "VALIDATED"].includes(String(validated?.status || "").toUpperCase()) ||
      validated?.tran_id !== tranId ||
      String(validated?.currency || "").toUpperCase() !== "BDT") {
    return NextResponse.json({ error: "Payment validation failed" }, { status: 400 });
  }

  const orderId = tranId.slice("AGRIVA-".length);
  const supabase = await createSupabaseServerClient();
  const { data: order, error: orderError } = await supabase.from("marketplace_orders")
    .select("id,total_amount,status,payment_status,payment_method,payment_reference")
    .eq("id", orderId).maybeSingle();
  if (orderError) return NextResponse.json({ error: "Unable to verify order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!sameAmount(validated?.amount, order.total_amount)) {
    return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
  }

  if (order.payment_status === "paid" && order.payment_reference === tranId) {
    return NextResponse.json({ ok: true, status: "paid", duplicate: true });
  }
  if (order.payment_method !== "online" || order.payment_status !== "pending" || order.status !== "pending") {
    return NextResponse.json({ error: "Order is not payable" }, { status: 409 });
  }

  const { data: updated, error: updateError } = await supabase.from("marketplace_orders")
    .update({ payment_status: "paid", paid_at: new Date().toISOString(), payment_reference: tranId })
    .eq("id", order.id).eq("payment_method", "online").eq("payment_status", "pending").eq("status", "pending")
    .select("id").maybeSingle();
  if (updateError) return NextResponse.json({ error: "Unable to record payment" }, { status: 500 });
  if (!updated) {
    const { data: latest, error: latestError } = await supabase.from("marketplace_orders")
      .select("payment_status,payment_reference").eq("id", order.id).maybeSingle();
    if (latestError) return NextResponse.json({ error: "Unable to verify payment state" }, { status: 500 });
    if (latest?.payment_status === "paid" && latest.payment_reference === tranId) {
      return NextResponse.json({ ok: true, status: "paid", duplicate: true });
    }
    return NextResponse.json({ error: "Order payment state changed" }, { status: 409 });
  }

  // Fulfillment status stays unchanged; commission remains pending until fulfillment policy releases it.
  return NextResponse.json({ ok: true, status: "paid" });
}
