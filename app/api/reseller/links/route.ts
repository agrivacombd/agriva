import { NextRequest, NextResponse } from "next/server";
import { readRequestBodyWithLimit } from "@/lib/http/read-limited-request-body";
import { authorizePermission } from "@/lib/auth/server-authorization";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const authorization = await authorizePermission("reseller.links.create_own");
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }
  const { supabase } = authorization;

  const boundedBody = await readRequestBodyWithLimit(request, 8192);
  if (!boundedBody.ok) return NextResponse.json({ error: "Request body exceeds size limit" }, { status: 413 });
  let body: any;
  try { body = JSON.parse(boundedBody.text); }
  catch { return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 }); }
  const productId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).productId
    : null;
  if (typeof productId !== "string" || !UUID_PATTERN.test(productId)) {
    return NextResponse.json({ error: "সঠিক পণ্য নির্বাচন করুন।" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_reseller_link", {
    p_product_id: productId,
    p_days: 15,
  });
  if (error || !data) {
    console.error("Reseller link creation failed", { code: error?.code || "unknown" });
    return NextResponse.json({ error: "রেফারেল লিংক তৈরি করা যায়নি। পণ্যটি সক্রিয় কি না যাচাই করুন।" }, { status: 400 });
  }
  return NextResponse.json({ code: data.code, url: `/r/${data.code}`, expiresAt: data.expires_at });
}
