/**
 * Capability catalogue for AGRIVA's multi-role architecture.
 *
 * This module is deliberately pure: it is safe to use for navigation hints and
 * server-side policy composition. It is NOT a replacement for authorization
 * in Route Handlers, Server Actions, RPCs, RLS, or Storage policies.
 */
export type AgrivaPermission =
  | "dashboard.read_own"
  | "profile.read_own"
  | "profile.update_own"
  | "catalog.read_public"
  | "catalog.create_own"
  | "catalog.create_platform"
  | "catalog.update_own"
  | "catalog.submit_for_review"
  | "catalog.moderate"
  | "catalog.publish"
  | "catalog.pause"
  | "orders.read_own"
  | "orders.create_own"
  | "orders.fulfill_own"
  | "orders.support_read"
  | "users.support_read_minimal"
  | "users.manage"
  | "content.draft"
  | "content.review"
  | "content.publish"
  | "marketing.manage_campaigns"
  | "analytics.read_aggregated"
  | "finance.read_scoped"
  | "payout.request_own"
  | "reseller.links.create_own"
  | "jobs.create_own"
  | "jobs.apply_own"
  | "payout.review"
  | "payout.approve"
  | "settings.integrations.manage"
  | "settings.secrets.rotate"
  | "roles.assign_scoped"
  | "roles.assign_super_admin"
  | "audit.read"
  | "transport.review"
  | "content.opportunities.read";

export type AgrivaKnownRole =
  | "super_admin"
  | "admin"
  | "operations"
  | "product_moderator"
  | "content_seo_manager"
  | "marketing_manager"
  | "finance_manager"
  | "support_agent"
  | "seller"
  | "farmer"
  | "buyer"
  | "reseller"
  | "transport"
  | "transport_provider"
  | "job_seeker"
  | "worker"
  | "employer"
  | "student"
  | "educator"
  | "expert"
  | "agriculturist"
  | "agronomist"
  | "rooftop_gardener"
  | "organization";

const ownAccount: AgrivaPermission[] = [
  "dashboard.read_own",
  "profile.read_own",
  "profile.update_own",
  "catalog.read_public",
];

const sellerCatalog: AgrivaPermission[] = [
  ...ownAccount,
  "catalog.create_own",
  "catalog.update_own",
  "catalog.submit_for_review",
  "orders.read_own",
  "orders.fulfill_own",
  "payout.request_own",
  "finance.read_scoped",
];

const rolePermissions: Record<AgrivaKnownRole, readonly AgrivaPermission[]> = {
  super_admin: [
    "dashboard.read_own", "profile.read_own", "profile.update_own",
    "catalog.read_public", "catalog.create_own", "catalog.create_platform", "catalog.update_own",
    "catalog.submit_for_review", "catalog.moderate", "catalog.publish", "catalog.pause",
    "orders.read_own", "orders.fulfill_own", "orders.support_read",
    "users.support_read_minimal", "users.manage", "content.draft", "content.review",
    "content.publish", "marketing.manage_campaigns", "analytics.read_aggregated",
    "finance.read_scoped", "payout.request_own", "payout.review", "payout.approve",
    "settings.integrations.manage", "settings.secrets.rotate", "roles.assign_scoped",
    "roles.assign_super_admin", "audit.read", "transport.review", "content.opportunities.read",
  ],
  admin: [
    ...ownAccount, "catalog.create_platform", "catalog.moderate", "catalog.publish", "catalog.pause",
    "orders.support_read", "users.support_read_minimal", "users.manage",
    "content.draft", "content.review", "content.publish", "analytics.read_aggregated",
    "finance.read_scoped", "payout.review", "roles.assign_scoped", "audit.read", "transport.review", "content.opportunities.read",
  ],
  operations: [
    ...ownAccount, "catalog.moderate", "catalog.pause", "orders.support_read",
    "users.support_read_minimal", "analytics.read_aggregated",
  ],
  product_moderator: [...ownAccount, "catalog.moderate", "catalog.publish", "catalog.pause"],
  content_seo_manager: [...ownAccount, "content.draft", "content.review", "content.publish", "analytics.read_aggregated"],
  marketing_manager: [...ownAccount, "marketing.manage_campaigns", "analytics.read_aggregated", "content.draft"],
  finance_manager: [...ownAccount, "finance.read_scoped", "payout.review", "payout.approve", "orders.support_read"],
  support_agent: [...ownAccount, "orders.support_read", "users.support_read_minimal"],
  seller: sellerCatalog,
  farmer: [...sellerCatalog],
  buyer: [...ownAccount, "orders.read_own", "orders.create_own"],
  reseller: [...ownAccount, "orders.read_own", "finance.read_scoped", "payout.request_own", "reseller.links.create_own"],
  transport: [...ownAccount, "orders.read_own", "orders.fulfill_own"],
  transport_provider: [...ownAccount, "orders.read_own", "orders.fulfill_own"],
  job_seeker: [...ownAccount, "jobs.apply_own"],
  worker: [...ownAccount, "jobs.apply_own"],
  employer: [...ownAccount, "jobs.create_own"],
  student: ownAccount,
  educator: [...ownAccount, "content.draft"],
  expert: [...ownAccount, "content.draft"],
  agriculturist: [...ownAccount, "content.draft"],
  agronomist: [...ownAccount, "content.draft"],
  rooftop_gardener: [...ownAccount],
  organization: [...ownAccount, "catalog.create_own", "catalog.update_own", "catalog.submit_for_review"],
};

export function isAgrivaKnownRole(value: unknown): value is AgrivaKnownRole {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(rolePermissions, value);
}

/** Return the union of capabilities for validated roles; unknown values grant nothing. */
export function getPermissionsForRoles(roles: readonly unknown[]): ReadonlySet<AgrivaPermission> {
  const permissions = new Set<AgrivaPermission>();
  for (const role of roles) {
    if (!isAgrivaKnownRole(role)) continue;
    for (const permission of rolePermissions[role]) permissions.add(permission);
  }
  return permissions;
}

export function hasPermission(
  roles: readonly unknown[],
  permission: AgrivaPermission,
): boolean {
  return getPermissionsForRoles(roles).has(permission);
}
