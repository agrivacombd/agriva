import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCapability =
  | "dashboard.read" | "users.read" | "users.verify" | "roles.grant"
  | "plant_market.moderate" | "marketplace.moderate" | "harvest.moderate"
  | "transport.moderate" | "farms.manage" | "payments.read"
  | "payments.reconcile" | "payouts.approve" | "audit.read"
  | "settings.manage" | "system.recovery";
export type AdminPermissionResult =
  | { allowed: true; userId: string }
  | { allowed: false; reason: "unauthenticated" | "forbidden" | "authorization_unavailable" };

/** New delegated-admin path; intentionally does not inherit legacy profiles.role grants. */
export async function checkAdminPermission(capability: AdminCapability): Promise<AdminPermissionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { allowed: false, reason: "unauthenticated" };
  const { data, error } = await supabase.rpc("has_admin_permission", { p_capability: capability });
  if (error || typeof data !== "boolean") return { allowed: false, reason: "authorization_unavailable" };
  return data ? { allowed: true, userId: user.id } : { allowed: false, reason: "forbidden" };
}
