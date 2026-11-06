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
    <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8">
      <section className="mx-auto max-w-[1500px]">
        <header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white sm:p-8"><div className="relative"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · GROWTH, SEO & ANALYTICS · PROTOTYPE</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">AI Content Intelligence</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">
          Prototype dashboard for search alerts and local draft workflow. Drafts and status changes are not
          persisted to the CMS/database, and publication must be completed through the reviewed publishing workflow.
        </p></div></header>
        <div className="mt-6"><AIContentDashboard /></div>
      </section>
    </main>
  );
}
