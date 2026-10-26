import { NextRequest, NextResponse } from "next/server";

function orderIdFrom(value: string | null) {
  const raw = (value || "").replace(/^AGRIVA-/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw) ? raw : "";
}

function failedRedirect(request: NextRequest, value: string | null) {
  const id = orderIdFrom(value);
  const destination = new URL("/orders", request.url);
  destination.searchParams.set("payment", "failed");
  if (id) destination.searchParams.set("orderId", id);
  return NextResponse.redirect(destination);
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return failedRedirect(request, null); }
  return failedRedirect(request, String(form.get("tran_id") || ""));
}

export async function GET(request: NextRequest) {
  return failedRedirect(request, new URL(request.url).searchParams.get("tran_id"));
}
