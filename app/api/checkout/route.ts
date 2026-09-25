import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json().catch(() => ({}));
  const productId = body.productId as string;
  const quantity = Math.max(1, Number(body.quantity || 1));
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const { data: product } = await supabase.from("products").select("id,farmer_id,price,stock,commission_percent").eq("id", productId).eq("status", "active").maybeSingle();
  if (!product || product.stock < quantity) return NextResponse.json({ error: "Product unavailable" }, { status: 400 });

  const cookieCode = request.cookies.get("agriva_reseller")?.value;
  const visitorToken = request.cookies.get("agriva_visitor")?.value;
  let resellerId: string | null = null;
  if (cookieCode && visitorToken) {
    const { data: attribution } = await supabase.from("attribution_sessions").select("reseller_id,expires_at").eq("code", cookieCode).eq("visitor_token", visitorToken).eq("product_id", productId).gt("expires_at", new Date().toISOString()).maybeSingle();
    resellerId = attribution?.reseller_id ?? null;
  }

  const total = Number(product.price) * quantity;
  const commission = resellerId ? total * Number(product.commission_percent) / 100 : 0;
  const { data: order, error } = await supabase.from("marketplace_orders").insert({ product_id: productId, farmer_id: product.farmer_id, buyer_id: user?.id ?? null, reseller_id: resellerId, quantity, unit_price: product.price, total_amount: total, commission_percent: resellerId ? product.commission_percent : 0, commission_amount: commission, attribution_code: resellerId ? cookieCode : null, attribution_expires_at: resellerId ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() : null, status: "pending" }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (resellerId) await supabase.from("reseller_commissions").insert({ reseller_id: resellerId, order_id: order.id, amount: commission, status: "pending" });
  return NextResponse.json({ orderId: order.id, total, commission, resellerAttributed: Boolean(resellerId) });
}
