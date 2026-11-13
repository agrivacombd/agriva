import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROBOT = /bot|crawler|spider|headless|lighthouse|preview|facebookexternalhit/i;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") {
    return new NextResponse(null, { status: 204 });
  }
  const ua = request.headers.get("user-agent") || "";
  if (!ua || ROBOT.test(ua)) return new NextResponse(null, { status: 204 });
  if (Number(request.headers.get("content-length") || 0) > 6000) {
    return NextResponse.json({ error: "Batch too large" }, { status: 413 });
  }
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const payload = data as { market?: unknown; events?: unknown };
  if ((payload.market !== "marketplace" && payload.market !== "plant-market") ||
      !Array.isArray(payload.events) || payload.events.length < 1 || payload.events.length > 32) {
    return NextResponse.json({ error: "Invalid event batch" }, { status: 400 });
  }

  const events = payload.events;
  if (!events.every((event) => event && typeof event === "object" &&
      !Array.isArray(event) && UUID.test(event.product_id) &&
      (event.event_type === "click" || event.event_type === "impression"))) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  // Unlike a client-supplied visitor ID, this identity cannot be reset to
  // manufacture many unique views. Only a one-way, server-keyed hash is stored.
  // No raw IP or UA reaches the database.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return new NextResponse(null, { status: 503 });
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unavailable";
  const viewerHash = createHmac("sha256", key).update(ip).update("\0").update(ua.slice(0, 256)).digest("hex");

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.rpc("record_product_rank_events", {
    p_market: payload.market, p_events: events, p_viewer_hash: viewerHash,
  });
  if (error) {
    console.error("Product ranking event recording failed", { code: error.code || "unknown" });
    return new NextResponse(null, { status: 503 });
  }
  return new NextResponse(null, { status: 204 });
}
