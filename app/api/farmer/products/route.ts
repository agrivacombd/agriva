import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "farmer") return NextResponse.json({ error: "Farmer access required" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const commission = Number(body.commission);
  const description = String(body.description || "").trim();
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100) return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("products").insert({ farmer_id: user.id, name, slug, price, stock, commission_percent: commission, description, status: "draft", moderation_status: "pending" }).select("id,name,moderation_status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}
