import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readLimitedBody } from "@/lib/http/read-limited-body.mjs";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUYER_TYPES = new Set(["individual", "business"]);
const VISIBILITIES = new Set(["public", "private"]);
const MAX_DEADLINE_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 2048;


export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "JSON body required" }, { status: 415 });
  }

  const rawBody = await readLimitedBody(request, MAX_BODY_BYTES);
  if (rawBody === null) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }
  const body = (() => {
    try { return JSON.parse(rawBody); } catch { return null; }
  })();

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !UUID.test(body.demandId || "") ||
      !BUYER_TYPES.has(body.buyerType) ||
      !VISIBILITIES.has(body.visibility) ||
      typeof body.quoteDeadline !== "string") {
    return NextResponse.json({ error: "Conversion options are invalid" }, { status: 400 });
  }

  const deadline = Date.parse(body.quoteDeadline);
  const now = Date.now();
  if (!Number.isFinite(deadline) || deadline <= now || deadline > now + MAX_DEADLINE_MS) {
    return NextResponse.json({ error: "Choose a future quote deadline within 90 days" }, { status: 400 });
  }

  const { data: requestId, error } = await supabase.rpc("convert_buyer_demand_to_bulk_rfq", {
    p_demand_id: body.demandId,
    p_buyer_type: body.buyerType,
    p_visibility: body.visibility,
    p_quote_deadline: new Date(deadline).toISOString(),
  });

  if (error || typeof requestId !== "string" || !UUID.test(requestId)) {
    // Do not disclose whether another buyer owns the source demand or expose SQL details.
    return NextResponse.json({ error: "Demand could not be converted. Check that it is active and belongs to your account." }, { status: 409 });
  }

  return NextResponse.json({ requestId, status: "pending_review", href: "/account/custom-orders" }, { status: 200 });
}
