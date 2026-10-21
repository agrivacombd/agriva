"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Farm = { id: string; name: string; district: string | null; area_acres: number | null; created_at: string };
type DiaryEntry = { id: string; farm_id: string; activity: string; entry_date: string; created_at: string };
type CropCycle = { id: string; farm_id: string; crop_name: string; variety: string | null; season_name: string | null; sowing_date: string | null; expected_harvest_date: string | null; status: "planned" | "growing" | "harvested" | "cancelled"; notes: string | null; created_at: string };

export default function FarmWorkspace() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [activity, setActivity] = useState("");
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [cropName, setCropName] = useState("");
  const [cropVariety, setCropVariety] = useState("");
  const [cropSeason, setCropSeason] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [cropNotes, setCropNotes] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.replace("/login?next=/farms");
      return;
    }
    const { data, error } = await supabase
      .from("farms")
      .select("id,name,district,area_acres,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("Farm data could not be loaded. Please check your database setup and try again.");
      setLoading(false);
      return;
    }
    const list = (data || []) as Farm[];
    setFarms(list);
    setSelectedFarm(current => list.some(farm => farm.id === current) ? current : (list[0]?.id || ""));
    if (list.length) {
      const { data: cycles, error: cyclesError } = await supabase.from("crop_cycles").select("id,farm_id,crop_name,variety,season_name,sowing_date,expected_harvest_date,status,notes,created_at").in("farm_id", list.map(farm => farm.id)).order("created_at", { ascending: false });
      if (!cyclesError) setCropCycles((cycles || []) as CropCycle[]);
      const { data: diary, error: diaryError } = await supabase
        .from("farm_diary")
        .select("id,farm_id,activity,entry_date,created_at")
        .in("farm_id", list.map(farm => farm.id))
        .order("entry_date", { ascending: false })
        .limit(50);
      if (!diaryError) setEntries((diary || []) as DiaryEntry[]);
    } else {
      setEntries([]);
      setCropCycles([]);
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function addFarm(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login?next=/farms");
      return;
    }
    const acres = area.trim() ? Number(area) : null;
    if (acres !== null && (!Number.isFinite(acres) || acres < 0)) {
      setMessage("Please enter a valid land area.");
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.from("farms").insert({
      owner_id: user.id,
      name: name.trim(),
      district: district.trim() || null,
      area_acres: acres,
    }).select("id,name,district,area_acres,created_at").single();
    setBusy(false);
    if (error) {
      setMessage("Could not save this farm. Please check the details and try again.");
      return;
    }
    setFarms(current => [data as Farm, ...current]);
    setSelectedFarm(data.id);
    setName("");
    setDistrict("");
    setArea("");
    setMessage("Farm saved successfully.");
  }

  async function addEntry(event: FormEvent) {
    event.preventDefault();
    if (!selectedFarm) {
      setMessage("Add a farm first, then record an activity.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login?next=/farms");
      return;
    }
    const { data, error } = await supabase.from("farm_diary").insert({
      farm_id: selectedFarm,
      owner_id: user.id,
      activity: activity.trim(),
      entry_date: entryDate,
    }).select("id,farm_id,activity,entry_date,created_at").single();
    setBusy(false);
    if (error) {
      setMessage("Could not save the farm diary entry. Please try again.");
      return;
    }
    setEntries(current => [data as DiaryEntry, ...current].sort((a, b) => b.entry_date.localeCompare(a.entry_date)));
    setActivity("");
    setMessage("Farm activity recorded.");
  }

  async function addCropCycle(event: FormEvent) {
    event.preventDefault();
    if (!selectedFarm) { setMessage("Add a farm first, then record a crop season."); return; }
    if (sowingDate && harvestDate && harvestDate < sowingDate) { setMessage("Expected harvest date must be on or after the sowing date."); return; }
    setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login?next=/farms"); return; }
    const { data, error } = await supabase.from("crop_cycles").insert({
      farm_id: selectedFarm, owner_id: user.id, crop_name: cropName.trim(),
      variety: cropVariety.trim() || null, season_name: cropSeason.trim() || null,
      sowing_date: sowingDate || null, expected_harvest_date: harvestDate || null,
      notes: cropNotes.trim() || null, status: sowingDate ? "growing" : "planned",
    }).select("id,farm_id,crop_name,variety,season_name,sowing_date,expected_harvest_date,status,notes,created_at").single();
    setBusy(false);
    if (error) { setMessage("Could not save the crop season. Confirm migration 019 is applied and try again."); return; }
    setCropCycles(current => [data as CropCycle, ...current]);
    setCropName(""); setCropVariety(""); setCropSeason(""); setSowingDate(""); setHarvestDate(""); setCropNotes("");
    setMessage("Crop season saved.");
  }

  async function updateCropStatus(cycle: CropCycle, status: CropCycle["status"]) {
    setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login?next=/farms"); return; }
    const { error } = await supabase.from("crop_cycles").update({ status, updated_at: new Date().toISOString() }).eq("id", cycle.id);
    setBusy(false);
    if (error) { setMessage("Crop status could not be updated. Please try again."); return; }
    setCropCycles(current => current.map(item => item.id === cycle.id ? { ...item, status } : item));
    setMessage("Crop status updated.");
  }

  async function deleteFarm(farm: Farm) {
    if (!window.confirm(`Delete “${farm.name}” and its farm diary records?`)) return;
    setBusy(true);
    const { error } = await supabase.from("farms").delete().eq("id", farm.id);
    setBusy(false);
    if (error) {
      setMessage("Farm could not be deleted. Please try again.");
      return;
    }
    setFarms(current => current.filter(item => item.id !== farm.id));
    setEntries(current => current.filter(item => item.farm_id !== farm.id));
    setCropCycles(current => current.filter(item => item.farm_id !== farm.id));
    setSelectedFarm(current => current === farm.id ? (farms.find(item => item.id !== farm.id)?.id || "") : current);
    setMessage("Farm deleted.");
  }

  const activeFarm = farms.find(farm => farm.id === selectedFarm);

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <header className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-black tracking-tight">AGRIVA<span className="text-amber-600">.</span></Link>
          <nav className="flex items-center gap-4 text-sm font-semibold"><Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link><Link href="/tools" className="hover:text-emerald-700">Farm tools</Link></nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">My Farm · Farm Intelligence</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">আপনার খামার, আপনার হিসাব</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">জমির তথ্য রাখুন, মাঠের কাজের ডায়েরি লিখুন, আর মৌসুমজুড়ে কী করেছেন তা এক জায়গা থেকে দেখুন।</p></div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-3"><span className="text-sm text-slate-500">My farms</span><p className="text-2xl font-black">{farms.length}</p></div>
        </div>
        {message && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
        {loading ? <div className="mt-8 rounded-2xl bg-white p-8 text-slate-600">Loading your farm workspace…</div> : <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black">নতুন জমি/খামার যোগ করুন</h2><p className="mt-1 text-sm text-slate-500">শুধু প্রয়োজনীয় তথ্য দিন—পরে আরও বিস্তারিত যোগ করা যাবে।</p>
              <form onSubmit={addFarm} className="mt-5 space-y-4">
                <label className="block text-sm font-bold">খামারের নাম<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: বাড়ির পাশের জমি" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block text-sm font-bold">জেলা<input maxLength={100} value={district} onChange={e => setDistrict(e.target.value)} placeholder="যেমন: নওগাঁ" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block text-sm font-bold">জমির পরিমাণ (একর)<input type="number" min="0" step="0.01" value={area} onChange={e => setArea(e.target.value)} placeholder="যেমন: 1.50" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                <button disabled={busy} className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? "সংরক্ষণ হচ্ছে…" : "খামার সংরক্ষণ করুন"}</button>
              </form>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black">আপনার জমির তালিকা</h2>
              {!farms.length ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">এখনো কোনো জমি যোগ করা হয়নি। উপরের ফর্ম থেকে প্রথম জমিটি যোগ করুন।</p> : <div className="mt-4 space-y-3">{farms.map(farm => <div key={farm.id} className={`rounded-2xl border p-4 ${selectedFarm === farm.id ? "border-emerald-400 bg-emerald-50/70" : "border-slate-200"}`}><button type="button" onClick={() => setSelectedFarm(farm.id)} className="w-full text-left"><span className="font-extrabold">{farm.name}</span><span className="mt-1 block text-sm text-slate-600">{[farm.district, farm.area_acres !== null ? `${farm.area_acres} একর` : null].filter(Boolean).join(" · ") || "অতিরিক্ত তথ্য যোগ করা হয়নি"}</span></button><button type="button" disabled={busy} onClick={() => void deleteFarm(farm)} className="mt-3 text-xs font-bold text-rose-700 underline underline-offset-2 disabled:opacity-50">এই জমি মুছুন</button></div>)}</div>}
            </section>
          </div>
          <div className="space-y-6">
            <section className="rounded-3xl bg-[#124c35] p-5 text-white shadow-sm sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-200">Farm diary</p><h2 className="mt-2 text-2xl font-black">আজ মাঠে কী কাজ করলেন?</h2><p className="mt-2 text-sm leading-6 text-emerald-50/75">সেচ, সার প্রয়োগ, বীজ বপন, রোগ-পোকা, শ্রমিক খরচ বা পর্যবেক্ষণ লিখে রাখুন।</p>
              <form onSubmit={addEntry} className="mt-5 space-y-4">
                <label className="block text-sm font-bold">কোন জমি?<select required value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-slate-900" disabled={!farms.length}><option value="">জমি নির্বাচন করুন</option>{farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label>
                <label className="block text-sm font-bold">কাজের তারিখ<input required type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-slate-900" /></label>
                <label className="block text-sm font-bold">কাজ/পর্যবেক্ষণের বিবরণ<textarea required minLength={1} maxLength={2000} rows={4} value={activity} onChange={e => setActivity(e.target.value)} placeholder="যেমন: সকালে ধানের জমিতে সেচ দিয়েছি…" className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200" /></label>
                <button disabled={busy || !farms.length} className="w-full rounded-xl bg-lime-300 px-5 py-3 font-extrabold text-emerald-950 disabled:opacity-50">{busy ? "সংরক্ষণ হচ্ছে…" : "ডায়েরিতে যোগ করুন"}</button>
              </form>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Crop lifecycle</p>
              <h2 className="mt-2 text-xl font-black">ফসল ও মৌসুম যোগ করুন</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">বপনের তারিখ থেকে সম্ভাব্য কাটার সময় পর্যন্ত ফসলের পরিকল্পনা রাখুন।</p>
              <form onSubmit={addCropCycle} className="mt-5 space-y-4">
                <label className="block text-sm font-bold">কোন জমিতে?<select required value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" disabled={!farms.length}><option value="">জমি নির্বাচন করুন</option>{farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label>
                <label className="block text-sm font-bold">ফসলের নাম<input required maxLength={100} value={cropName} onChange={e => setCropName(e.target.value)} placeholder="যেমন: আমন ধান" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold">জাত<input maxLength={100} value={cropVariety} onChange={e => setCropVariety(e.target.value)} placeholder="ফসলের জাত (ঐচ্ছিক)" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
                  <label className="block text-sm font-bold">মৌসুম<select value={cropSeason} onChange={e => setCropSeason(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">নির্বাচন করুন</option><option value="Aus">আউশ</option><option value="Aman">আমন</option><option value="Boro">বোরো</option><option value="Rabi">রবি</option><option value="Kharif">খরিফ</option><option value="Other">অন্যান্য</option></select></label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold">বপন/রোপণের তারিখ<input type="date" value={sowingDate} onChange={e => setSowingDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
                  <label className="block text-sm font-bold">সম্ভাব্য কাটার তারিখ<input type="date" min={sowingDate || undefined} value={harvestDate} onChange={e => setHarvestDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
                </div>
                <label className="block text-sm font-bold">নোট<textarea maxLength={2000} rows={2} value={cropNotes} onChange={e => setCropNotes(e.target.value)} placeholder="জমির অবস্থা বা পরিকল্পনা (ঐচ্ছিক)" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
                <button disabled={busy || !farms.length} className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "সংরক্ষণ হচ্ছে…" : "ফসলের মৌসুম সংরক্ষণ করুন"}</button>
              </form>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">আপনার ফসলের তালিকা</h2><span className="text-xs font-bold text-slate-500">{cropCycles.length}টি</span></div>
              {!cropCycles.length ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">এখনো কোনো ফসল যোগ করা হয়নি। ফসলের নাম দিয়ে প্রথম মৌসুমটি সংরক্ষণ করুন।</p> : <div className="mt-4 space-y-3">{cropCycles.map(cycle => <article key={cycle.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold">{cycle.crop_name}{cycle.variety ? <span className="font-normal text-slate-500"> · {cycle.variety}</span> : null}</h3><p className="mt-1 text-xs text-slate-500">{farms.find(farm => farm.id === cycle.farm_id)?.name || "আমার জমি"}{cycle.season_name ? " · " + cycle.season_name : ""}</p></div><select aria-label={cycle.crop_name + " status"} value={cycle.status} disabled={busy} onChange={e => void updateCropStatus(cycle, e.target.value as CropCycle["status"])} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold"><option value="planned">পরিকল্পিত</option><option value="growing">বাড়ছে</option><option value="harvested">কাটা হয়েছে</option><option value="cancelled">বাতিল</option></select></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p className="text-slate-600">বপন: <strong className="text-slate-900">{cycle.sowing_date || "দেওয়া হয়নি"}</strong></p><p className="text-slate-600">সম্ভাব্য কাটার সময়: <strong className="text-slate-900">{cycle.expected_harvest_date || "দেওয়া হয়নি"}</strong></p></div>{cycle.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{cycle.notes}</p> : null}</article>)}</div>}
            </section>

              <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">সাম্প্রতিক মাঠের কাজ</h2><span className="text-xs font-bold text-slate-500">{entries.length}টি নোট</span></div>
              {!entries.length ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">কোনো ডায়েরি নোট নেই। আপনার প্রথম মাঠের কাজটি লিখে রাখুন।</p> : <div className="mt-4 space-y-3">{entries.map(entry => <article key={entry.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-emerald-700">{farms.find(farm => farm.id === entry.farm_id)?.name || activeFarm?.name || "আমার জমি"}</span><time className="text-xs text-slate-500" dateTime={entry.entry_date}>{entry.entry_date}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{entry.activity}</p></article>)}</div>}
            </section>
          </div>
        </div>}
      </section>
    </main>
  );
}
