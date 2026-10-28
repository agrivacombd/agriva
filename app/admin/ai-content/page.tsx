import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AIContentDashboard from "@/components/admin/AIContentDashboard";
import { authorizePermission } from "@/lib/auth/server-authorization";

export const metadata: Metadata = {
  title: "AI Content Dashboard | AGRIVA Admin",
  description: "AGRIVA admin hub for persisted search opportunities and reviewed content draft workflows.",
  robots: { index: false, follow: false },
};

export default async function AIContentDashboardPage() {
  const auth = await authorizePermission("roles.assign_scoped");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login");
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Admin</p>
        <h1 className="mt-2 text-4xl font-black">AI Content Intelligence</h1>
        <p className="mt-3 max-w-3xl text-[#647468]">
          This is a workflow hub, not an AI generation engine. Use the database-backed opportunity and draft tools below; generated content must be reviewed before publication.
        </p>
        <AIContentDashboard />
      </section>
    </main>
  );
}
