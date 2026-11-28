import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { checkAdminPermission, type AdminCapability } from "@/lib/admin/permission-service";

async function authorizeSellerAccess(capability: Extract<AdminCapability, "seller_access.read">) {
  const delegated = await checkAdminPermission(capability);
  if (delegated.allowed) return { ok: true as const, supabase: delegated.supabase };
  if (delegated.reason === "unauthenticated") return { ok: false as const, response: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (delegated.reason === "authorization_unavailable") return { ok: false as const, response: NextResponse.json({ error: "Authorization could not be verified" }, { status: 503 }) };
  const legacy = await requireAdminApi("catalog.moderate");
  if (legacy.ok) return { ok: true as const, supabase: legacy.supabase };
  return { ok: false as const, response: legacy.response };
}

export async function GET(_request: Request, { params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  const moduleKey = market === "marketplace" ? "marketplace" : market === "plant-market" ? "plant_market" : null;
  if (!moduleKey) return NextResponse.json({ error: "Unknown market." }, { status: 404 });
  const access = await authorizeSellerAccess("seller_access.read");
  if (!access.ok) return access.response;
  const { data, error } = await access.supabase.from("user_module_grants")
    .select("user_id,module,permission,scope_type,scope_id,status,granted_by,granted_at,expires_at,reason")
    .eq("module", moduleKey).eq("permission", "create").eq("status", "active")
    .order("granted_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "Seller permission তালিকা লোড করা যায়নি।" }, { status: 400 });
  return NextResponse.json({ permissions: data || [] });
}
