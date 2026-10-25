import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReferralTarget = { product_id: string; expires_at: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  if (!/^R-[A-F0-9]{10}$/.test(code)) {
    return NextResponse.redirect(new URL("/marketplace?referral=invalid", request.url));
  }

  const supabase = await createSupabaseServerClient();
  // Public resolver exposes only the product ID and expiry, not reseller profile data.
  const { data, error } = await supabase.rpc("resolve_reseller_link", { p_code: code });
  const target = (Array.isArray(data) ? data[0] : data) as ReferralTarget | null;

  if (error || !target?.product_id || !target.expires_at || new Date(target.expires_at).getTime() <= Date.now()) {
    return NextResponse.redirect(new URL("/marketplace?referral=expired", request.url));
  }

  const visitorToken = request.cookies.get("agriva_visitor")?.value || crypto.randomUUID();
  const { error: attributionError } = await supabase.rpc("record_attribution_session", {
    p_code: code,
    p_visitor_token: visitorToken,
    p_product_id: target.product_id,
    p_days: 15,
  });

  if (attributionError) {
    return NextResponse.redirect(new URL("/marketplace?referral=unavailable", request.url));
  }

  const destination = new URL(`/marketplace/${target.product_id}`, request.url);
  const response = NextResponse.redirect(destination);
  const maxAge = Math.max(0, Math.min(30 * 24 * 60 * 60, Math.floor((new Date(target.expires_at).getTime() - Date.now()) / 1000)));

  response.cookies.set("agriva_reseller", code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
  response.cookies.set("agriva_visitor", visitorToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });

  return response;
}
