import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminModuleDirectory, { type AdminModule } from "./AdminModuleDirectory";

const modules: AdminModule[] = [
  { title: "Admin overview", description: "Orders, commissions, payouts and platform metrics.", href: "/admin", icon: "📊", category: "Operations" },
  { title: "Users & roles", description: "Review accounts and manage permitted role changes.", href: "/admin/users", icon: "👥", category: "Operations" },
  { title: "Reports", description: "Review available operational and business reports.", href: "/admin/reports", icon: "📈", category: "Operations" },
  { title: "Audit log", description: "Inspect recorded administrative actions.", href: "/admin/audit", icon: "🛡️", category: "Governance" },
  { title: "Site settings", description: "Manage supported public site configuration.", href: "/admin/settings", icon: "⚙️", category: "Governance" },
  { title: "Products", description: "Manage marketplace product listings.", href: "/admin/products", icon: "🛒", category: "Marketplace" },
  { title: "Categories", description: "Manage product categories and taxonomy.", href: "/admin/categories", icon: "🗂️", category: "Marketplace" },
  { title: "Orders", description: "Review orders and available order actions.", href: "/admin/orders", icon: "📦", category: "Marketplace" },
  { title: "Harvest", description: "Review harvest listings and moderation status.", href: "/admin/harvest", icon: "🌾", category: "Marketplace" },
  { title: "Transport partners", description: "Review partner verification and transport workflows.", href: "/admin/transport", icon: "🚚", category: "Marketplace" },
  { title: "Agriculture jobs", description: "Review and moderate job posts.", href: "/admin/jobs", icon: "💼", category: "Marketplace" },
  { title: "Content Studio", description: "Create and review editorial content.", href: "/admin/content-studio", icon: "✍️", category: "Content & discovery" },
  { title: "Content drafts", description: "Review saved content drafts.", href: "/admin/content-drafts", icon: "📝", category: "Content & discovery" },
  { title: "AI content", description: "Access the existing AI-assisted content workflow.", href: "/admin/ai-content", icon: "✨", category: "Content & discovery" },
  { title: "Articles", description: "Manage published and draft articles.", href: "/admin/articles", icon: "📰", category: "Content & discovery" },
  { title: "Search intelligence", description: "Review search demand and discovery signals.", href: "/admin/search-intelligence", icon: "🔎", category: "Content & discovery" },
  { title: "Opportunities", description: "Review content and marketplace opportunities.", href: "/admin/opportunities", icon: "💡", category: "Content & discovery" },
];

export default async function SuperAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=%2Fsuper-admin");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") redirect("/dashboard");
  const name = profile.full_name || user.email?.split("@")[0] || "Administrator";

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f3f7f1] text-[#17351f]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="AGRIVA home" className="text-2xl font-black tracking-tight">
            AGRIVA<span className="text-[#b58b28]">.</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-black/10 px-3 hover:bg-[#f3f7f1] sm:px-4">
              User dashboard
            </Link>
            <span className="inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-3 text-white sm:px-4">Super Admin</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
        <section className="rounded-3xl bg-[#123b27] p-5 text-white shadow-sm sm:p-7 lg:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#e4c66d]">Privileged workspace</p>
              <h1 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Super Admin Console</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">
                AGRIVA operations, marketplace moderation, content tools and platform governance in one responsive workspace.
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 sm:min-w-64">
              <p className="text-xs font-semibold text-emerald-100">SIGNED IN AS</p>
              <p className="mt-1 break-all font-bold">{name}</p>
              <p className="mt-1 break-all text-sm text-emerald-100/80">{user.email ?? "Authenticated administrator"}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-2xl font-black sm:text-3xl">{modules.length}</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100 sm:text-sm">Admin tools linked</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-2xl font-black sm:text-3xl">4</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100 sm:text-sm">Workspace groups</p>
            </div>
            <Link href="/admin" className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e4c66d] px-4 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-[#f0d887] sm:col-span-1">
              Open admin overview <span aria-hidden="true" className="ml-2">↗</span>
            </Link>
          </div>
        </section>

        <AdminModuleDirectory modules={modules} />

        <aside className="mt-8 rounded-2xl border border-amber-900/10 bg-amber-50 p-4 text-sm leading-6 text-amber-950 sm:p-5">
          <strong>Security note:</strong> This console is a navigation hub, not the security boundary. Every admin page, API route, Server Action and database RPC must independently enforce administrator permissions.
        </aside>
        <footer className="mt-8 border-t border-[#dce7d8] pt-4 text-xs leading-5 text-[#718073]">
          AGRIVA administration · Responsive layout for mobile, tablet and desktop · Access is restricted to verified administrators.
        </footer>
      </div>
    </main>
  );
}
