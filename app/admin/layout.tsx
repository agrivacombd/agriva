import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin/authz";
import AdminShell from "@/components/admin/shell/AdminShell";

/**
 * Shared authenticated admin application shell.
 *
 * Keep the server-side authorization boundary here. API Route Handlers and
 * Server Actions must continue to authorize independently; navigation
 * visibility is not an authorization mechanism.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdminPage("dashboard.read");
  const adminName = profile.full_name || user.email?.split("@")[0] || "Administrator";

  return <AdminShell adminName={adminName}>{children}</AdminShell>;
}
