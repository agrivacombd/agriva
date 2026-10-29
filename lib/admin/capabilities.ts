/**
 * Initial capability registry for the existing admin console.
 *
 * Production currently has one internal profile role ("admin"); public roles in
 * user_role_memberships are not staff grants. Keep the legacy admin mapping
 * until a separately reviewed staff-membership/capability schema is released.
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
  "roles.read",
  "roles.grant",
  "content.edit",
  "content.publish",
  "settings.read",
  "settings.write",
  "audit.read",
  "audit.export",
  "system.health.read",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

const LEGACY_ROLE_CAPABILITIES: Readonly<Record<string, readonly AdminCapability[]>> = {
  // Compatibility bridge: retain existing admin behavior while moving checks
  // behind named capabilities. Do not add staff roles here until DB grants exist.
  admin: ADMIN_CAPABILITIES,
};

export function roleHasAdminCapability(
  role: string | null | undefined,
  capability: AdminCapability,
): boolean {
  if (!role) return false;
  return LEGACY_ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}
