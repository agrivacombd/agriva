import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata = {
  title: "Marketplace | AGRIVA Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMarketplacePage() {
  const { supabase } = await requireAdminPage("catalog.read");
  const [all, active, drafts, paused, soldOut] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "paused"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "sold_out"),
  ]);
  const failed = [all, active, drafts, paused, soldOut].some((result) => Boolean(result.error));
  const metrics = [
    { label: "মোট পণ্য", value: all.error ? "—" : all.count ?? 0, hint: "Catalogue size" },
    { label: "সক্রিয়", value: active.error ? "—" : active.count ?? 0, hint: "Visible listings" },
    { label: "Draft", value: drafts.error ? "—" : drafts.count ?? 0, hint: "Not published" },
    { label: "Paused", value: paused.error ? "—" : paused.count ?? 0, hint: "Temporarily hidden" },
    { label: "Stock শেষ", value: soldOut.error ? "—" : soldOut.count ?? 0, hint: "Sold out" },
  ];

  const modules = [
    { href: "/admin/products", eyebrow: "CATALOGUE", title: "পণ্য ও Catalogue", description: "পণ্যের তথ্য, মূল্য, stock, commission, taxonomy এবং publication status সম্পাদনা করুন।", action: "পণ্য ব্যবস্থাপনা খুলুন", tone: "primary" },
    { href: "/admin/seller-applications", eyebrow: "SELLER OPERATIONS", title: "Seller Applications", description: "নতুন seller onboarding ও verification submission পর্যালোচনা করুন।", action: "Applications দেখুন", tone: "soft" },
    { href: "/admin/categories", eyebrow: "TAXONOMY", title: "Categories", description: "Marketplace-এর category tree ও product classification পরিচালনা করুন।", action: "Category পরিচালনা", tone: "soft" },
    { href: "/admin/search-intelligence", eyebrow: "PRODUCT DISCOVERY", title: "Product SEO & Search", description: "Search demand, product discovery এবং SEO opportunity এক জায়গায় দেখুন।", action: "Search Intelligence খুলুন", tone: "soft" },
  ];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[32px] border-white/5" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · COMMERCE OPERATIONS</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Marketplace</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">Product catalogue, seller onboarding, taxonomy ও product discovery—একটি নির্দিষ্ট operational workspace থেকে পরিচালনা করুন। Plant Market-এর আলাদা catalogue এখানে মেশানো হয় না।</p>
            </div>
            <Link href="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-extrabold text-[#17452c] transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">পণ্য ব্যবস্থাপনা খুলুন <span aria-hidden="true" className="ml-2">↗</span></Link>
          </div>
        </header>

        {failed && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">কিছু product metric লোড করা যায়নি। ব্যর্থ query-র মান শূন্য নয়, unavailable হিসেবে দেখানো হয়েছে। Database permission ও query status যাচাই করুন।</p>}

        <section aria-label="Marketplace product metrics" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((metric, index) => (
            <article key={metric.label} className="rounded-2xl border border-[#e0e9dd] bg-white p-4 shadow-[0_2px_12px_rgba(23,53,31,0.03)] sm:p-5">
              <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#647568] sm:text-sm">{metric.label}</p><span className={`h-2 w-2 rounded-full ${index === 1 ? "bg-emerald-500" : index === 2 ? "bg-amber-400" : "bg-[#c8d8c5]"}`} /></div>
              <p className="mt-3 text-3xl font-black tracking-tight tabular-nums">{metric.value}</p>
              <p className="mt-1 text-[11px] font-medium text-[#879488]">{metric.hint}</p>
            </article>
          ))}
        </section>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#9a7625]">WORKSPACES</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Marketplace operations</h2><p className="mt-1 text-sm text-[#718073]">প্রতিটি কাজের জন্য একটি canonical entry point।</p></div>
          <span className="rounded-full border border-[#dce7d8] bg-white px-3 py-1.5 text-xs font-bold text-[#647568]">4 workspaces</span>
        </div>

        <section aria-label="Marketplace workspaces" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module, index) => (
            <Link key={module.href} href={module.href} className={`group flex min-h-[230px] flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17452c] ${module.tone === "primary" ? "border-[#17452c] bg-[#17452c] text-white" : "border-[#e0e9dd] bg-white text-[#17351f] hover:border-[#a9c1a5]"}`}>
              <div className="flex items-center justify-between"><span className={`text-[10px] font-black tracking-[.16em] ${module.tone === "primary" ? "text-emerald-200" : "text-[#a47b20]"}`}>{module.eyebrow}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${module.tone === "primary" ? "bg-white/10 text-white" : "bg-[#edf4e9] text-[#27613b]"}`}>{String(index + 1).padStart(2, "0")}</span></div>
              <h3 className="mt-5 text-lg font-black">{module.title}</h3>
              <p className={`mt-2 flex-1 text-sm leading-6 ${module.tone === "primary" ? "text-emerald-50/85" : "text-[#68786b]"}`}>{module.description}</p>
              <span className={`mt-5 inline-flex items-center text-sm font-extrabold ${module.tone === "primary" ? "text-white" : "text-[#245b37]"}`}>{module.action}<span aria-hidden="true" className="ml-2 transition group-hover:translate-x-1">→</span></span>
            </Link>
          ))}
        </section>

        <aside className="mt-6 flex gap-3 rounded-2xl border border-dashed border-[#d3dfcf] bg-white/70 p-4 sm:p-5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4e9] text-[#27613b]" aria-hidden="true">i</span>
          <div><h3 className="text-sm font-extrabold">SEO URL safety</h3><p className="mt-1 text-sm leading-6 text-[#68786b]">Custom slug editing, slug history ও 301 redirect এখনো enable করা হয়নি। URL পরিবর্তন persist করার আগে reviewed database migration এবং production schema reconciliation প্রয়োজন।</p></div>
        </aside>
      </div>
    </main>
  );
}
