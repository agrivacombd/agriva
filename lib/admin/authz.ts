import "server-only";

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Capability names are deliberately explicit even while the legacy admin role
 * remains the only principal granted the existing console capabilities.
 * High-risk capabilities stay denied until a reviewed grant + step-up flow exists.
 */
export const ADMIN_CAPABILITIES = [
  "dashboard.read",
  "catalog.read",
  "catalog.create",
  "catalog.edit",
  "catalog.moderate",
  "harvest.read",
  "harvest.moderate",
  "jobs.read",
  "jobs.moderate",
  "orders.read",
  "orders.transition",
  "users.read",
  "identity.review",
  "users.suspend",
  "roles.read",
  "roles.grant",
  "content.read",
  "content.edit",
  "content.publish",
  "settings.read",
  "settings.write",
  "audit.read",
  "audit.export",
  "reports.export",
  "transport.read",
  "transport.moderate",
  "system.health.read",
  "payments.read",
  "payments.reconcile",
  "orders.refund.request",
  "payouts.read",
  "payouts.approve",
  "system.recovery.execute",

  // Compatibility identifiers still used by the delegated-permission RPC.
  // Keep them in this registry so every authorization layer shares one type.
  // They are intentionally NOT added to LEGACY_ADMIN_CAPABILITIES.
  "users.verify",
  "plant_market.moderate",
  "marketplace.moderate",
  "farms.manage",
  "settings.manage",
  "system.recovery",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

/**
 * Historical database permission keys mapped to their canonical Admin
 * capability. Only semantically equivalent identifiers are bridged.
 */
export const ADMIN_CAPABILITY_ALIASES: Partial<Record<AdminCapability, readonly string[]>> = {
  "identity.review": ["users.verify"],
  "catalog.moderate": ["marketplace.moderate", "plant_market.moderate"],
  "settings.write": ["settings.manage"],
  "system.recovery.execute": ["system.recovery"],
};

type AdminProfile = {
  role: string;
  full_name: string | null;
};

type Allowed = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  profile: AdminProfile;
};

type Denied = {
  ok: false;
  reason: "unauthenticated" | "forbidden" | "authorization_unavailable";
};

export type CapabilityResult = Allowed | Denied;

// Preserve the existing authorization boundary while migrating incrementally.
// These are only capabilities currently supported by the legacy admin console.
// Money movement, refunds, payout approval, and system recovery are deny-by-default.
const LEGACY_ADMIN_CAPABILITIES = new Set<AdminCapability>([
  "dashboard.read",
  "catalog.read",
  "catalog.create",
  "catalog.edit",
  "catalog.moderate",
  "harvest.read",
  "harvest.moderate",
  "jobs.read",
  "jobs.moderate",
  "orders.read",
  "orders.transition",
  "users.read",
  "identity.review",
  "users.suspend",
  "roles.read",
  "roles.grant",
  "content.read",
  "content.edit",
  "content.publish",
  "settings.read",
  "settings.write",
  "audit.read",
  "audit.export",
  "reports.export",
  "transport.read",
  "transport.moderate",
  "system.health.read",
]);

/** Check a delegated role grant, including explicitly registered legacy DB keys. */
async function hasDelegatedCapability(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  capability: AdminCapability,
): Promise<boolean | null> {
  const candidates = [capability, ...(ADMIN_CAPABILITY_ALIASES[capability] ?? [])];
  for (const candidate of candidates) {
    const { data, error } = await supabase.rpc("has_admin_permission", {
      p_capability: candidate,
    });
    if (error || typeof data !== "boolean") return null;
    if (data) return true;
  }
  return false;
}

/** Resolve legacy Admin and delegated role grants through the same capability registry. */
export async function getAvailableAdminCapabilities(
  requested: readonly AdminCapability[],
): Promise<AdminCapability[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) return [];

  const results = await Promise.all(requested.map(async (capability) => {
    if (profile.role === "admin" && LEGACY_ADMIN_CAPABILITIES.has(capability)) {
      return capability;
    }
    const granted = await hasDelegatedCapability(supabase, capability);
    return granted === true ? capability : null;
  }));
  return results.filter((capability): capability is AdminCapability => capability !== null);
}

export async function requireCapability(capability: AdminCapability): Promise<CapabilityResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, reason: "unauthenticated" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return { ok: false, reason: "authorization_unavailable" };
  if (!profile) return { ok: false, reason: "forbidden" };

  const legacyAdminAllowed = profile.role === "admin" && LEGACY_ADMIN_CAPABILITIES.has(capability);
  if (!legacyAdminAllowed) {
    const delegatedAllowed = await hasDelegatedCapability(supabase, capability);
    if (delegatedAllowed === null) return { ok: false, reason: "authorization_unavailable" };
    if (!delegatedAllowed) return { ok: false, reason: "forbidden" };
  }

  return {
    ok: true,
    supabase,
    user,
    profile: { role: profile.role, full_name: profile.full_name ?? null },
  };
}

export async function requireAdminPage(
  capability: AdminCapability,
  loginPath = "/login",
  forbiddenPath = "/dashboard",
) {
  const access = await requireCapability(capability);
  if (!access.ok) {
    if (access.reason === "unauthenticated") redirect(loginPath);
    redirect(forbiddenPath);
  }
  return access;
}

export async function requireAdminApi(capability: AdminCapability) {
  const access = await requireCapability(capability);
  if (access.ok) return access;

  if (access.reason === "unauthenticated") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Login required" }, { status: 401 }),
    };
  }
  if (access.reason === "authorization_unavailable") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Authorization could not be verified" }, { status: 503 }),
    };
  }
  return {
    ok: false as const,
    response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
  };
}
