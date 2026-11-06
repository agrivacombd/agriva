import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export default async function AdminHarvestPage() {
  const { supabase } = await requireAdminPage("harvest.read");
  const { data: listings, error } = await supabase.from("harvest_listings")
    .select("id,seller_name,crop_name,variety,quantity,unit,price_per_unit,district,upazila,image_urls,status,created_at")
    .order("created_at", { ascending: false }).limit(200);
  const unitName = (unit: string) => ({ kg: "কেজি", maund: "মণ", ton: "টন", bag: "বস্তা" }[unit] ?? unit);
  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-[1500px]">
    <header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white sm:p-8"><div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5"/><div className="relative"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · AGRICULTURE & SERVICES</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">কৃষকের ফসলের পোস্ট</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">পোস্ট জমা দেওয়ার সঙ্গে সঙ্গেই প্রকাশিত হয়। এই পেজে listing visibility পর্যবেক্ষণ করা হয়; moderation action নেই।</p></div></header>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">ডেটাবেস থেকে পোস্ট আনা যায়নি। Migration ও RLS policy যাচাই করুন।</p>}
    <div className="mt-6 space-y-4">{(listings ?? []).map((item) => <article key={item.id} className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-[140px_1fr]">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-emerald-50">{item.image_urls?.[0] ? <img src={item.image_urls[0]} alt={item.crop_name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-4xl">🌾</div>}</div>
      <div><h2 className="text-xl font-black">{item.crop_name}{item.variety ? " · " + item.variety : ""}</h2><p className="mt-1 text-sm text-slate-600">বিক্রেতা: {item.seller_name} · {item.upazila ? item.upazila + ", " : ""}{item.district}</p><p className="mt-2 text-sm font-bold">৳{Number(item.price_per_unit).toLocaleString("en-BD")} / {unitName(item.unit)} · পরিমাণ {Number(item.quantity).toLocaleString("en-BD")} {unitName(item.unit)}</p><p className="mt-1 text-xs text-slate-500">পোস্ট: {new Date(item.created_at).toLocaleString("bn-BD")} · বিক্রির অবস্থা: {item.status}</p></div>
    </article>)}</div>
    {!error && (listings ?? []).length === 0 && <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600">এখনো কোনো ফসল বিক্রির পোস্ট আসেনি।</div>}
  </div></main>;
}
