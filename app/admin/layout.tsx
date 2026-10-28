import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

/**
 * Defense-in-depth guard for every /admin page, including client-rendered pages.
 * API Route Handlers and Server Actions must still authorize independently.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await authorizePermission("roles.assign_scoped");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login");
    redirect("/dashboard");
  }

  return children;
}
