import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ResellerDashboard from "@/components/dashboard/ResellerDashboard";

export const metadata: Metadata = {
  title: "Reseller Dashboard | AGRIVA",
  description: "Manage referral links and commission tracking from one reseller dashboard.",
  robots: { index: false, follow: false },
};

export default async function ResellerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "reseller") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Reseller</p>
        <h1 className="mt-2 text-4xl font-black">Reseller Dashboard</h1>
        <p className="mt-3 max-w-3xl text-[#647468]">Discover farmer products, create referral links and monitor your eligible commission.</p>
        <ResellerDashboard />
      </section>
    </main>
  );
}
