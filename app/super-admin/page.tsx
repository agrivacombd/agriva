import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const modules = [
  { title: "Admin overview", description: "Orders, commissions and operations.", href: "/admin", icon: "📊" },
  { title: "Products", description: "Manage marketplace listings.", href: "/admin/products", icon: "🛒" },
  { title: "Orders", description: "Review and process orders.", href: "/admin/orders", icon: "📦" },
  { title: "Users", description: "Review accounts and roles.", href: "/admin/users", icon: "👥" },
  { title: "Content Studio", description: "Draft and review content.", href: "/admin/content-studio", icon: "✍️" },
  { title: "Articles", description: "Manage editorial content.", href: "/admin/articles", icon: "📰" },
  { title: "Search Intelligence", description: "Review search demand.", href: "/admin/search-intelligence", icon: "🔎" },
  { title: "Harvest", description: "Review harvest marketplace activity.", href: "/admin/harvest", icon: "🌾" },
  { title: "Transport", description: "Manage transport workflows.", href: "/admin/transport", icon: "🚚" },
  { title: "Jobs", description: "Manage agriculture jobs.", href: "/admin/jobs", icon: "💼" },
  { title: "Reports", description: "Review operational reports.", href: "/admin/reports", icon: "📈" },
  { title: "Site settings", description: "Manage site configuration.", href: "/admin/settings", icon: "⚙️" },
  { title: "Audit log", description: "Review administrative activity records.", href: "/admin/audit", icon: "🛡️" },
];

export default async function SuperAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");
  const name = profile.full_name || user.email?.split("@")[0] || "Administrator";

  return <main className="min-h-screen bg-[#f3f7f1] text-[#17351f]">
    <header className="border-b border-black/5 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
      <Link href="/" className="text-2xl font-black">AGRIVA<span className="text-[#b58b28]">.</span></Link>
      <nav className="flex items-center gap-3 text-sm font-semibold"><Link href="/dashboard" className="rounded-xl border border-black/10 px-4 py-2">User dashboard</Link><span className="rounded-xl bg-[#17351f] px-4 py-2 text-white">Super Admin</span></nav>
    </div></header>
    <section className="mx-auto max-w-7xl px-5 py-8 md:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b7922]">Privileged workspace</p>
      <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="text-3xl font-black tracking-tight md:text-5xl">Super Admin Console</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5e7063]">Manage AGRIVA operations, content review and administration in a separate workspace.</p></div><p className="rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-sm">Signed in as <strong>{name}</strong></p></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map((module)=><Link key={module.href} href={module.href} className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-800/20 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="text-2xl">{module.icon}</span><span aria-hidden="true" className="text-[#7b8c7e]">↗</span></div><h2 className="mt-4 text-lg font-bold">{module.title}</h2><p className="mt-2 text-sm leading-6 text-[#657467]">{module.description}</p></Link>)}</div>
      <div className="mt-8 rounded-2xl border border-amber-900/10 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Security reminder:</strong> This page is a navigation hub, not the security boundary. Each admin page, API and Server Action must independently verify administrator access.</div>
    </section>
  </main>;
}
