import type { AgrivaPermission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PermissionCheck =
  | { allowed: true; userId: string; roles: string[] }
  | { allowed: false; status: 401 | 403 | 500; error: string };

/**
 * Resolve role grants from database-backed profile/membership rows.
 * Any auth or role lookup failure denies access. This helper is for server
 * handlers/actions; database RLS and RPC checks remain mandatory.
 */
export async function checkCurrentUserPermission(
  permission: AgrivaPermission,
): Promise<PermissionCheck> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { allowed: false, status: 401, error: "Login required" };
  }

  const [{ data: profile, error: profileError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("user_role_memberships").select("role").eq("user_id", user.id),
    ]);

  if (profileError || membershipsError) {
    return { allowed: false, status: 500, error: "Unable to verify permissions" };
  }

  const roles = new Set<string>();
  if (typeof profile?.role === "string") roles.add(profile.role);
  for (const membership of memberships ?? []) {
    if (typeof membership.role === "string") roles.add(membership.role);
  }

  if (!hasPermission([...roles], permission)) {
    return { allowed: false, status: 403, error: "Insufficient permissions" };
  }

  return { allowed: true, userId: user.id, roles: [...roles] };
}
