import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: link } = await supabase.from("reseller_links").select("code,product_id,reseller_id").eq("code", code).maybeSingle();
  if (!link) return NextResponse.json({ error: "Reseller link not found" }, { status: 404 });

  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const visitorToken = crypto.randomUUID();
  await supabase.from("attribution_sessions").insert({ reseller_id: link.reseller_id, product_id: link.product_id, code, visitor_token: visitorToken, expires_at: expiresAt });

  const target = new URL(`/marketplace/${link.product_id}`, request.url);
  const response = NextResponse.redirect(target);
  response.cookies.set("agriva_reseller", code, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 15 * 24 * 60 * 60, path: "/" });
  response.cookies.set("agriva_visitor", visitorToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 15 * 24 * 60 * 60, path: "/" });
  return response;
}
