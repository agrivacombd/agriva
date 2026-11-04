import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";
import PlantMarketProductManager, { type PlantMarketAdminProduct } from "@/components/admin/PlantMarketProductManager";

export const metadata: Metadata = {
  title: "Plant Market Editor | AGRIVA Admin",
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

  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#a47b20]">PLANT MARKET</p><h1 className="mt-2 text-3xl font-black">Plant Market Editor</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">Plant Market-এর আলাদা catalogue, care details, price, stock এবং delivery information পরিচালনা করুন। Marketplace-এর পণ্য এখানে মেশানো হয় না।</p></div><Link href="/admin/plant-market-products" className="inline-flex min-h-11 items-center rounded-xl border border-[#d9e3d5] bg-white px-4 text-sm font-bold">Moderation queue →</Link></header>
      <form method="get" className="mt-5 grid gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_200px_auto_auto] sm:items-end">
        <label className="text-sm font-bold">পণ্য খুঁজুন<input name="q" type="search" maxLength={100} defaultValue={search} placeholder="নাম লিখুন..." className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
        <label className="text-sm font-bold">স্ট্যাটাস<select name="status" defaultValue={status} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 font-normal"><option value="">সব স্ট্যাটাস</option>{statuses.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
        <button type="submit" className="min-h-11 rounded-xl bg-[#17452c] px-5 text-sm font-bold text-white">Filter</button>
        <Link href="/admin/plant-market" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9e3d5] px-4 text-sm font-bold">Clear</Link>
      </form>
      <p className="mt-3 text-xs text-[#748074]">সর্বশেষ আপডেট হওয়া সর্বোচ্চ ১০০টি পণ্য। Search ও status filter server-side। Slug ও publication status moderation workflow-তে নিয়ন্ত্রিত; image upload এখনো enable করা হয়নি।</p>
      {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Plant Market পণ্য পড়া যায়নি। Database permission বা schema যাচাই করুন।</p> : <PlantMarketProductManager initialProducts={products}/>}
    </div>
  </main>;
}
