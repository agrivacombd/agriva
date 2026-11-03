import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata = {
  title: "Marketplace Control | AGRIVA Admin",
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
    { label: "All products", value: all.error ? "—" : all.count ?? 0 },
    { label: "Active", value: active.error ? "—" : active.count ?? 0 },
    { label: "Draft", value: drafts.error ? "—" : drafts.count ?? 0 },
    { label: "Paused", value: paused.error ? "—" : paused.count ?? 0 },
    { label: "Sold out", value: soldOut.error ? "—" : soldOut.count ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-2xl bg-[#123b27] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-100">AGRIVA ADMIN · MODULE 03</p>
          <h1 className="mt-2 text-3xl font-black">Marketplace Control</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">Marketplace catalog operations in one place. Product ownership and Plant Market records remain separate.</p>
        </header>

        {failed && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Some product metrics could not be loaded. Failed queries are shown as unavailable, not zero.</p>}

        <section aria-label="Marketplace product metrics" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-xl border border-[#dfe8dc] bg-white p-4">
              <p className="text-xs font-semibold text-[#6c7b6d]">{metric.label}</p>
              <p className="mt-2 text-2xl font-black tabular-nums">{metric.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link href="/admin/products" className="rounded-2xl border border-[#dfe8dc] bg-white p-5 transition hover:border-[#8ba98a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17452c]">
            <p className="text-xs font-black uppercase tracking-wider text-[#a47b20]">Catalog</p>
            <h2 className="mt-2 text-xl font-black">All Products & Editor</h2>
            <p className="mt-2 text-sm leading-6 text-[#637266]">Edit product name, description, price, stock, commission, taxonomy and publication status.</p>
            <span className="mt-4 inline-flex rounded-lg bg-[#17452c] px-3 py-2 text-sm font-bold text-white">Open product editor →</span>
          </Link>
          <Link href="/admin/seller-applications" className="rounded-2xl border border-[#dfe8dc] bg-white p-5 transition hover:border-[#8ba98a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17452c]">
            <p className="text-xs font-black uppercase tracking-wider text-[#a47b20]">Seller onboarding</p>
            <h2 className="mt-2 text-xl font-black">Seller Submissions</h2>
            <p className="mt-2 text-sm leading-6 text-[#637266]">Review seller applications through the existing verification workflow.</p>
            <span className="mt-4 inline-flex rounded-lg bg-[#eaf2e6] px-3 py-2 text-sm font-bold text-[#17452c]">Review applications →</span>
          </Link>
          <Link href="/admin/categories" className="rounded-2xl border border-[#dfe8dc] bg-white p-5 transition hover:border-[#8ba98a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17452c]">
            <p className="text-xs font-black uppercase tracking-wider text-[#a47b20]">Taxonomy</p>
            <h2 className="mt-2 text-xl font-black">Categories</h2>
            <p className="mt-2 text-sm leading-6 text-[#637266]">Manage the current Marketplace taxonomy and category assignments.</p>
            <span className="mt-4 inline-flex rounded-lg bg-[#eaf2e6] px-3 py-2 text-sm font-bold text-[#17452c]">Manage categories →</span>
          </Link>
        </section>

        <p className="mt-6 rounded-xl border border-dashed border-[#d4dfd0] bg-white/70 p-4 text-sm leading-6 text-[#657467]">
          Custom slug editing, slug history and 301 redirects are intentionally not enabled yet. They require a reviewed database migration and production schema reconciliation before the editor can persist URL changes.
        </p>
      </div>
    </main>
  );
}
