import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await request.json().catch(() => ({}));
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const code = `${user.id.slice(0, 8)}-${productId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("reseller_links").insert({ product_id: productId, reseller_id: user.id, code });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ code, url: `/r/${code}` });
}
