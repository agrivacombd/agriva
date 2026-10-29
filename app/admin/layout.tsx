import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminCapability } from "@/lib/admin/authz";

/**
 * Defense-in-depth navigation guard. Every Route Handler and Server Action
 * must still authorize independently; database RPC/RLS checks remain required.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authorization = await requireAdminCapability("dashboard.read");

  if (!authorization.ok) {
    if (authorization.status === 401) redirect("/login");
    redirect("/dashboard");
  }

  return children;
}
