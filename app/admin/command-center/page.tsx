import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata = {
  title: "Command Center | AGRIVA Admin",
  robots: { index: false, follow: false },
};

type MetricResult = { count: number | null; error: unknown };

function Metric({ label, result, href, detail }: { label: string; result: MetricResult; href: string; detail: string }) {
  const unavailable = Boolean(result.error) || result.count === null;
  return (
    <Link href={href} className="group rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6b9b72] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
      <p className="text-sm font-semibold text-[#68796c]">{label}</p>
      <p className="mt-3 text-3xl font-black tabular-nums tracking-tight text-[#173b2d]">{unavailable ? "—" : new Intl.NumberFormat("en-BD").format(result.count!)}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-[#829084]">{unavailable ? "ডেটা যাচাই প্রয়োজন" : detail}</span>
        <span aria-hidden="true" className="text-sm font-bold text-emerald-800 group-hover:translate-x-0.5">↗</span>
      </div>
    </Link>
  );
}

const sections = [
  { title: "Marketplace operations", description: "পণ্য, অর্ডার ও কৃষকের ফসলের কার্যক্রম", links: [
    ["Products", "/admin/products"], ["Orders", "/admin/orders"], ["Harvest", "/admin/harvest"], ["Plant Market", "/admin/plant-market-products"], ["Green Exchange", "/admin/green-exchange"],
  ]},
  { title: "People & verification", description: "ব্যবহারকারী, পরিচয় যাচাই ও seller onboarding", links: [
    ["Users", "/admin/users"], ["Identity verification", "/admin/identity-verification"], ["Seller applications", "/admin/seller-applications"], ["Transport partners", "/admin/transport"],
  ]},
  { title: "Business & governance", description: "Finance, reports, permissions ও audit trail", links: [
    ["Finance", "/admin/finance"], ["Reports", "/admin/reports"], ["Access control", "/admin/access-control"], ["Audit log", "/admin/audit"], ["Settings", "/admin/settings"],
  ]},
  { title: "Content & acquisition", description: "বিদ্যমান content, SEO ও growth tooling", links: [
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
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#123b2d] px-5 py-7 text-white shadow-sm sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[36px] border-lime-300/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-lime-300/5 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-lime-300">AGRIVA · ADMIN 2.0</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">Business Command Center</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">স্বাগতম, {firstName}। আপনার কৃষি marketplace, team operations এবং platform health-এর গুরুত্বপূর্ণ জায়গাগুলো এক workspace-এ।</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-[#173b2d] transition hover:bg-lime-200">Legacy overview</Link>
            <Link href="/admin/audit" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Review audit log</Link>
          </div>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="overview-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8a968a]">Live platform snapshot</p><h2 id="overview-heading" className="mt-1 text-lg font-black text-[#173b2d]">Business overview</h2></div>
          <p className="text-xs text-[#829084]">সংখ্যাগুলো database count থেকে আসে</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Total users" result={users} href="/admin/users" detail="User directory" />
          <Metric label="Farmers" result={farmers} href="/admin/users?role=farmer" detail="Farmer accounts" />
          <Metric label="Marketplace products" result={products} href="/admin/products" detail="Product catalogue" />
          <Metric label="Marketplace orders" result={orders} href="/admin/orders" detail="Order operations" />
        </div>
        {hasErrors && <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">কিছু metric লোড করা যায়নি। “—” মানে ডেটা অনুপলব্ধ—এটিকে শূন্য হিসেবে গণ্য করবেন না।</p>}
      </section>

      <section className="mt-7" aria-labelledby="queues-heading">
        <div className="mb-3"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8a968a]">Needs attention</p><h2 id="queues-heading" className="mt-1 text-lg font-black text-[#173b2d]">Approval queues</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/admin/identity-verification?status=pending" className="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e9df] bg-white p-5 shadow-sm transition hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
            <div><p className="text-sm font-bold text-[#173b2d]">Identity verification</p><p className="mt-1 text-xs text-[#829084]">Pending identity & module-access reviews</p></div>
            <span className="text-2xl font-black tabular-nums text-[#1e633d]">{pendingIdentity.error || pendingIdentity.count === null ? "—" : pendingIdentity.count}</span>
          </Link>
          <Link href="/admin/seller-applications?status=pending" className="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e9df] bg-white p-5 shadow-sm transition hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
            <div><p className="text-sm font-bold text-[#173b2d]">Seller applications</p><p className="mt-1 text-xs text-[#829084]">Pending seller reviews</p></div>
            <span className="text-2xl font-black tabular-nums text-[#1e633d]">{pendingSeller.error || pendingSeller.count === null ? "—" : pendingSeller.count}</span>
          </Link>
        </div>
        {(pendingIdentity.error || pendingSeller.error) && <p className="mt-2 text-xs text-amber-800">Approval queue count unavailable. Open the queue to inspect its detailed error state.</p>}
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-[#173b2d]">{section.title}</h2>
            <p className="mt-1 text-xs text-[#829084]">{section.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.links.map(([label, href]) => <Link key={href} href={href} className="rounded-xl border border-[#e1e9de] bg-[#f8faf7] px-3 py-2 text-xs font-semibold text-[#315840] transition hover:border-[#78a27b] hover:bg-[#edf5e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{label} <span aria-hidden="true">↗</span></Link>)}
            </div>
          </article>
        ))}
      </section>

      <p className="mt-7 border-t border-[#e2e9df] pt-4 text-xs leading-5 text-[#829084]">Read-only overview · High-risk changes remain inside their existing permission-checked workflows · Signed in as {user.email ?? "administrator"}</p>
    </main>
  );
}
