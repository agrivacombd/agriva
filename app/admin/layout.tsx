import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Defense-in-depth guard for every /admin page, including client-rendered pages.
 * API Route Handlers and Server Actions must still authorize independently.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") redirect("/dashboard");

  return children;
}
