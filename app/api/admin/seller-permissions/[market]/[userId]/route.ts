import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { checkAdminPermission, type AdminCapability } from "@/lib/admin/permission-service";

type Params = { params: Promise<{ market: string; userId: string }> };

async function authorizeSellerAccess(capability: Extract<AdminCapability, "seller_access.revoke">) {
  const delegated = await checkAdminPermission(capability);
  if (delegated.allowed) return { ok: true as const, supabase: delegated.supabase };
  if (delegated.reason === "unauthenticated") return { ok: false as const, response: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (delegated.reason === "authorization_unavailable") return { ok: false as const, response: NextResponse.json({ error: "Authorization could not be verified" }, { status: 503 }) };
  const legacy = await requireAdminApi("catalog.moderate");
  if (legacy.ok) return { ok: true as const, supabase: legacy.supabase };
  return { ok: false as const, response: legacy.response };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { market, userId } = await params;
  const moduleKey = market === "marketplace" ? "marketplace" : market === "plant-market" ? "plant_market" : null;
  if (!moduleKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json({ error: "Unknown market or seller." }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10 || reason.length > 500) {
    return NextResponse.json({ error: "Permission বাতিলের কারণ ১০ থেকে ৫০০ অক্ষরের মধ্যে লিখুন।" }, { status: 400 });
  }
  const scopeId = moduleKey === "marketplace" ? String(body?.scope_id || "") : null;
  if (moduleKey === "marketplace" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scopeId || "")) {
    return NextResponse.json({ error: "Marketplace organization scope is required." }, { status: 400 });
  }
  const access = await authorizeSellerAccess("seller_access.revoke");
  if (!access.ok) return access.response;
  const { data, error } = await access.supabase.rpc("admin_revoke_market_access", {
    p_user_id: userId, p_module: moduleKey, p_scope_id: scopeId, p_reason: reason,
  });
  if (error?.code === "P0002") return NextResponse.json({ error: "এই scope-এ কোনো active permission পাওয়া যায়নি।" }, { status: 404 });
  if (error) return NextResponse.json({ error: "Permission বাতিল করা যায়নি। Admin access ও module migration যাচাই করুন।" }, { status: 400 });
  if (!Number.isInteger(data) || data < 1) return NextResponse.json({ error: "এই scope-এ কোনো active permission পাওয়া যায়নি।" }, { status: 404 });
  return NextResponse.json({ revoked: data, module: moduleKey });
}
