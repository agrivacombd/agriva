"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CalendarDays, CheckCircle2, Clock3, MapPin, PackageSearch, Phone, Plus, Search, Wheat, X } from "lucide-react";

type Unit = "kg" | "maund" | "ton" | "bag";
type NeedMode = "urgent" | "specific_date" | "date_range" | "flexible";
type Demand = {
  id: string; buyer_id: string; crop_name: string; variety: string | null; quantity: number; unit: Unit;
  price_type: "fixed" | "negotiable" | "market"; target_price: number | null; district: string; upazila: string | null;
  delivery_method: "buyer_pickup" | "seller_delivery" | "discuss"; need_mode: NeedMode; need_date: string | null;
  need_start_date: string | null; need_end_date: string | null; response_deadline: string | null; allow_partial: boolean;
  notes: string; contact_phone: string | null; contact_phone_public: boolean; status: "active" | "fulfilled" | "cancelled";
  created_at: string;
};
type Response = {
  id: string; demand_id: string; farmer_id: string; available_quantity: number; unit: Unit; offered_price: number | null;
  available_date: string | null; location: string; contact_phone: string; message: string;
  status: "interested" | "contacted" | "accepted" | "rejected" | "withdrawn"; created_at: string;
};

const crops = ["ধান", "চাল", "গম", "ভুট্টা", "আলু", "পেঁয়াজ", "রসুন", "সরিষা", "ডাল", "সবজি", "ফল", "পাট", "অন্যান্য"];
const districts = ["নওগাঁ", "রাজশাহী", "বগুড়া", "জয়পুরহাট", "চাঁপাইনবাবগঞ্জ", "নাটোর", "পাবনা", "দিনাজপুর", "রংপুর", "কুষ্টিয়া", "যশোর", "ময়মনসিংহ", "ঢাকা", "চট্টগ্রাম", "অন্যান্য"];
const units: { value: Unit; label: string }[] = [
  { value: "maund", label: "মণ" }, { value: "kg", label: "কেজি" }, { value: "ton", label: "টন" }, { value: "bag", label: "বস্তা" },
];
const bn = (n: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(n);
const unitLabel = (unit: Unit) => units.find((u) => u.value === unit)?.label ?? unit;
const dateLabel = (value: string) => new Date(value + "T00:00:00").toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
const priceLabel = (d: Demand) => d.price_type === "fixed" ? `৳${bn(Number(d.target_price))}/${unitLabel(d.unit)}` : d.price_type === "market" ? "বাজারদর অনুযায়ী" : "আলোচনা সাপেক্ষে";
const needLabel = (d: Demand) => d.need_mode === "urgent" ? "জরুরি · ১–৩ দিনের মধ্যে" : d.need_mode === "specific_date" && d.need_date ? dateLabel(d.need_date) + " তারিখে লাগবে" : d.need_mode === "date_range" && d.need_start_date && d.need_end_date ? dateLabel(d.need_start_date) + " – " + dateLabel(d.need_end_date) : "সময় আলোচনা সাপেক্ষে";
const deliveryLabel = (d: Demand) => d.delivery_method === "buyer_pickup" ? "ক্রেতা নিজে সংগ্রহ করবেন" : d.delivery_method === "seller_delivery" ? "বিক্রেতাকে পৌঁছে দিতে হবে" : "আলোচনা করে ঠিক হবে";
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";
const labelClass = "block text-sm font-semibold text-slate-700";

export default function BuyerDemandBoard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [cropFilter, setCropFilter] = useState("সব ফসল");
  const [districtFilter, setDistrictFilter] = useState("সব জেলা");
  const [search, setSearch] = useState("");
  const [respondingTo, setRespondingTo] = useState<Demand | null>(null);

  const [cropName, setCropName] = useState("ধান");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("maund");
  const [priceType, setPriceType] = useState<Demand["price_type"]>("negotiable");
  const [targetPrice, setTargetPrice] = useState("");
  const [district, setDistrict] = useState("নওগাঁ");
  const [upazila, setUpazila] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<Demand["delivery_method"]>("discuss");
  const [needMode, setNeedMode] = useState<NeedMode>("flexible");
  const [needDate, setNeedDate] = useState("");
  const [needStartDate, setNeedStartDate] = useState("");
  const [needEndDate, setNeedEndDate] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  const [allowPartial, setAllowPartial] = useState(true);
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [phonePublic, setPhonePublic] = useState(false);

  const [availableQuantity, setAvailableQuantity] = useState("");
  const [availableUnit, setAvailableUnit] = useState<Unit>("maund");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [farmerLocation, setFarmerLocation] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [sharePhone, setSharePhone] = useState(false);
  const [farmerMessage, setFarmerMessage] = useState("");

  const loadBoard = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    const { data, error } = await supabase.from("buyer_demands")
      .select("id,buyer_id,crop_name,variety,quantity,unit,price_type,target_price,district,upazila,delivery_method,need_mode,need_date,need_start_date,need_end_date,response_deadline,allow_partial,notes,contact_phone,contact_phone_public,status,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) {
      setNotice("চাহিদা লোড করা যায়নি। ডেটাবেস মাইগ্রেশন চালু হয়েছে কি না যাচাই করে আবার চেষ্টা করুন।");
      setDemands([]);
    } else {
      setDemands((data ?? []) as Demand[]);
    }
    if (user) {
      const { data: ownResponses, error: responseError } = await supabase.from("buyer_demand_responses")
        .select("id,demand_id,farmer_id,available_quantity,unit,offered_price,available_date,location,contact_phone,message,status,created_at")
        .order("created_at", { ascending: false }).limit(200);
      if (!responseError) setResponses((ownResponses ?? []) as Response[]);
    } else {
      setResponses([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadBoard(); }, [loadBoard]);

  const visibleDemands = useMemo(() => demands.filter((d) => {
    if (mineOnly && d.buyer_id !== userId) return false;
    if (!mineOnly && (d.status !== "active" || (d.response_deadline && d.response_deadline < new Date().toISOString().slice(0, 10)))) return false;
    if (cropFilter !== "সব ফসল" && d.crop_name !== cropFilter) return false;
    if (districtFilter !== "সব জেলা" && d.district !== districtFilter) return false;
    const q = search.trim().toLocaleLowerCase();
    return !q || [d.crop_name, d.variety, d.district, d.upazila, d.notes].some((v) => v?.toLocaleLowerCase().includes(q));
  }), [demands, mineOnly, userId, cropFilter, districtFilter, search]);

  async function submitDemand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?next=%2Fbuyer-demands"; return; }
    if (priceType === "fixed" && (!targetPrice || Number(targetPrice) <= 0)) { setNotice("নির্দিষ্ট দাম দিলে প্রতি এককের সঠিক দাম লিখুন।"); return; }
    if (needMode === "specific_date" && !needDate) { setNotice("পণ্য লাগার তারিখ দিন।"); return; }
    if (needMode === "date_range" && (!needStartDate || !needEndDate || needStartDate > needEndDate)) { setNotice("সময়সীমার শুরু ও শেষ তারিখ সঠিকভাবে দিন।"); return; }
    if (responseDeadline && responseDeadline < new Date().toISOString().slice(0, 10)) { setNotice("আগ্রহ জানানোর শেষ তারিখ আজ বা ভবিষ্যতের হতে হবে।"); return; }
    setBusy(true);
    const { error } = await supabase.from("buyer_demands").insert({
      buyer_id: user.id, crop_name: cropName, variety: variety.trim() || null, quantity: Number(quantity), unit,
      price_type: priceType, target_price: priceType === "fixed" ? Number(targetPrice) : null,
      district, upazila: upazila.trim() || null, delivery_method: deliveryMethod, need_mode: needMode,
      need_date: needMode === "specific_date" ? needDate : null,
      need_start_date: needMode === "date_range" ? needStartDate : null,
      need_end_date: needMode === "date_range" ? needEndDate : null,
      response_deadline: responseDeadline || null, allow_partial: allowPartial, notes: notes.trim(),
      contact_phone: phonePublic ? contactPhone.trim() || null : null, contact_phone_public: phonePublic,
      status: "active",
    });
    setBusy(false);
    if (error) { setNotice("চাহিদা পোস্ট করা যায়নি। তথ্যগুলো যাচাই করে আবার চেষ্টা করুন।"); return; }
    setNotice("চাহিদা পোস্ট হয়েছে। এখন কৃষকরা আগ্রহ জানাতে পারবেন।");
    setShowForm(false); setMineOnly(true);
    setCropName("ধান"); setVariety(""); setQuantity(""); setUnit("maund"); setPriceType("negotiable"); setTargetPrice("");
    setNeedMode("flexible"); setNeedDate(""); setNeedStartDate(""); setNeedEndDate(""); setResponseDeadline("");
    setNotes(""); setContactPhone(""); setPhonePublic(false);
    await loadBoard();
  }

  async function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!respondingTo) return;
    setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?next=%2Fbuyer-demands"; return; }
    if (user.id === respondingTo.buyer_id) { setNotice("নিজের পোস্টে আগ্রহ পাঠানো যাবে না।"); return; }
    if (!sharePhone || farmerPhone.trim().length < 6) { setNotice("ক্রেতার সঙ্গে যোগাযোগের জন্য ফোন নম্বর দিন এবং নম্বর শেয়ারের সম্মতি দিন।"); return; }
    if (Number(availableQuantity) <= 0) { setNotice("আপনার কাছে থাকা ফসলের পরিমাণ লিখুন।"); return; }
    setBusy(true);
    const { error } = await supabase.from("buyer_demand_responses").upsert({
      demand_id: respondingTo.id, farmer_id: user.id, available_quantity: Number(availableQuantity),
      unit: availableUnit, offered_price: offeredPrice ? Number(offeredPrice) : null,
      available_date: availableDate || null, location: farmerLocation.trim(), contact_phone: farmerPhone.trim(),
      message: farmerMessage.trim(), status: "interested",
    }, { onConflict: "demand_id,farmer_id" });
    setBusy(false);
    if (error) { setNotice(error.code === "23505" ? "এই চাহিদায় আপনি আগে আগ্রহ জানিয়েছেন। নিজের পোস্টের আগ্রহ দেখতে 'আমার পোস্ট' দেখুন।" : "আগ্রহ পাঠানো যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।"); return; }
    setRespondingTo(null); setAvailableQuantity(""); setOfferedPrice(""); setAvailableDate(""); setFarmerLocation(""); setFarmerPhone(""); setSharePhone(false); setFarmerMessage("");
    setNotice("আপনার আগ্রহ ক্রেতার কাছে পাঠানো হয়েছে। ক্রেতা এখন আপনার দেওয়া ফোন নম্বরে যোগাযোগ করতে পারবেন।");
    await loadBoard();
  }

  async function closeDemand(demand: Demand, status: "fulfilled" | "cancelled") {
    if (!userId || demand.buyer_id !== userId) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("buyer_demands").update({ status }).eq("id", demand.id).eq("buyer_id", userId);
    setBusy(false);
    if (error) { setNotice("চাহিদার অবস্থা বদলানো যায়নি। আবার চেষ্টা করুন।"); return; }
    setNotice(status === "fulfilled" ? "চাহিদা পূরণ হয়েছে হিসেবে চিহ্নিত করা হয়েছে।" : "চাহিদাটি বন্ধ করা হয়েছে।");
    await loadBoard();
  }

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#173629]">
      <section className="bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link href="/" className="text-sm font-bold text-emerald-100 hover:text-white">← AGRIVA হোম</Link>
          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide"><PackageSearch size={15} /> AGRIVA BUYER DEMAND BOARD</p>
              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">ক্রেতার চাহিদা</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">কোন ফসল, কত পরিমাণ, কোথায় ও কবে লাগবে—ক্রেতা চাহিদা পোস্ট করবেন। আপনার কাছে ফসল থাকলে আগ্রহ জানিয়ে সরাসরি যোগাযোগের সুযোগ নিন।</p>
            </div>
            <button type="button" onClick={() => { setShowForm((v) => !v); setRespondingTo(null); }} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-[#173629] transition hover:bg-lime-200"><Plus size={18} /> চাহিদা পোস্ট করুন</button>
          </div>
          <div className="mt-7 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-2xl font-black">{bn(demands.filter((d) => d.status === "active").length)}</p><p className="mt-1 text-emerald-50/80">সক্রিয় চাহিদা</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-2xl font-black">{bn(responses.filter((r) => r.farmer_id === userId).length)}</p><p className="mt-1 text-emerald-50/80">আপনার পাঠানো আগ্রহ</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-2xl font-black">{bn(demands.filter((d) => d.buyer_id === userId).length)}</p><p className="mt-1 text-emerald-50/80">আপনার পোস্ট</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {notice && <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"><span>{notice}</span><button aria-label="বার্তা বন্ধ করুন" onClick={() => setNotice("")}><X size={17} /></button></div>}

        {showForm && (
          <form onSubmit={submitDemand} className="mb-8 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">নতুন ক্রেতা চাহিদা</h2><p className="mt-1 text-sm text-slate-500">আপনার যোগাযোগের নম্বর শুধু প্রকাশের সম্মতি দিলে সবাই দেখতে পাবেন।</p></div><button type="button" aria-label="ফর্ম বন্ধ করুন" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>ফসলের নাম<select className={inputClass} value={cropName} onChange={(e) => setCropName(e.target.value)}>{crops.map((crop) => <option key={crop}>{crop}</option>)}</select></label>
              <label className={labelClass}>জাত / মান (ঐচ্ছিক)<input className={inputClass} value={variety} onChange={(e) => setVariety(e.target.value)} maxLength={100} placeholder="যেমন: শুকনা ধান" /></label>
              <label className={labelClass}>কত পরিমাণ লাগবে<input className={inputClass} type="number" min="0.01" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="যেমন: 100" /></label>
              <label className={labelClass}>একক<select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>{units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label>
              <label className={labelClass}>দাম নির্ধারণ<select className={inputClass} value={priceType} onChange={(e) => setPriceType(e.target.value as Demand["price_type"])}><option value="negotiable">আলোচনা সাপেক্ষে</option><option value="fixed">নির্দিষ্ট দাম</option><option value="market">বাজারদর অনুযায়ী</option></select></label>
              {priceType === "fixed" && <label className={labelClass}>প্রতি {unitLabel(unit)} দাম (টাকা)<input className={inputClass} type="number" min="0.01" step="0.01" required value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="যেমন: 1200" /></label>}
              <label className={labelClass}>জেলা<select className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)}>{districts.map((d) => <option key={d}>{d}</option>)}</select></label>
              <label className={labelClass}>উপজেলা / বাজার<input className={inputClass} value={upazila} onChange={(e) => setUpazila(e.target.value)} maxLength={100} placeholder="যেমন: মান্দা বাজার" /></label>
              <label className={labelClass}>সংগ্রহ / ডেলিভারি<select className={inputClass} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as Demand["delivery_method"])}><option value="buyer_pickup">ক্রেতা নিজে সংগ্রহ করবেন</option><option value="seller_delivery">বিক্রেতাকে পৌঁছে দিতে হবে</option><option value="discuss">আলোচনা করে ঠিক হবে</option></select></label>
              <label className={labelClass}>কবে পণ্য লাগবে?<select className={inputClass} value={needMode} onChange={(e) => setNeedMode(e.target.value as NeedMode)}><option value="urgent">জরুরি · ১–৩ দিনের মধ্যে</option><option value="specific_date">নির্দিষ্ট তারিখে</option><option value="date_range">তারিখের মধ্যে (সময়সীমা)</option><option value="flexible">সময় আলোচনা সাপেক্ষে</option></select></label>
              {needMode === "specific_date" && <label className={labelClass}>পণ্য লাগার তারিখ<input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} required value={needDate} onChange={(e) => setNeedDate(e.target.value)} /></label>}
              {needMode === "date_range" && <><label className={labelClass}>সময়সীমা শুরু<input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} required value={needStartDate} onChange={(e) => setNeedStartDate(e.target.value)} /></label><label className={labelClass}>সময়সীমা শেষ<input className={inputClass} type="date" min={needStartDate || new Date().toISOString().slice(0, 10)} required value={needEndDate} onChange={(e) => setNeedEndDate(e.target.value)} /></label></>}
              <label className={labelClass}>আগ্রহ জানানোর শেষ তারিখ (ঐচ্ছিক)<input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} value={responseDeadline} onChange={(e) => setResponseDeadline(e.target.value)} /></label>
              <label className={labelClass}>যোগাযোগের ফোন (ঐচ্ছিক)<input className={inputClass} type="tel" maxLength={30} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="01XXXXXXXXX" /></label>
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={allowPartial} onChange={(e) => setAllowPartial(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span><strong>আংশিক সরবরাহ চলবে</strong><span className="block text-slate-500">একজন কৃষকের কাছে পুরো পরিমাণ না থাকলেও আগ্রহ জানাতে পারবেন।</span></span></label>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={phonePublic} onChange={(e) => setPhonePublic(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span><strong>আমার ফোন নম্বর সবাই দেখতে পারবে</strong><span className="block text-slate-500">টিক না দিলে নম্বরটি প্রকাশ করা হবে না।</span></span></label>
            <label className={labelClass + " mt-4"}>অতিরিক্ত শর্ত / পণ্যের মান<textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} placeholder="যেমন: শুকনা ও পরিষ্কার হতে হবে, একবারে বা কয়েক ধাপে সরবরাহ চলবে" /></label>
            <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60" type="submit">{busy ? "পোস্ট হচ্ছে..." : "চাহিদা প্রকাশ করুন"}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">বাতিল</button></div>
          </form>
        )}

        {respondingTo && (
          <form onSubmit={submitResponse} className="mb-8 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">এই চাহিদায় আগ্রহ জানান</h2><p className="mt-1 text-sm text-slate-500">{respondingTo.crop_name} · {bn(Number(respondingTo.quantity))} {unitLabel(respondingTo.unit)} লাগবে</p></div><button type="button" aria-label="আগ্রহ ফর্ম বন্ধ করুন" onClick={() => setRespondingTo(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>আপনার কাছে কত মজুদ আছে?<input className={inputClass} type="number" min="0.01" step="0.01" required value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} placeholder="পরিমাণ" /></label>
              <label className={labelClass}>একক<select className={inputClass} value={availableUnit} onChange={(e) => setAvailableUnit(e.target.value as Unit)}>{units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label>
              <label className={labelClass}>আপনার প্রস্তাবিত দাম (ঐচ্ছিক)<input className={inputClass} type="number" min="0.01" step="0.01" value={offeredPrice} onChange={(e) => setOfferedPrice(e.target.value)} placeholder="প্রতি একক টাকা" /></label>
              <label className={labelClass}>কবে দিতে পারবেন?<input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} value={availableDate} onChange={(e) => setAvailableDate(e.target.value)} /></label>
              <label className={labelClass}>ফসল কোথায় আছে?<input className={inputClass} required maxLength={160} value={farmerLocation} onChange={(e) => setFarmerLocation(e.target.value)} placeholder="জেলা / উপজেলা / বাজার" /></label>
              <label className={labelClass}>আপনার ফোন নম্বর<input className={inputClass} type="tel" required minLength={6} maxLength={30} value={farmerPhone} onChange={(e) => setFarmerPhone(e.target.value)} placeholder="01XXXXXXXXX" /></label>
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={sharePhone} onChange={(e) => setSharePhone(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" required /><span><strong>আমি সম্মতি দিচ্ছি, আমার ফোন নম্বর এই চাহিদার ক্রেতার সঙ্গে শেয়ার করা হবে।</strong><span className="block text-slate-500">নম্বরটি অন্য ব্যবহারকারীদের দেখানো হবে না।</span></span></label>
            <label className={labelClass + " mt-4"}>বার্তা (ঐচ্ছিক)<textarea className={inputClass} value={farmerMessage} onChange={(e) => setFarmerMessage(e.target.value)} maxLength={1000} rows={2} placeholder="ফসলের মান, সরবরাহ বা অন্য তথ্য" /></label>
            <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60" type="submit">{busy ? "পাঠানো হচ্ছে..." : "আগ্রহ পাঠান"}</button><button type="button" onClick={() => setRespondingTo(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">বাতিল</button></div>
          </form>
        )}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto]">
            <label className="relative block"><span className="sr-only">ফসল বা এলাকা খুঁজুন</span><Search size={17} className="absolute left-3 top-4 text-slate-400" /><input className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ফসল, জাত বা এলাকা খুঁজুন" /></label>
            <select aria-label="ফসল বাছুন" className={inputClass.replace("mt-1.5 ", "")} value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}><option>সব ফসল</option>{crops.map((c) => <option key={c}>{c}</option>)}</select>
            <select aria-label="জেলা বাছুন" className={inputClass.replace("mt-1.5 ", "")} value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}><option>সব জেলা</option>{districts.map((d) => <option key={d}>{d}</option>)}</select>
            {userId && <button type="button" onClick={() => setMineOnly((v) => !v)} className={"rounded-xl px-4 py-3 text-sm font-bold " + (mineOnly ? "bg-emerald-700 text-white" : "border border-slate-200 text-slate-700")}>{mineOnly ? "সব চাহিদা দেখুন" : "আমার পোস্ট"}</button>}
          </div>
          <p className="mt-3 text-xs text-slate-500">ফোন নম্বর শুধু ক্রেতা প্রকাশের সম্মতি দিলে দেখা যাবে। কৃষকের আগ্রহের ফোন নম্বর শুধু সংশ্লিষ্ট ক্রেতা দেখতে পাবেন।</p>
        </div>

        {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">চাহিদা লোড হচ্ছে...</div> : visibleDemands.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Wheat className="mx-auto text-emerald-700" size={34} /><h2 className="mt-3 text-lg font-black">{mineOnly ? "আপনার কোনো পোস্ট নেই" : "এখনো কোনো চাহিদা পাওয়া যায়নি"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{mineOnly ? "প্রথম চাহিদাটি পোস্ট করে কৃষকের কাছ থেকে আগ্রহ পান।" : "ফিল্টার পরিবর্তন করুন অথবা নতুন চাহিদা পোস্ট করতে ক্রেতাকে জানান।"}</p><button type="button" onClick={() => { setMineOnly(userId ? true : false); setShowForm(true); }} className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">চাহিদা পোস্ট করুন</button></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleDemands.map((d) => {
              const own = d.buyer_id === userId;
              const replies = responses.filter((r) => r.demand_id === d.id);
              return <article key={d.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
                <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">{d.crop_name}</span>{d.variety && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{d.variety}</span>}{own && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">আপনার পোস্ট</span>}</div><h2 className="mt-3 text-2xl font-black">{bn(Number(d.quantity))} {unitLabel(d.unit)}</h2><p className="mt-1 text-sm font-bold text-emerald-800">{priceLabel(d)}</p></div><span className={"rounded-full px-3 py-1 text-xs font-bold " + (d.status === "active" ? "bg-lime-100 text-lime-900" : "bg-slate-100 text-slate-600")}>{d.status === "active" ? "সক্রিয়" : d.status === "fulfilled" ? "পূরণ হয়েছে" : "বন্ধ"}</span></div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-emerald-700" />{d.upazila ? d.upazila + ", " : ""}{d.district}</p><p className="flex items-start gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-emerald-700" />{needLabel(d)}</p><p className="flex items-start gap-2"><PackageSearch size={16} className="mt-0.5 shrink-0 text-emerald-700" />{deliveryLabel(d)}</p><p className="flex items-start gap-2"><Clock3 size={16} className="mt-0.5 shrink-0 text-emerald-700" />{d.allow_partial ? "আংশিক সরবরাহ চলবে" : "একজনের কাছ থেকে পুরো পরিমাণ লাগবে"}</p></div>
                {d.notes && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{d.notes}</p>}
                {d.contact_phone_public && d.contact_phone && <a href={"tel:" + d.contact_phone} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-800"><Phone size={16} /> ক্রেতার ফোন: {d.contact_phone}</a>}
                <p className="mt-4 text-xs text-slate-400">পোস্ট: {dateLabel(d.created_at.slice(0, 10))}{d.response_deadline ? " · আগ্রহ জানানোর শেষ তারিখ: " + dateLabel(d.response_deadline) : ""}</p>
                {own ? <div className="mt-4 border-t border-slate-100 pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-extrabold text-slate-800">কৃষকের আগ্রহ ({bn(replies.length)})</p>{d.status === "active" && <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void closeDemand(d, "fulfilled")} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-60">পূরণ হয়েছে</button><button type="button" disabled={busy} onClick={() => void closeDemand(d, "cancelled")} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-60">চাহিদা বন্ধ</button></div>}</div>{replies.length > 0 && <div className="mt-3 space-y-3">{replies.map((r) => <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{bn(Number(r.available_quantity))} {unitLabel(r.unit)} মজুদ আছে</strong><span className="text-xs text-slate-500">{r.offered_price ? "প্রস্তাব: ৳" + bn(Number(r.offered_price)) + "/" + unitLabel(r.unit) : "দাম আলোচনা সাপেক্ষে"}</span></div><p className="mt-1 text-xs text-slate-500">{r.location}{r.available_date ? " · দিতে পারবেন " + dateLabel(r.available_date) : ""}</p>{r.message && <p className="mt-2 text-sm text-slate-600">{r.message}</p>}<a href={"tel:" + r.contact_phone} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-emerald-800"><Phone size={15} /> {r.contact_phone}</a></div>)}</div>}{replies.length === 0 && <p className="mt-2 text-sm text-slate-500">এখনো কেউ আগ্রহ জানাননি।</p>}</div> : d.status === "active" && <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setShowForm(false); setRespondingTo(d); setAvailableUnit(d.unit); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-800"><CheckCircle2 size={16} /> আমার ফসল আছে</button>{!userId && <Link href={"/login?next=%2Fbuyer-demands"} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">লগইন করে আগ্রহ জানান</Link>}</div>}
              </article>;
            })}
          </div>
        )}
        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>নিরাপত্তা পরামর্শ:</strong> দাম, পরিমাণ, মান, পরিবহন ও পেমেন্টের শর্ত দুই পক্ষ নিজেরা নিশ্চিত করুন। AGRIVA-তে চাহিদা বা আগ্রহ পোস্ট হওয়া কোনো লেনদেনের নিশ্চয়তা নয়। ব্যক্তিগত নম্বর শুধু প্রয়োজনীয় সম্মতি দিয়ে শেয়ার করুন।</div>
      </section>
    </main>
  );
}
