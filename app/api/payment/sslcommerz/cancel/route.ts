import { NextRequest, NextResponse } from "next/server";
import { readRequestBytesWithLimit } from "@/lib/http/read-limited-request-body";

function orderIdFrom(value: string | null) {
  const raw = (value || "").replace(/^AGRIVA-/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw) ? raw : "";
}

function cancelledRedirect(request: NextRequest, value: string | null) {
  const destination = new URL("/orders", request.url);
  destination.searchParams.set("payment", "cancelled");
  const id = orderIdFrom(value);
  if (id) destination.searchParams.set("orderId", id);
  return NextResponse.redirect(destination);
}

export async function POST(request: NextRequest) {
  const boundedBody = await readRequestBytesWithLimit(request, 16 * 1024);
  if (!boundedBody.ok) return cancelledRedirect(request, null);
  try {
    const form = await new Response(boundedBody.bytes, { headers: request.headers }).formData();
    return cancelledRedirect(request, String(form.get("tran_id") || ""));
  } catch {
    return cancelledRedirect(request, null);
  }
}

export async function GET(request: NextRequest) {
  return cancelledRedirect(request, new URL(request.url).searchParams.get("tran_id"));
}
