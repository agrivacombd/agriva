import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AgrivaModule = "plant_market" | "marketplace" | "employer" | "transport" | "sell_harvest" | "buyer_demands" | "farm_management";
export type ModulePermission = "read" | "create" | "update" | "delete" | "moderate" | "manage_members" | "manage_orders" | "manage_inventory";
export type ModuleScope = { type: "global"; id?: null } | { type: "organization" | "farm"; id: string };
export type ModuleAccessResult =
  | { allowed: true; userId: string }
  | { allowed: false; reason: "unauthenticated" | "forbidden" | "authorization_unavailable" };

/** Server-side check. The database binds the principal using auth.uid(); callers cannot nominate a user ID. */
export async function checkModuleAccess(module: AgrivaModule, permission: ModulePermission, scope: ModuleScope = { type: "global" }): Promise<ModuleAccessResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { allowed: false, reason: "unauthenticated" };
  const { data, error } = await supabase.rpc("has_module_access", {
    p_module: module,
    p_permission: permission,
    p_scope_type: scope.type,
    p_scope_id: scope.type === "global" ? null : scope.id,
  });
  if (error || typeof data !== "boolean") return { allowed: false, reason: "authorization_unavailable" };
  return data ? { allowed: true, userId: user.id } : { allowed: false, reason: "forbidden" };
}

export async function requireModuleAccess(module: AgrivaModule, permission: ModulePermission, scope: ModuleScope = { type: "global" }) {
  const result = await checkModuleAccess(module, permission, scope);
  if (!result.allowed) return { ok: false as const, status: result.reason === "unauthenticated" ? 401 : result.reason === "forbidden" ? 403 : 503, error: result.reason };
  return { ok: true as const, userId: result.userId };
}

/** Find an organization for which this authenticated user has the requested Marketplace grant. */
export async function findMarketplaceOrganizationWithAccess(permission: Extract<ModulePermission,"read"|"create"|"update"|"delete">) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { allowed: false as const, reason: "unauthenticated" as const };
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "verified")
    .limit(20);
  if (error) return { allowed: false as const, reason: "authorization_unavailable" as const };
  if (!organizations?.length) return { allowed: false as const, reason: "forbidden" as const };
  let unavailable = false;
  for (const organization of organizations) {
    const access = await checkModuleAccess("marketplace", permission, { type: "organization", id: organization.id });
    if (access.allowed) return { allowed: true as const, userId: user.id, organizationId: organization.id };
    if (access.reason === "authorization_unavailable") unavailable = true;
  }
  return { allowed: false as const, reason: unavailable ? "authorization_unavailable" as const : "forbidden" as const };
}


/** Return only verified organizations with an explicit Marketplace create grant. */
export async function listMarketplaceOrganizationsWithCreateAccess() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { allowed: false as const, reason: "unauthenticated" as const };
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("id,name")
    .eq("owner_id", user.id)
    .eq("status", "verified")
    .order("name", { ascending: true })
    .limit(20);
  if (error) return { allowed: false as const, reason: "authorization_unavailable" as const };
  const eligible = [];
  let unavailable = false;
  for (const organization of organizations ?? []) {
    const access = await checkModuleAccess("marketplace", "create", { type: "organization", id: organization.id });
    if (access.allowed) eligible.push(organization);
    else if (access.reason === "authorization_unavailable") unavailable = true;
  }
  if (unavailable && eligible.length === 0) return { allowed: false as const, reason: "authorization_unavailable" as const };
  return { allowed: true as const, organizations: eligible };
}

/** Validate a caller-selected organization against ownership, verification and scoped grant. */
export async function checkMarketplaceOrganizationCreateAccess(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { allowed: false as const, reason: "unauthenticated" as const };
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .eq("owner_id", user.id)
    .eq("status", "verified")
    .maybeSingle();
  if (error) return { allowed: false as const, reason: "authorization_unavailable" as const };
  if (!organization) return { allowed: false as const, reason: "forbidden" as const };
  const access = await checkModuleAccess("marketplace", "create", { type: "organization", id: organization.id });
  return access.allowed
    ? { allowed: true as const, userId: user.id, organizationId: organization.id }
    : { allowed: false as const, reason: access.reason };
}
