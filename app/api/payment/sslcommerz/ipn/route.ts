import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }

  const tranId = String(form.get("tran_id") || "");
  const valId = String(form.get("val_id") || "");
  if (!tranId || !valId || !/^AGRIVA-[0-9a-f-]{36}$/i.test(tranId)) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }

  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!storeId || !storePassword || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Payment verification is not configured" }, { status: 503 });
  }

  const validationBase = process.env.SSLCOMMERZ_SANDBOX === "true"
    ? "https://sandbox-gw.sslcommerz.com/validator/api/validationserverAPI.php"
    : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

  let validation: Response;
  let validated: Record<string, unknown> | null;
  try {
    validation = await fetch(
      `${validationBase}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePassword)}&format=json`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" },
    );
    validated = await validation.json().catch(() => null) as Record<string, unknown> | null;
  } catch {
    return NextResponse.json({ error: "Payment gateway validation unavailable" }, { status: 502 });
  }

  const gatewayStatus = String(validated?.status ?? "").toUpperCase();
  const gatewayCurrency = String(validated?.currency ?? validated?.currency_type ?? "").toUpperCase();
  if (!validation.ok
    || !validated
    || !["VALID", "VALIDATED"].includes(gatewayStatus)
    || validated.tran_id !== tranId
    || gatewayCurrency !== "BDT"
    || !Number.isFinite(Number(validated.amount))) {
    return NextResponse.json({ error: "Payment validation failed" }, { status: 400 });
  }

  // IPN requests do not carry the customer's browser session. Use the server-only
  // service key after validating the transaction directly with SSLCommerz.
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const orderId = tranId.slice("AGRIVA-".length);
  const { data: order, error: orderError } = await supabase
    .from("marketplace_orders")
    .select("id,status,payment_status,total_amount,payment_reference")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: "Unable to load order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const expectedAmount = Number(order.total_amount);
  const receivedAmount = Number(validated.amount);
  if (!Number.isFinite(expectedAmount) || Math.abs(expectedAmount - receivedAmount) > 0.005) {
    return NextResponse.json({ error: "Payment amount does not match order" }, { status: 400 });
  }
  if (["cancelled", "refunded"].includes(String(order.status).toLowerCase())) {
    return NextResponse.json({ error: "Order is not payable" }, { status: 409 });
  }
  if (order.payment_status === "paid") {
    // Idempotent repeat notification for the same successful transaction.
    if (order.payment_reference === tranId) return NextResponse.json({ ok: true, status: "already_paid" });
    return NextResponse.json({ error: "Order already paid with another reference" }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("marketplace_orders")
    .update({
      payment_status: "paid",
      payment_reference: tranId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("payment_status", "paid");

  if (updateError) return NextResponse.json({ error: "Unable to record payment" }, { status: 500 });

  // Keep the fulfilment status separate from the payment status. Commission
  // remains pending until the existing fulfilment/hold policy releases it.
  return NextResponse.json({ ok: true, status: "paid" });
}
