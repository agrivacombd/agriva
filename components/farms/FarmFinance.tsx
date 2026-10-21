"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Farm = { id: string; name: string };
type CropCycle = { id: string; farm_id: string; crop_name: string; season_name: string | null };
type LedgerItem = { id: string; farm_id: string; crop_cycle_id: string | null; description: string; amount: number; expense_date?: string; sale_date?: string; category?: string; notes: string | null };
const categories = [
  ["seed", "বীজ"], ["fertilizer", "সার"], ["pesticide", "কীটনাশক"], ["labor", "শ্রমিক"],
  ["irrigation", "সেচ"], ["machinery", "যন্ত্রপাতি"], ["transport", "পরিবহন"], ["other", "অন্যান্য"],
] as const;
const money = (value: number) => new Intl.NumberFormat("bn-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(value);

export default function FarmFinance() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [farmId, setFarmId] = useState("");
  const [expenses, setExpenses] = useState<LedgerItem[]>([]);
  const [sales, setSales] = useState<LedgerItem[]>([]);
  const [kind, setKind] = useState<"expense" | "sale">("expense");
  const [category, setCategory] = useState("seed");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cycleId, setCycleId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.replace("/login?next=/farms"); return; }
    const { data: farmRows, error: farmError } = await supabase.from("farms").select("id,name").order("created_at", { ascending: false });
    if (farmError) { setMessage("খামারের তথ্য লোড করা যায়নি।"); setLoading(false); return; }
    const fs = (farmRows || []) as Farm[];
    setFarms(fs);
    const chosen = fs[0]?.id || "";
    setFarmId(current => fs.some(f => f.id === current) ? current : chosen);
    if (fs.length) {
      const ids = fs.map(f => f.id);
      const [cycleResult, expenseResult, salesResult] = await Promise.all([
        supabase.from("crop_cycles").select("id,farm_id,crop_name,season_name").in("farm_id", ids),
        supabase.from("farm_expenses").select("id,farm_id,crop_cycle_id,description,amount,expense_date,category,notes").in("farm_id", ids).order("expense_date", { ascending: false }).limit(300),
        supabase.from("farm_sales").select("id,farm_id,crop_cycle_id,description,amount,sale_date,notes").in("farm_id", ids).order("sale_date", { ascending: false }).limit(300),
      ]);
      if (cycleResult.error) setMessage("ফসলের তালিকা লোড হয়নি—মাইগ্রেশন ০১৯ যাচাই করুন।");
      else setCycles((cycleResult.data || []) as CropCycle[]);
      if (expenseResult.error || salesResult.error) setMessage("হিসাবের টেবিল পাওয়া যাচ্ছে না। Supabase-এ migration 020 চালু করুন।");
      setExpenses((expenseResult.data || []) as unknown as LedgerItem[]);
      setSales((salesResult.data || []) as unknown as LedgerItem[]);
    } else { setCycles([]); setExpenses([]); setSales([]); }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { void load(); }, [load]);

  const farmExpenses = useMemo(() => expenses.filter(x => x.farm_id === farmId), [expenses, farmId]);
  const farmSales = useMemo(() => sales.filter(x => x.farm_id === farmId), [sales, farmId]);
  const expenseTotal = farmExpenses.reduce((sum, x) => sum + Number(x.amount), 0);
  const salesTotal = farmSales.reduce((sum, x) => sum + Number(x.amount), 0);
  const cropCycles = cycles.filter(x => x.farm_id === farmId);

  async function addRecord(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!farmId) { setMessage("আগে একটি খামার যোগ করুন।"); return; }
    if (!description.trim()) { setMessage("বিবরণ লিখুন।"); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setMessage("টাকার পরিমাণ শূন্যের বেশি দিন।"); return; }
    setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); router.replace("/login?next=/farms"); return; }
    const table = kind === "expense" ? "farm_expenses" : "farm_sales";
    const payload = kind === "expense"
      ? { farm_id: farmId, crop_cycle_id: cycleId || null, owner_id: user.id, category, description: description.trim(), amount: numericAmount, expense_date: date, notes: notes.trim() || null }
      : { farm_id: farmId, crop_cycle_id: cycleId || null, owner_id: user.id, description: description.trim(), amount: numericAmount, sale_date: date, notes: notes.trim() || null };
    const { data, error } = await supabase.from(table).insert(payload).select(kind === "expense"
      ? "id,farm_id,crop_cycle_id,description,amount,expense_date,category,notes"
      : "id,farm_id,crop_cycle_id,description,amount,sale_date,notes").single();
    setBusy(false);
    if (error) { setMessage("হিসাব সংরক্ষণ হয়নি। Supabase migration 020 চালু আছে কি না দেখুন।"); return; }
    if (kind === "expense") setExpenses(current => [data as LedgerItem, ...current]);
    else setSales(current => [data as LedgerItem, ...current]);
    setDescription(""); setAmount(""); setNotes("");
    setMessage(kind === "expense" ? "খরচ সংরক্ষণ হয়েছে।" : "বিক্রির আয় সংরক্ষণ হয়েছে।");
  }

  return <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Farm finance</p><h2 className="mt-2 text-xl font-black">খরচ ও লাভের হিসাব</h2><p className="mt-1 text-sm leading-6 text-slate-500">নিজের দেওয়া খরচ ও বিক্রির তথ্য থেকে হিসাব—এগুলো বাজারদর বা অনুমান নয়।</p></div>
      <select aria-label="হিসাবের খামার" value={farmId} onChange={e => { setFarmId(e.target.value); setCycleId(""); }} disabled={!farms.length} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">খামার নির্বাচন</option>{farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
    </div>
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {loading ? <p className="mt-4 text-sm text-slate-500">হিসাব লোড হচ্ছে…</p> : <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-800">মোট খরচ</p><p className="mt-1 text-xl font-black text-rose-950">{money(expenseTotal)}</p></div>
        <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-800">মোট বিক্রি</p><p className="mt-1 text-xl font-black text-emerald-950">{money(salesTotal)}</p></div>
        <div className={`rounded-2xl p-4 ${salesTotal - expenseTotal >= 0 ? "bg-lime-50" : "bg-amber-50"}`}><p className="text-sm font-semibold text-slate-700">নিট ফল (বিক্রি − খরচ)</p><p className="mt-1 text-xl font-black text-slate-950">{money(salesTotal - expenseTotal)}</p></div>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setKind("expense")} className={`rounded-xl px-4 py-2 text-sm font-bold ${kind === "expense" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700"}`}>খরচ যোগ</button><button type="button" onClick={() => setKind("sale")} className={`rounded-xl px-4 py-2 text-sm font-bold ${kind === "sale" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700"}`}>বিক্রির আয় যোগ</button></div>
        <form onSubmit={addRecord} className="mt-4 grid gap-4 sm:grid-cols-2">
          {kind === "expense" && <label className="block text-sm font-bold">খরচের ধরন<select value={category} onChange={e => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{categories.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
          <label className="block text-sm font-bold">বিবরণ<input required maxLength={160} value={description} onChange={e => setDescription(e.target.value)} placeholder={kind === "expense" ? "যেমন: ইউরিয়া সার" : "যেমন: ধান বিক্রি"} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
          <label className="block text-sm font-bold">টাকার পরিমাণ (৳)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="যেমন: 2500" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
          <label className="block text-sm font-bold">তারিখ<input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
          <label className="block text-sm font-bold">ফসল/মৌসুম (ঐচ্ছিক)<select value={cycleId} onChange={e => setCycleId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option value="">সামগ্রিক খামার</option>{cropCycles.map(c => <option key={c.id} value={c.id}>{c.crop_name}{c.season_name ? " · " + c.season_name : ""}</option>)}</select></label>
          <label className="block text-sm font-bold sm:col-span-2">নোট (ঐচ্ছিক)<textarea maxLength={1000} rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="অতিরিক্ত তথ্য" /></label>
          <button disabled={busy || !farmId} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? "সংরক্ষণ হচ্ছে…" : kind === "expense" ? "খরচ সংরক্ষণ করুন" : "বিক্রির আয় সংরক্ষণ করুন"}</button>
        </form>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div><h3 className="font-extrabold">সাম্প্রতিক খরচ</h3>{!farmExpenses.length ? <p className="mt-2 text-sm text-slate-500">এখনো কোনো খরচ যোগ করা হয়নি।</p> : <ul className="mt-2 space-y-2">{farmExpenses.slice(0, 8).map(item => <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-bold">{item.description}</p><p className="mt-1 text-xs text-slate-500">{categories.find(([value]) => value === item.category)?.[1] || "খরচ"} · {item.expense_date}</p></div><span className="whitespace-nowrap text-sm font-extrabold">{money(Number(item.amount))}</span></li>)}</ul>}</div>
        <div><h3 className="font-extrabold">সাম্প্রতিক বিক্রি</h3>{!farmSales.length ? <p className="mt-2 text-sm text-slate-500">এখনো কোনো বিক্রির আয় যোগ করা হয়নি।</p> : <ul className="mt-2 space-y-2">{farmSales.slice(0, 8).map(item => <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-bold">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.sale_date}</p></div><span className="whitespace-nowrap text-sm font-extrabold">{money(Number(item.amount))}</span></li>)}</ul>}</div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">নিট ফল = রেকর্ড করা বিক্রির আয় − রেকর্ড করা খরচ। পরিবারের শ্রম, জমিভাড়া, ঋণের সুদ বা অনথিভুক্ত খরচ বাদ থাকলে এটি প্রকৃত লাভের চেয়ে বেশি দেখাতে পারে।</p>
    </>}
  </section>;
}
