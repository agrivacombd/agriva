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
  "harvest.moderate",
  "orders.read",
  "orders.transition",
  "users.read",
  "users.suspend",
  "roles.read",
  "roles.grant",
  "content.edit",
  "content.publish",
  "settings.read",
  "settings.write",
  "audit.read",
  "audit.export",
  "system.health.read",
  "payments.read",
  "payments.reconcile",
  "orders.refund.request",
  "payouts.read",
  "payouts.approve",
  "system.recovery.execute",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

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
  "harvest.moderate",
  "orders.read",
  "orders.transition",
  "users.read",
  "users.suspend",
  "roles.read",
  "roles.grant",
  "content.edit",
  "content.publish",
  "settings.read",
  "settings.write",
  "audit.read",
  "audit.export",
  "system.health.read",
]);

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
  if (profile?.role !== "admin" || !LEGACY_ADMIN_CAPABILITIES.has(capability)) {
    return { ok: false, reason: "forbidden" };
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
