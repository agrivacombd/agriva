import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AIContentDashboard from "@/components/admin/AIContentDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AI Content Dashboard | AGRIVA Admin",
  description: "AGRIVA admin prototype for search alerts, content briefs and a manual publishing workflow.",
  robots: { index: false, follow: false },
};

export default async function AIContentDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Admin</p>
        <h1 className="mt-2 text-4xl font-black">AI Content Intelligence</h1>
        <p className="mt-3 max-w-3xl text-[#647468]">
          Prototype dashboard for search alerts and local draft workflow. Drafts and status changes are not
          persisted to the CMS/database, and publication must be completed through the reviewed publishing workflow.
        </p>
        <AIContentDashboard />
      </section>
    </main>
  );
}
