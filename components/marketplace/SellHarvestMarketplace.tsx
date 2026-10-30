"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type HarvestListing = {
  id: string; owner_id: string; seller_name: string; crop_name: string; variety: string | null;
  description: string; quantity: number; unit: "kg" | "maund" | "ton" | "bag";
  price_per_unit: number; district: string; upazila: string | null; pickup_details: string | null;
  quality: string | null; harvest_ready: "ready_now" | "within_7_days" | "later";
  minimum_order: number | null; negotiable: boolean; transport_available: boolean;
  contact_phone: string | null; contact_phone_public: boolean; image_urls: string[];
  status: "available" | "sold_out" | "paused"; moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
};

const units = [
  { value: "kg", label: "কেজি" }, { value: "maund", label: "মণ" },
  { value: "ton", label: "টন" }, { value: "bag", label: "বস্তা" },
] as const;
const crops = ["সব ফসল", "ধান", "চাল", "গম", "ভুট্টা", "আলু", "পেঁয়াজ", "রসুন", "সরিষা", "ডাল", "সবজি", "ফল", "অন্যান্য"];
const districts = ["নওগাঁ","রাজশাহী","বগুড়া","জয়পুরহাট","চাঁপাইনবাবগঞ্জ","নাটোর","পাবনা","দিনাজপুর","রংপুর","কুষ্টিয়া","যশোর","ময়মনসিংহ","ঢাকা","চট্টগ্রাম","অন্যান্য"];
const bn = (n: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(n);
const unitLabel = (unit: HarvestListing["unit"]) => units.find((u) => u.value === unit)?.label ?? unit;
const readyLabel = (ready: HarvestListing["harvest_ready"]) => ready === "ready_now" ? "এখনই প্রস্তুত" : ready === "within_7_days" ? "৭ দিনের মধ্যে" : "পরে প্রস্তুত হবে";

export default function SellHarvestMarketplace() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [listings, setListings] = useState<HarvestListing[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [cropFilter, setCropFilter] = useState("সব ফসল");
  const [districtFilter, setDistrictFilter] = useState("সব জেলা");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sellerName, setSellerName] = useState("");
  const [cropName, setCropName] = useState("ধান");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<HarvestListing["unit"]>("kg");
  const [price, setPrice] = useState("");
  const [district, setDistrict] = useState("নওগাঁ");
  const [upazila, setUpazila] = useState("");
  const [quality, setQuality] = useState("ভালো");
  const [ready, setReady] = useState<HarvestListing["harvest_ready"]>("ready_now");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [transport, setTransport] = useState(false);
  const [phone, setPhone] = useState("");
  const [phonePublic, setPhonePublic] = useState(false);
  const [pickup, setPickup] = useState("");
  const [description, setDescription] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    // Any authenticated user may submit a harvest listing; moderation still applies.
    const { data, error } = await supabase.from("harvest_listings")
      .select("id,owner_id,seller_name,crop_name,variety,description,quantity,unit,price_per_unit,district,upazila,pickup_details,quality,harvest_ready,minimum_order,negotiable,transport_available,contact_phone,contact_phone_public,image_urls,status,moderation_status,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) setNotice("ফসলের পোস্ট লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    else setListings((data ?? []) as HarvestListing[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadListings(); }, [loadListings]);

  const visibleListings = useMemo(() => listings.filter((item) => {
    if (mineOnly && item.owner_id !== userId) return false;
    if (!mineOnly && (item.moderation_status !== "approved" || item.status !== "available")) return false;
    if (cropFilter !== "সব ফসল" && item.crop_name !== cropFilter) return false;
    if (districtFilter !== "সব জেলা" && item.district !== districtFilter) return false;
    const needle = search.trim().toLocaleLowerCase();
    return !needle || [item.crop_name, item.variety, item.district, item.upazila, item.description].some((v) => v?.toLocaleLowerCase().includes(needle));
  }), [listings, mineOnly, userId, cropFilter, districtFilter, search]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length > 5) { setNotice("সর্বোচ্চ ৫টি ছবি বাছুন।"); event.target.value = ""; return; }
    if (picked.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setNotice("শুধু JPG, PNG বা WEBP ছবি দিন; প্রতিটি ছবি সর্বোচ্চ ৫ MB হতে পারবে।"); event.target.value = ""; return;
    }
    setFiles(picked);
    setNotice("");
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?next=%2Fsell-harvest"; return; }
    if (!files.length) { setNotice("ফসলের অন্তত ১টি ছবি যোগ করুন।"); return; }
    if (!phonePublic || !phone.trim()) { setNotice("ক্রেতার সঙ্গে সরাসরি যোগাযোগের জন্য ফোন নম্বর দিন এবং নম্বর প্রকাশের সম্মতিতে টিক দিন।"); return; }
    setBusy(true);
    const imageUrls: string[] = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("harvest-images").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { setNotice("ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।"); setBusy(false); return; }
      const { data } = supabase.storage.from("harvest-images").getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }
    const { error } = await supabase.from("harvest_listings").insert({
      owner_id: user.id, seller_name: sellerName.trim(), crop_name: cropName.trim(), variety: variety.trim() || null,
      quantity: Number(quantity), unit, price_per_unit: Number(price), district, upazila: upazila.trim() || null,
      quality, harvest_ready: ready, minimum_order: minimumOrder ? Number(minimumOrder) : null,
      negotiable, transport_available: transport, contact_phone: phonePublic ? phone.trim() : null,
      contact_phone_public: phonePublic, pickup_details: pickup.trim() || null, description: description.trim(),
      image_urls: imageUrls, status: "available", moderation_status: "pending",
    });
    setBusy(false);
    if (error) { setNotice(error.message.includes("row-level security") ? "পোস্ট দিতে লগইন করা প্রয়োজন।" : "পোস্ট জমা হয়নি। প্রয়োজনীয় তথ্য ও ছবি যাচাই করে আবার চেষ্টা করুন।"); return; }
    setNotice("পোস্ট জমা হয়েছে! অ্যাডমিন অনুমোদনের পর ক্রেতারা এটি দেখতে পারবেন।");
    setShowForm(false); setMineOnly(true); setFiles([]);
    setSellerName(""); setCropName("ধান"); setVariety(""); setQuantity(""); setPrice(""); setDescription("");
    await loadListings();
  }

  async function updateMyStatus(item: HarvestListing, status: "available" | "sold_out" | "paused") {
    const { error } = await supabase.from("harvest_listings").update({ status }).eq("id", item.id).eq("owner_id", userId);
    setNotice(error ? "পোস্টের অবস্থা আপডেট হয়নি।" : "পোস্টের অবস্থা আপডেট হয়েছে।");
    if (!error) await loadListings();
  }

  return <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
    <header className="border-b border-emerald-950/10 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link href="/" className="text-xl font-black">AGRIVA<span className="text-amber-600">.</span></Link><div className="flex gap-2"><Link href="/marketplace" className="rounded-xl border px-3 py-2 text-sm font-bold">কৃষি উপকরণ</Link><Link href={userId ? "/dashboard" : "/login"} className="rounded-xl bg-emerald-800 px-3 py-2 text-sm font-bold text-white">{userId ? "আমার ড্যাশবোর্ড" : "লগইন"}</Link></div></div></header>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#103e2b] via-[#17603e] to-[#27764d] text-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-[1.15fr_.85fr] md:items-center"><div><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">কৃষক ↔ ক্রেতা, সরাসরি</span><h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">আপনার ফসল বিক্রি করুন <span className="text-lime-300">সরাসরি ক্রেতার কাছে</span></h1><p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">ফসলের ছবি, পরিমাণ ও দাম দিন। ক্রেতারা পোস্ট দেখে আপনার সঙ্গে যোগাযোগ করবেন। শুরুতে দাম, পরিবহন ও পেমেন্ট কৃষক-ক্রেতা সরাসরি ঠিক করবেন।</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => !userId ? window.location.assign("/login?next=%2Fsell-harvest") : setShowForm((v) => !v)} className="rounded-xl bg-lime-300 px-5 py-3 font-extrabold text-emerald-950">{showForm ? "ফর্ম বন্ধ করুন" : "＋ ফসল বিক্রির পোস্ট দিন"}</button><button onClick={() => { setMineOnly(false); document.getElementById("harvest-listings")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white">ফসল খুঁজুন ↓</button></div><p className="mt-4 text-xs text-emerald-100">প্রথমে অ্যাডমিন অনুমোদন • ফোন নম্বর প্রকাশে আপনার সম্মতি প্রয়োজন</p></div><div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl">🌾</p><p className="mt-3 font-extrabold">নিজের ফসল</p><p className="mt-1 text-xs text-emerald-100">ছবি ও সঠিক তথ্য দিন</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl">📍</p><p className="mt-3 font-extrabold">স্থানীয় ক্রেতা</p><p className="mt-1 text-xs text-emerald-100">জেলা অনুযায়ী খুঁজুন</p></div><div className="col-span-2 rounded-2xl bg-lime-300 p-4 text-emerald-950"><p className="font-black">কোনো অনলাইন পেমেন্ট নয়</p><p className="mt-1 text-sm">দরদাম, সংগ্রহ ও পেমেন্ট সরাসরি দুই পক্ষের মধ্যে।</p></div></div></div></div></section>

    {showForm && <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><form onSubmit={submitListing} className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">নতুন বিক্রির পোস্ট</p><h2 className="mt-2 text-2xl font-black">ফসলের তথ্য দিন</h2><p className="mt-2 text-sm text-slate-600">সব পোস্ট প্রথমে যাচাইয়ের জন্য যাবে। অনুমোদনের আগে এটি অন্য ক্রেতারা দেখতে পাবেন না।</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">বিক্রেতার নাম *<input required maxLength={100} value={sellerName} onChange={(e) => setSellerName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="আপনার নাম"/></label><label className="text-sm font-bold">ফসলের নাম *<input required maxLength={100} value={cropName} onChange={(e) => setCropName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: আমন ধান"/></label><label className="text-sm font-bold">জাত (ঐচ্ছিক)<input maxLength={100} value={variety} onChange={(e) => setVariety(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: BRRI ধান-৮৯"/></label><label className="text-sm font-bold">ফসলের মান<select value={quality} onChange={(e) => setQuality(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"><option>ভালো</option><option>উন্নত</option><option>সাধারণ</option><option>অর্গানিক (প্রমাণ থাকলে)</option></select></label>
      <label className="text-sm font-bold">পরিমাণ *<input required type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: 1000"/></label><label className="text-sm font-bold">পরিমাপের একক *<select value={unit} onChange={(e) => setUnit(e.target.value as HarvestListing["unit"])} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">{units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label><label className="text-sm font-bold">প্রতি এককের দাম (টাকা) *<input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: 35"/></label><label className="text-sm font-bold">সর্বনিম্ন অর্ডার (ঐচ্ছিক)<input type="number" min="0.01" step="0.01" value={minimumOrder} onChange={(e) => setMinimumOrder(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: 100 কেজি"/></label>
      <label className="text-sm font-bold">জেলা *<select value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">{districts.map((d) => <option key={d}>{d}</option>)}</select></label><label className="text-sm font-bold">উপজেলা<input maxLength={100} value={upazila} onChange={(e) => setUpazila(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="উপজেলার নাম"/></label><label className="text-sm font-bold">বিক্রির জন্য প্রস্তুতি<select value={ready} onChange={(e) => setReady(e.target.value as HarvestListing["harvest_ready"])} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"><option value="ready_now">এখনই প্রস্তুত</option><option value="within_7_days">৭ দিনের মধ্যে</option><option value="later">পরে প্রস্তুত হবে</option></select></label><label className="text-sm font-bold">যোগাযোগের ফোন নম্বর<input type="tel" required maxLength={25} value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="01XXXXXXXXX"/></label></div>
      <div className="grid gap-3 rounded-2xl bg-emerald-50/70 p-4 sm:grid-cols-2"><label className="flex items-start gap-3 text-sm"><input type="checkbox" required checked={phonePublic} onChange={(e) => setPhonePublic(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700"/><span><strong>আমি সম্মতি দিচ্ছি—আমার ফোন নম্বর অনুমোদিত পোস্টে প্রকাশ করা হবে *</strong><span className="mt-1 block text-xs leading-5 text-slate-600">ক্রেতারা সরাসরি যোগাযোগ করতে পারবেন। সম্মতি না দিলে এই সরাসরি-যোগাযোগ পোস্ট জমা দেওয়া যাবে না।</span></span></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700"/><span><strong>দাম আলোচনা সাপেক্ষে</strong><span className="mt-1 block text-xs text-slate-600">ক্রেতার সঙ্গে দরদাম করা যাবে।</span></span></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={transport} onChange={(e) => setTransport(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700"/><span><strong>পরিবহনের ব্যবস্থা আছে</strong></span></label></div>
      <label className="block text-sm font-bold">ফসলের ছবি * (১–৫টি, JPG/PNG/WEBP; প্রতিটি সর্বোচ্চ ৫ MB)<input type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={handleFiles} className="mt-2 block w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-800 file:px-3 file:py-2 file:font-bold file:text-white"/>{files.length > 0 && <span className="mt-2 block text-xs text-emerald-800">{files.length}টি ছবি বাছাই করা হয়েছে</span>}</label>
      <label className="block text-sm font-bold">ফসল সংগ্রহ / ডেলিভারির তথ্য<textarea maxLength={500} value={pickup} onChange={(e) => setPickup(e.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: খামার থেকে সংগ্রহ; পরিবহনের খরচ আলাদা"/></label><label className="block text-sm font-bold">অতিরিক্ত বিবরণ<textarea maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="ফসলের অবস্থা, কাটার তারিখ, আর্দ্রতা, প্যাকেজিং বা অন্য প্রয়োজনীয় তথ্য"/></label>
      {quantity && price && Number(quantity) > 0 && Number(price) >= 0 && <div className="rounded-xl bg-amber-50 p-4 text-sm"><span className="text-amber-900">আনুমানিক মোট মূল্য: </span><strong className="text-lg text-amber-950">৳{bn(Number(quantity) * Number(price))}</strong><span className="ml-2 text-amber-800">({bn(Number(quantity))} {unitLabel(unit)} × ৳{bn(Number(price))})</span></div>}
      {notice && <p role="status" className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{notice}</p>}<div className="flex flex-wrap gap-3"><button disabled={busy} type="submit" className="rounded-xl bg-emerald-800 px-6 py-3 font-extrabold text-white disabled:opacity-60">{busy ? "পোস্ট জমা হচ্ছে…" : "পোস্ট জমা দিন (অনুমোদনের জন্য)"}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-6 py-3 font-bold">বাতিল</button></div></form></section>}

    <section id="harvest-listings" className="mx-auto max-w-7xl scroll-mt-5 px-4 py-10 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">ফসলের বাজার</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{mineOnly ? "আমার বিক্রির পোস্ট" : "কৃষকের কাছ থেকে ফসল কিনুন"}</h2><p className="mt-2 text-sm text-slate-600">ছবি, দাম ও অবস্থান দেখে বিক্রেতার সঙ্গে সরাসরি যোগাযোগ করুন।</p></div><div className="flex flex-wrap gap-2">{userId && <button onClick={() => setMineOnly((v) => !v)} className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold">{mineOnly ? "সব ফসল দেখুন" : "আমার পোস্ট দেখুন"}</button>}<button onClick={() => !userId ? window.location.assign("/login?next=%2Fsell-harvest") : setShowForm(true)} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">＋ পোস্ট দিন</button></div></div>
      <div className="mt-6 grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4 sm:grid-cols-[1fr_1fr_1.5fr]"><label className="text-xs font-bold text-slate-600">ফসল<select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900">{crops.map((c) => <option key={c}>{c}</option>)}</select></label><label className="text-xs font-bold text-slate-600">জেলা<select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"><option>সব জেলা</option>{districts.map((d) => <option key={d}>{d}</option>)}</select></label><label className="text-xs font-bold text-slate-600">খুঁজুন<input value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal text-slate-900" placeholder="ফসল, জাত, জেলা বা বিবরণ"/></label></div>
      {notice && !showForm && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{notice}</p>}
      {loading ? <div className="py-16 text-center text-slate-500">ফসলের পোস্ট লোড হচ্ছে…</div> : visibleListings.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center"><p className="text-4xl">🌱</p><h3 className="mt-4 text-xl font-black">{mineOnly ? "আপনার কোনো পোস্ট নেই" : "এখনো কোনো অনুমোদিত পোস্ট নেই"}</h3><p className="mt-2 text-sm text-slate-600">{mineOnly ? "প্রথম ফসল বিক্রির পোস্টটি দিন।" : "কৃষকের নতুন পোস্ট অনুমোদিত হলে এখানে দেখা যাবে।"}</p><button onClick={() => userId ? setShowForm(true) : window.location.assign("/login?next=%2Fsell-harvest")} className="mt-5 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">ফসল বিক্রির পোস্ট দিন</button></div> : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleListings.map((item) => <article key={item.id} className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative aspect-[4/3] bg-emerald-50">{item.image_urls[0] ? <img src={item.image_urls[0]} alt={item.crop_name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-5xl">🌾</div>}{item.image_urls.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">＋{bn(item.image_urls.length - 1)} ছবি</span>}{item.moderation_status !== "approved" && <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{item.moderation_status === "pending" ? "অনুমোদনের অপেক্ষায়" : "অনুমোদিত নয়"}</span>}</div>{item.image_urls.length > 1 && <div className="flex gap-2 overflow-x-auto px-5 pt-3">{item.image_urls.slice(1).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={item.crop_name + " ছবি " + (index + 2)}><img src={url} alt={item.crop_name + " ছবি " + (index + 2)} className="h-16 w-20 rounded-lg border object-cover"/></a>)}</div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{item.crop_name}</h3>{item.variety && <p className="mt-1 text-xs text-slate-500">জাত: {item.variety}</p>}</div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{item.quality || "ফসল"}</span></div><p className="mt-3 text-2xl font-black text-emerald-800">৳{bn(Number(item.price_per_unit))}<span className="text-sm font-semibold text-slate-500"> / {unitLabel(item.unit)}</span></p><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">পরিমাণ</span><strong>{bn(Number(item.quantity))} {unitLabel(item.unit)}</strong></p><p className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">অবস্থান</span><strong>{item.upazila ? item.upazila + ", " : ""}{item.district}</strong></p></div><p className="mt-3 text-sm text-slate-600">{readyLabel(item.harvest_ready)}{item.negotiable ? " · দাম আলোচনা সাপেক্ষে" : ""}{item.transport_available ? " · পরিবহন আছে" : ""}{item.minimum_order ? " · সর্বনিম্ন অর্ডার " + bn(Number(item.minimum_order)) + " " + unitLabel(item.unit) : ""}</p>{item.pickup_details && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950"><strong>সংগ্রহ / ডেলিভারি:</strong> {item.pickup_details}</p>}{item.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>}<p className="mt-3 text-xs text-slate-400">বিক্রেতা: {item.seller_name} · {new Date(item.created_at).toLocaleDateString("bn-BD")}</p>{mineOnly && item.owner_id === userId ? <div className="mt-4 flex flex-wrap gap-2">{item.status !== "sold_out" ? <button onClick={() => void updateMyStatus(item, "sold_out")} className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900">বিক্রি শেষ</button> : <button onClick={() => void updateMyStatus(item, "available")} className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900">আবার চালু করুন</button>}{item.status === "paused" ? <button onClick={() => void updateMyStatus(item, "available")} className="rounded-xl border px-3 py-2 text-xs font-bold">পোস্ট চালু করুন</button> : item.status === "available" && <button onClick={() => void updateMyStatus(item, "paused")} className="rounded-xl border px-3 py-2 text-xs font-bold">সাময়িক বন্ধ</button>}</div> : item.contact_phone_public && item.contact_phone ? <div className="mt-4 flex gap-2"><a href={`tel:${item.contact_phone}`} className="flex-1 rounded-xl bg-emerald-800 px-3 py-3 text-center text-sm font-extrabold text-white">☎ কল করুন</a><a href={`https://wa.me/${item.contact_phone.replace(/\D/g, "").replace(/^0/, "88")}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-emerald-200 px-3 py-3 text-center text-sm font-extrabold text-emerald-800">WhatsApp</a></div> : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">যোগাযোগের নম্বর প্রকাশ করা হয়নি। AGRIVA-তে মেসেজ ফিচার পরে যোগ করা যাবে।</p>}</div></article>)}</div>}
      <p className="mt-8 text-center text-xs leading-6 text-slate-500">AGRIVA পোস্টের তথ্য যাচাইয়ের চেষ্টা করে, তবে ফসলের মান, পরিমাণ, দাম, পরিচয় বা লেনদেনের নিশ্চয়তা দেয় না। পণ্য সংগ্রহ, পেমেন্ট ও পরিবহনের শর্ত সরাসরি নিশ্চিত করুন।</p>
    </section>
  </main>;
}
