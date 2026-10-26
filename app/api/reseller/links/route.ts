import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) {
    console.error("Reseller link role lookup failed", { code: profileError.code || "unknown" });
    return NextResponse.json({ error: "অনুমতি যাচাই করা যাচ্ছে না। পরে আবার চেষ্টা করুন।" }, { status: 503 });
  }
  if (profile?.role !== "reseller") {
    return NextResponse.json({ error: "রেফারেল লিংক তৈরি করতে রিসেলার অ্যাকাউন্ট প্রয়োজন।" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
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
