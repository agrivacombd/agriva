import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission, type AgrivaPermission } from "@/lib/auth/permissions";

export async function authorizePermission(permission: AgrivaPermission) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, status: 401 as const, error: "Login required" };

  const [{ data: profile, error: profileError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("user_role_memberships").select("role").eq("user_id", user.id),
  ]);
  // Fail closed: a failed authorization lookup must never grant access.
  if (profileError || membershipsError) {
    return { ok: false as const, status: 503 as const, error: "Unable to verify permissions" };
  }

  const roles = [
    ...(memberships ?? []).map((membership) => membership.role),
    ...(profile?.role ? [profile.role] : []),
  ];
  if (!hasPermission(roles, permission)) {
    return { ok: false as const, status: 403 as const, error: "Permission denied" };
  }
  return { ok: true as const, supabase, user, roles };
}
