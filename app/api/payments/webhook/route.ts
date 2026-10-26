import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function hasValidSignature(rawBody: string, signature: string | null, secret: string | undefined) {
  if (!secret || !signature || !signature.startsWith("sha256=")) return false;
  const suppliedHex = signature.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Generic raw-body HMAC-SHA256 contract. A real payment provider must be configured
// to sign the exact raw body using this scheme, or this verifier must be replaced
// with that provider's official signature verification before accepting live events.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!hasValidSignature(raw, req.headers.get("x-payment-signature"), process.env.PAYMENT_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid payment event" }, { status: 400 });
  }

  const {
    orderId,
    provider = "custom",
    providerTransactionId,
    amount,
    status,
    idempotencyKey,
    metadata = {},
  } = body;

  const validOrderId = typeof orderId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
  const validProvider = typeof provider === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(provider);
  const validTransactionId = providerTransactionId === undefined || providerTransactionId === null ||
    (typeof providerTransactionId === "string" && providerTransactionId.length <= 200);
  const validAmount = typeof amount === "number" && Number.isFinite(amount) && amount > 0;
  const validStatus = ["authorized", "paid", "failed", "refunded"].includes(String(status));
  const validIdempotencyKey = typeof idempotencyKey === "string" &&
    idempotencyKey.length >= 8 && idempotencyKey.length <= 200;
  const validMetadata = isRecord(metadata);

  if (
    !validOrderId || !validProvider || !validTransactionId || !validAmount ||
    !validStatus || !validIdempotencyKey || !validMetadata
  ) {
    return NextResponse.json({ error: "Invalid payment event" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 503 });
  }

  const supabase = createClient(url, serviceRoleKey);
  const { error } = await supabase.rpc("record_payment_event", {
    p_order_id: orderId,
    p_provider: provider,
    p_provider_transaction_id: providerTransactionId ?? null,
    p_amount: amount,
    p_status: status,
    p_idempotency_key: idempotencyKey,
    p_metadata: metadata,
  });

  if (error) return NextResponse.json({ error: "Unable to record payment event" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
