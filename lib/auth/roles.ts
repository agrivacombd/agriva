export type AgrivaRole = "farmer" | "reseller" | "admin";

export const ROLE_HOME: Record<AgrivaRole, string> = {
  farmer: "/dashboard/farmer",
  reseller: "/dashboard/reseller",
  admin: "/admin",
};

export function isAgrivaRole(value: unknown): value is AgrivaRole {
  return value === "farmer" || value === "reseller" || value === "admin";
}

export function getRoleHome(role: unknown) {
  return isAgrivaRole(role) ? ROLE_HOME[role] : "/auth";
}
