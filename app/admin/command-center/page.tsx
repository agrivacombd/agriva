import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Package, ShieldCheck, ShoppingCart, Sprout, TrendingUp, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata = {
  title: "Command Center | AGRIVA Admin",
  robots: { index: false, follow: false },
};

type MetricResult = { count: number | null; error: unknown };

function Metric({ label, result, href, detail, icon: Icon }: { label: string; result: MetricResult; href: string; detail: string; icon: typeof Users }) {
  const unavailable = Boolean(result.error) || result.count === null;
  return (
    <Link href={href} className="group relative overflow-hidden rounded-2xl border border-[#e3ebe0] bg-white p-4 shadow-[0_2px_12px_rgba(23,59,45,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9ab99a] hover:shadow-[0_12px_28px_rgba(23,59,45,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eff6ec] text-[#287047] transition group-hover:bg-[#e2f1dc]"><Icon size={19} aria-hidden="true" /></div>
        <ArrowUpRight size={16} className="text-[#a0afa0] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#287047]" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xs font-bold text-[#718174] sm:text-sm">{label}</p>
      <p className="mt-1 text-[27px] font-black tracking-tight tabular-nums text-[#173b2d] sm:text-3xl">{unavailable ? "—" : new Intl.NumberFormat("en-BD").format(result.count!)}</p>
      <p className="mt-2 text-[11px] leading-5 text-[#91a094]">{unavailable ? "ডেটা যাচাই প্রয়োজন" : detail}</p>
    </Link>
  );
}

const sections = [
  { title: "Marketplace operations", description: "পণ্য, অর্ডার ও কৃষকের ফসলের কার্যক্রম", icon: ShoppingCart, links: [
    ["Products", "/admin/products"], ["Orders", "/admin/orders"], ["Harvest", "/admin/harvest"], ["Plant Market", "/admin/plant-market-products"], ["Green Exchange", "/admin/green-exchange"],
  ]},
  { title: "People & verification", description: "ব্যবহারকারী, পরিচয় যাচাই ও seller onboarding", icon: Users, links: [
    ["Users", "/admin/users"], ["Identity verification", "/admin/identity-verification"], ["Seller applications", "/admin/seller-applications"], ["Transport partners", "/admin/transport"],
  ]},
  { title: "Business & governance", description: "Finance, reports, permissions ও audit trail", icon: ShieldCheck, links: [
    ["Finance", "/admin/finance"], ["Reports", "/admin/reports"], ["Access control", "/admin/access-control"], ["Audit log", "/admin/audit"], ["Settings", "/admin/settings"],
  ]},
  { title: "Content & acquisition", description: "বিদ্যমান content, SEO ও growth tooling", icon: TrendingUp, links: [
    ["Content Studio", "/admin/content-studio"], ["Articles", "/admin/articles"], ["Content drafts", "/admin/content-drafts"], ["SEO dashboard", "/admin/seo"], ["Search intelligence", "/admin/search-intelligence"], ["Growth opportunities", "/admin/opportunities"],
  ]},
] as const;

export default async function AdminCommandCenterPage() {
  const { supabase, user } = await requireAdminPage("dashboard.read");
  const [users, farmers, products, orders, pendingIdentity, pendingSeller] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "farmer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("marketplace_orders").select("id", { count: "exact", head: true }),
    supabase.from("module_access_applications").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
    supabase.from("module_access_applications").select("id", { count: "exact", head: true }).eq("module", "marketplace").in("status", ["pending", "under_review"]),
  ]);

  const metricResults = [users, farmers, products, orders, pendingIdentity, pendingSeller];
  const hasErrors = metricResults.some((item) => Boolean(item.error));
  const firstName = user.email?.split("@")[0] ?? "Admin";

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-br from-[#153f30] via-[#123b2d] to-[#0b2b20] px-5 py-7 text-white shadow-[0_18px_45px_rgba(18,59,45,0.13)] sm:rounded-[30px] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border-[42px] border-lime-300/[0.08]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-[28%] h-64 w-64 rounded-full bg-lime-300/[0.06] blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-lime-200/30 to-transparent" />
        <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-100/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-lime-200">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_0_4px_rgba(190,242,100,0.10)]" />
              AGRIVA · ADMIN 2.0
            </div>
            <h1 className="mt-4 text-[27px] font-black leading-tight tracking-tight sm:text-4xl">Business Command Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-[15px]">স্বাগতম, {firstName}। আপনার কৃষি marketplace, team operations এবং platform health-এর গুরুত্বপূর্ণ জায়গাগুলো এক workspace-এ।</p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            <Link href="/admin/audit" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-xs font-bold text-white transition hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"><ClipboardCheck size={15}/> Audit log</Link>
            <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 text-xs font-extrabold text-[#173b2d] shadow-sm transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Legacy overview <ArrowUpRight size={15}/></Link>
          </div>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="overview-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#91a094]">Live platform snapshot</p><h2 id="overview-heading" className="mt-1 text-xl font-black tracking-tight text-[#173b2d]">Business overview</h2></div>
          <p className="text-[11px] text-[#91a094]">সংখ্যাগুলো database count থেকে আসে</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Metric label="Total users" result={users} href="/admin/users" detail="User directory" icon={Users} />
          <Metric label="Farmers" result={farmers} href="/admin/users?role=farmer" detail="Farmer accounts" icon={Sprout} />
          <Metric label="Marketplace products" result={products} href="/admin/products" detail="Product catalogue" icon={Package} />
          <Metric label="Marketplace orders" result={orders} href="/admin/orders" detail="Order operations" icon={ShoppingCart} />
        </div>
        {hasErrors && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">কিছু metric লোড করা যায়নি। “—” মানে ডেটা অনুপলব্ধ—এটিকে শূন্য হিসেবে গণ্য করবেন না।</p>}
      </section>

      <section className="mt-8" aria-labelledby="queues-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#91a094]">Needs attention</p><h2 id="queues-heading" className="mt-1 text-xl font-black tracking-tight text-[#173b2d]">Approval queues</h2></div>
          <span className="rounded-full border border-[#e3ebe0] bg-white px-3 py-1 text-[10px] font-bold text-[#728274]">Review workspace</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/admin/identity-verification?status=pending" className="group flex items-center justify-between gap-4 rounded-2xl border border-[#e3ebe0] bg-white p-4 shadow-[0_2px_12px_rgba(23,59,45,0.03)] transition hover:border-[#9ab99a] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eff6ec] text-[#287047]"><ShieldCheck size={18}/></span><div className="min-w-0"><p className="text-sm font-extrabold text-[#173b2d]">Identity verification</p><p className="mt-1 text-xs text-[#91a094]">Pending identity & module-access reviews</p></div></div>
            <span className="text-2xl font-black tabular-nums text-[#1e633d]">{pendingIdentity.error || pendingIdentity.count === null ? "—" : pendingIdentity.count}</span>
          </Link>
          <Link href="/admin/seller-applications?status=pending" className="group flex items-center justify-between gap-4 rounded-2xl border border-[#e3ebe0] bg-white p-4 shadow-[0_2px_12px_rgba(23,59,45,0.03)] transition hover:border-[#9ab99a] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f2f5e8] text-[#667d2b]"><ClipboardCheck size={18}/></span><div className="min-w-0"><p className="text-sm font-extrabold text-[#173b2d]">Seller applications</p><p className="mt-1 text-xs text-[#91a094]">Pending seller reviews</p></div></div>
            <span className="text-2xl font-black tabular-nums text-[#1e633d]">{pendingSeller.error || pendingSeller.count === null ? "—" : pendingSeller.count}</span>
          </Link>
        </div>
        {(pendingIdentity.error || pendingSeller.error) && <p className="mt-2 text-xs text-amber-800">Approval queue count unavailable. Open the queue to inspect its detailed error state.</p>}
      </section>

      <section className="mt-8" aria-labelledby="directory-heading">
        <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#91a094]">Workspace shortcuts</p><h2 id="directory-heading" className="mt-1 text-xl font-black tracking-tight text-[#173b2d]">Explore your workspace</h2></div>
        <div className="grid gap-3 xl:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return <article key={section.title} className="rounded-2xl border border-[#e3ebe0] bg-white p-4 shadow-[0_2px_12px_rgba(23,59,45,0.03)] transition hover:shadow-md sm:p-5">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eff6ec] text-[#287047]"><Icon size={18}/></span><div><h3 className="text-sm font-extrabold text-[#173b2d]">{section.title}</h3><p className="mt-1 text-xs text-[#91a094]">{section.description}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {section.links.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e5ece2] bg-[#f8faf7] px-3 text-[11px] font-bold text-[#315840] transition hover:border-[#9ab99a] hover:bg-[#edf5e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{label}<ArrowUpRight size={12}/></Link>)}
              </div>
            </article>;
          })}
        </div>
      </section>

      <p className="mt-8 border-t border-[#e2e9df] pt-4 text-[11px] leading-5 text-[#91a094]">Read-only overview · High-risk changes remain inside their existing permission-checked workflows · Signed in as {user.email ?? "administrator"}</p>
    </main>
  );
}
