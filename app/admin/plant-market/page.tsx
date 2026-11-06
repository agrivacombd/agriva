import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";
import PlantMarketProductManager, { type PlantMarketAdminProduct } from "@/components/admin/PlantMarketProductManager";

export const metadata: Metadata = {
  title: "Plant Market | AGRIVA Admin",
  robots: { index: false, follow: false },
};

const statuses = ["draft", "active", "rejected", "suspended"] as const;

export default async function AdminPlantMarketEditorPage({ searchParams }: { searchParams?: { q?: string; status?: string } }) {
  const { supabase } = await requireAdminPage("catalog.read");
  const search = String(searchParams?.q ?? "").trim().slice(0, 100).replace(/[%_]/g, "");
  const status = statuses.includes(searchParams?.status as typeof statuses[number]) ? searchParams?.status as typeof statuses[number] : "";
  let query = supabase.from("plant_market_products").select(
    "id,seller_id,name,slug,scientific_name,category,description,price,stock,unit,plant_size,pot_size,plant_age,sunlight,watering,flowering_season,delivery_area,image_url,images,status,updated_at"
  );
  if (search) query = query.ilike("name", `%${search}%`);
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(100);
  const products = (data ?? []) as PlantMarketAdminProduct[];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="relative overflow-hidden rounded-[28px] bg-[#17452c] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · LIVING CATALOGUE</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Plant Market</h1>
              <p className="mt-3 text-sm leading-6 text-emerald-50/90 sm:text-base">গাছের catalogue, scientific name, care information, price, stock ও delivery coverage পরিচালনা করুন। Marketplace-এর সাধারণ পণ্য থেকে এই catalogue আলাদা রাখা হয়েছে।</p>
            </div>
            <Link href="/admin/plant-market-products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-extrabold text-[#17452c] transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Moderation queue <span aria-hidden="true" className="ml-2">↗</span></Link>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#9a7625]">CATALOGUE MANAGEMENT</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Plant listings</h2><p className="mt-1 text-sm text-[#718073]">সর্বশেষ আপডেট হওয়া সর্বোচ্চ ১০০টি listing দেখানো হচ্ছে।</p></div>
          <span className="rounded-full border border-[#dce7d8] bg-white px-3 py-1.5 text-xs font-bold text-[#647568]">Server-side filters</span>
        </div>

        <form method="get" className="mt-4 grid gap-3 rounded-2xl border border-[#e0e9dd] bg-white p-4 shadow-[0_2px_12px_rgba(23,53,31,0.03)] sm:grid-cols-[minmax(0,1fr)_220px_auto_auto] sm:items-end sm:p-5">
          <label className="text-sm font-extrabold text-[#344b39]">গাছের নাম দিয়ে খুঁজুন<input name="q" type="search" maxLength={100} defaultValue={search} placeholder="যেমন: Rose, Mango, Aloe vera" className="mt-2 min-h-11 w-full rounded-xl border border-[#d9e3d5] bg-[#fbfdf9] px-3 font-normal text-[#17351f] outline-none transition focus:border-[#4e865d] focus:ring-2 focus:ring-[#4e865d]/15"/></label>
          <label className="text-sm font-extrabold text-[#344b39]">Publication status<select name="status" defaultValue={status} className="mt-2 min-h-11 w-full rounded-xl border border-[#d9e3d5] bg-[#fbfdf9] px-3 font-normal text-[#17351f] outline-none focus:border-[#4e865d] focus:ring-2 focus:ring-[#4e865d]/15"><option value="">সব status</option>{statuses.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
          <button type="submit" className="min-h-11 rounded-xl bg-[#17452c] px-5 text-sm font-extrabold text-white transition hover:bg-[#225b39] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17452c]">Filter listings</button>
          <Link href="/admin/plant-market" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9e3d5] px-4 text-sm font-bold text-[#536b58] transition hover:bg-[#f4f8f1]">Clear</Link>
        </form>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#7b897d]"><span>✓ Search ও status filter server-side</span><span>✓ Care attributes সংরক্ষিত</span><span>• Image upload এখনো enable নয়</span></div>
        {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">Plant Market পণ্য পড়া যায়নি। Database permission বা schema যাচাই করুন।</p> : <div className="mt-5"><PlantMarketProductManager initialProducts={products}/></div>}
      </div>
    </main>
  );
}
