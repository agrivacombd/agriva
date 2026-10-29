import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHasAdminCapability, type AdminCapability } from "@/lib/admin/capabilities";

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type AdminAuthorization =
  | { ok: true; supabase: ServerSupabaseClient; user: User }
  | { ok: false; status: 401 | 403 };

/**
 * Shared, fail-closed authorization boundary for admin pages and API handlers.
 * UI visibility is not authorization: each Route Handler / Server Action must
 * call this helper independently, and database RPC/RLS checks remain required.
 */
export async function requireAdminCapability(
  capability: AdminCapability,
): Promise<AdminAuthorization> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, status: 401 };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !roleHasAdminCapability(profile.role, capability)) {
    return { ok: false, status: 403 };
  }

  return { ok: true, supabase, user };
}
