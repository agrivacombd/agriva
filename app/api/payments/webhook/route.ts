import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_BODY_BYTES = 64 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_STATUSES = new Set(["authorized", "paid", "failed", "refunded"]);

function validSecret(signature: string | null, expected: string | undefined): boolean {
  if (!signature || !expected) return false;
  const providedBytes = Buffer.from(signature, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
}

// Shared-secret webhook foundation. A provider with its own signing protocol must use
// that provider's official signature verification before it is connected here.
export async function POST(req: NextRequest) {
  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  if (!validSecret(req.headers.get("x-payment-signature"), process.env.PAYMENT_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid payment event" }, { status: 400 });
  }

  const event = body as Record<string, unknown>;
  const orderId = event.orderId;
  const provider = event.provider === undefined ? "custom" : event.provider;
  const providerTransactionId = event.providerTransactionId;
  const amount = event.amount;
  const status = event.status;
  const idempotencyKey = event.idempotencyKey;
  const metadata = event.metadata === undefined ? {} : event.metadata;

  if (
    typeof orderId !== "string" || !UUID_PATTERN.test(orderId) ||
    typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 128 ||
    typeof provider !== "string" || !provider.trim() || provider.length > 80 ||
    (providerTransactionId !== undefined && providerTransactionId !== null &&
      (typeof providerTransactionId !== "string" || providerTransactionId.length > 200)) ||
    typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 ||
    typeof status !== "string" || !PAYMENT_STATUSES.has(status) ||
    !metadata || typeof metadata !== "object" || Array.isArray(metadata)
  ) {
    return NextResponse.json({ error: "Invalid payment event" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server configuration missing" }, { status: 503 });

  const supabase = createClient(url, key);
  const { error } = await supabase.rpc("record_payment_event", {
    p_order_id: orderId,
    p_provider: provider,
    p_provider_transaction_id: providerTransactionId || null,
    p_amount: amount,
    p_status: status,
    p_idempotency_key: idempotencyKey,
    p_metadata: metadata,
  });

  if (error) {
    console.error("Payment webhook RPC failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "Unable to process payment event" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
