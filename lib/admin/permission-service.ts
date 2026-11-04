import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminCapability } from "@/lib/admin/authz";

export type { AdminCapability };
export type AdminPermissionResult =
  | { allowed: true; userId: string }
  | { allowed: false; reason: "unauthenticated" | "forbidden" | "authorization_unavailable" };

/**
 * Delegated-admin permission check.
 *
 * Capability identifiers come from the shared Admin registry. Compatibility
 * identifiers remain available for existing database grants while the
 * permission data is reconciled. Any RPC error or non-boolean response denies
 * access; this function never falls back to a profile role.
 */
export async function checkAdminPermission(capability: AdminCapability): Promise<AdminPermissionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { allowed: false, reason: "unauthenticated" };

  const { data, error } = await supabase.rpc("has_admin_permission", {
    p_capability: capability,
  });
  if (error || typeof data !== "boolean") {
    return { allowed: false, reason: "authorization_unavailable" };
  }
  return data
    ? { allowed: true, userId: user.id }
    : { allowed: false, reason: "forbidden" };
}
