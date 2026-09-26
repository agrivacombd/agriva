import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ResellerAttribution {
  reseller_id: string | null;
  expires_at: string | null;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const productId = String(body.productId || "");
  const quantity = Math.max(1, Math.floor(Number(body.quantity || 1)));
  const paymentMethod = body.paymentMethod === "online" ? "online" : "cod";
  const shippingAddress = body.shippingAddress && typeof body.shippingAddress === "object" ? body.shippingAddress : {};
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
  if (paymentMethod !== "cod") return NextResponse.json({ error: "Online payment is not enabled yet. Choose Cash on Delivery." }, { status: 400 });

  let resellerId: string | null = null;
  let attributionExpiresAt: string | null = null;
  const cookieCode = request.cookies.get("agriva_reseller")?.value;
  const visitorToken = request.cookies.get("agriva_visitor")?.value;

  if (cookieCode && visitorToken) {
    const { data: rawAttribution, error: attributionError } = await supabase.rpc("resolve_reseller_attribution", {
      p_code: cookieCode,
      p_visitor_token: visitorToken,
      p_product_id: productId,
    }).maybeSingle();

    if (!attributionError && rawAttribution) {
      const attribution: ResellerAttribution = {
        reseller_id: typeof (rawAttribution as Record<string, unknown>).reseller_id === "string"
          ? (rawAttribution as Record<string, unknown>).reseller_id as string
          : null,
        expires_at: typeof (rawAttribution as Record<string, unknown>).expires_at === "string"
          ? (rawAttribution as Record<string, unknown>).expires_at as string
          : null,
      };
      resellerId = attribution.reseller_id;
      attributionExpiresAt = attribution.expires_at;
    }
  }

  const { data: order, error } = await supabase.rpc("finalize_marketplace_cod_order", {
    p_product_id: productId,
    p_quantity: quantity,
    p_shipping_address: shippingAddress,
    p_reseller_id: resellerId,
    p_attribution_code: resellerId ? cookieCode : null,
    p_attribution_expires_at: resellerId ? attributionExpiresAt : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!order) return NextResponse.json({ error: "Order could not be created" }, { status: 400 });

  const rawOrder = order as Record<string, unknown>;

  return NextResponse.json({
    orderId: rawOrder.id,
    total: Number(rawOrder.total_amount),
    commission: Number(rawOrder.commission_amount),
    resellerAttributed: Boolean(rawOrder.reseller_id),
    paymentMethod: "cod",
  });
}
