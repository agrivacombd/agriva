import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin/authz";

/**
 * Defense-in-depth guard for every /admin page, including client-rendered pages.
 * API Route Handlers and Server Actions must still authorize independently.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage("dashboard.read");
  return children;
}
