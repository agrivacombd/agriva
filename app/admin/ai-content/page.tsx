import type { Metadata } from "next";
import AIContentDashboard from "@/components/admin/AIContentDashboard";

export const metadata: Metadata = {
  title: "AI Content Dashboard | AGRIVA Admin",
  description: "AGRIVA admin dashboard for search alerts, SEO article briefs, drafts and manual publishing workflow.",
  robots: { index: false, follow: false },
};

export default function AIContentDashboardPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-7xl px-6 py-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Admin</p><h1 className="mt-2 text-4xl font-black">AI Content Intelligence</h1><p className="mt-3 max-w-3xl text-[#647468]">Monitor search opportunities, review AI-generated content briefs and move articles through a human-reviewed draft workflow.</p><AIContentDashboard /></section></main>;
}
