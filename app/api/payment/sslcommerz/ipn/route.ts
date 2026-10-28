import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid notification" }, { status: 400 }); }

  const tranId = String(form.get("tran_id") || "");
  const valId = String(form.get("val_id") || "");
  if (!tranId || !valId || valId.length > 200 ||
      !/^AGRIVA-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tranId)) {
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
    validation = await fetch(
      `${validationBase}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_ID)}&store_passwd=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_PASSWORD)}&format=json`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) },
    );
    validated = await validation.json().catch(() => null);
  } catch {
    return NextResponse.json({ error: "Payment validation unavailable" }, { status: 502 });
  }

  const gatewayStatus = String(validated?.status || "").toUpperCase();
  const currency = String(validated?.currency || "").toUpperCase();
  const amount = Number(validated?.amount);
  if (!validation.ok ||
      !["VALID", "VALIDATED"].includes(gatewayStatus) ||
      String(validated?.store_id || "") !== process.env.SSLCOMMERZ_STORE_ID ||
      validated?.tran_id !== tranId ||
      currency !== "BDT" ||
      !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Payment validation failed" }, { status: 400 });
  }

  const orderId = tranId.slice("AGRIVA-".length);
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    console.error("SSLCommerz reconciliation unavailable: service-role configuration missing");
    return NextResponse.json({ error: "Payment reconciliation is not configured" }, { status: 503 });
  }

  // The database function locks the order, verifies the canonical amount and
  // state, then records payment + audit event atomically and idempotently.
  const { data, error } = await supabase.rpc("reconcile_sslcommerz_payment", {
    p_order_id: orderId,
    p_tran_id: tranId,
    p_val_id: valId,
    p_amount: amount,
    p_currency: currency,
    p_gateway_status: gatewayStatus,
  });

  if (error) {
    console.error("SSLCommerz database reconciliation failed", { code: error.code || "unknown" });
    if (error.code === "P0002") return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (error.code === "22023") return NextResponse.json({ error: "Payment details do not match the order" }, { status: 400 });
    if (error.code === "55000") return NextResponse.json({ error: "Order is not payable" }, { status: 409 });
    return NextResponse.json({ error: "Unable to record payment" }, { status: 503 });
  }

  if (!data || typeof data !== "object" || (data as Record<string, unknown>).ok !== true) {
    return NextResponse.json({ error: "Unable to verify payment result" }, { status: 503 });
  }

  // Fulfillment status stays unchanged; commissions are not released by payment alone.
  return NextResponse.json(data);
}
