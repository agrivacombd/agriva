"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, PackageSearch, RefreshCw, Wheat } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { rankFarmerDemandMatches, type FarmerDemand } from "@/lib/growth/demand-matching.mjs";

type Props = { productNames: string[]; district: string | null };
const bn = (value: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);
const units: Record<FarmerDemand["unit"], string> = { kg: "কেজি", maund: "মণ", ton: "টন", bag: "বস্তা" };

function demandPrice(demand: FarmerDemand) {
  if (demand.price_type === "fixed" && demand.target_price != null) return `৳${bn(Number(demand.target_price))}/${units[demand.unit]}`;
  return demand.price_type === "market" ? "বাজারদর অনুযায়ী" : "আলোচনা সাপেক্ষে";
}
function needLabel(demand: FarmerDemand) {
  if (demand.need_mode === "urgent") return "জরুরি চাহিদা";
  if (demand.need_mode === "specific_date" && demand.need_date) return new Date(demand.need_date + "T00:00:00").toLocaleDateString("bn-BD");
  if (demand.need_mode === "date_range" && demand.need_start_date && demand.need_end_date) {
    return `${new Date(demand.need_start_date + "T00:00:00").toLocaleDateString("bn-BD")} – ${new Date(demand.need_end_date + "T00:00:00").toLocaleDateString("bn-BD")}`;
  }
  return "সময় আলোচনা সাপেক্ষে";
}

export default function FarmerDemandMatches({ productNames, district }: Props) {
  const [matches, setMatches] = useState<ReturnType<typeof rankFarmerDemandMatches>>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const productNamesKey = productNames.join("|");\n\n  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { setFailed(true); setLoading(false); return; }
    const today = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data, error } = await supabase.from("buyer_demands")
      .select("id,crop_name,quantity,unit,price_type,target_price,district,upazila,need_mode,need_date,need_start_date,need_end_date,response_deadline,allow_partial,created_at")
      .eq("status", "active")
      .or(`response_deadline.is.null,response_deadline.gte.${today}`)
      .order("created_at", { ascending: false }).limit(100);
    if (error) {
      setFailed(true);
      setMatches([]);
    } else {
      setMatches(rankFarmerDemandMatches((data ?? []) as FarmerDemand[], productNamesKey.split("|").filter(Boolean), district));
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [productNames.join("|"), district]);

  return <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="farmer-demand-matches-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">AGRIVA Growth Engine</p>
        <h2 id="farmer-demand-matches-title" className="mt-1 text-xl font-black">আপনার জন্য ক্রেতার চাহিদা</h2>
        <p className="mt-1 text-sm text-[#647468]">আপনার পণ্যের নাম ও খামারের জেলার সঙ্গে মিলে যাওয়া সক্রিয় চাহিদা</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} aria-label="চাহিদা আবার লোড করুন" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15}/> রিফ্রেশ</button>
    </div>
    {loading ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">মিল থাকা চাহিদা খোঁজা হচ্ছে…</p>
      : failed ? <div role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">চাহিদা এখন লোড করা যাচ্ছে না। আবার চেষ্টা করুন।</div>
      : matches.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5 text-center"><Wheat className="mx-auto text-emerald-700" size={28}/><p className="mt-2 font-bold">এখনো সরাসরি মিলে যাওয়া চাহিদা নেই</p><p className="mt-1 text-sm text-slate-500">নতুন চাহিদা এলে এখানে দেখা যাবে। সব চাহিদা দেখতে Demand Board খুলুন।</p></div>
      : <div className="mt-5 grid gap-3 md:grid-cols-2">{matches.map((demand) => <article key={demand.id} className="rounded-2xl border border-slate-100 bg-[#fbfdf9] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{demand.crop_name}</span>
          {demand.need_mode === "urgent" && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">জরুরি</span>}</div>
        <p className="mt-3 text-xl font-black">{bn(Number(demand.quantity))} {units[demand.unit]}</p>
        <p className="mt-1 text-sm font-bold text-emerald-800">{demandPrice(demand)}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><MapPin size={14}/>{demand.upazila ? demand.upazila + ", " : ""}{demand.district}</span><span className="inline-flex items-center gap-1"><PackageSearch size={14}/>{needLabel(demand)}</span></div>
        <div className="mt-3 flex flex-wrap gap-2">{demand.matchReasons.includes("crop") && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">আপনার পণ্যের সঙ্গে মিল</span>}{demand.matchReasons.includes("district") && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">আপনার জেলায়</span>}</div>
        <p className="mt-3 text-xs text-slate-500">{demand.allow_partial ? "আংশিক সরবরাহ গ্রহণযোগ্য" : "সম্পূর্ণ পরিমাণ প্রয়োজন"}</p>
      </article>)}</div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">শুধু সক্রিয় ও সময়সীমা বৈধ চাহিদা দেখানো হয়; ব্যক্তিগত যোগাযোগের তথ্য এখানে দেখানো হয় না।</p><Link href="/buyer-demands" className="rounded-xl bg-[#17351f] px-4 py-2.5 text-sm font-bold text-white">সব চাহিদা দেখুন</Link></div>
  </section>;
}
