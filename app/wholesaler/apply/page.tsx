"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Application = { status: string; business_name: string; district: string; created_at: string };
const statusLabel: Record<string, string> = {
  pending: "আবেদন জমা হয়েছে", under_review: "যাচাই চলছে", approved: "অনুমোদিত", rejected: "অনুমোদিত হয়নি",
};
export default function WholesalerApplyPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [categories, setCategories] = useState("");
  const [serviceDistricts, setServiceDistricts] = useState("");
  const [capacity, setCapacity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?next=/wholesaler/apply"; return; }
      if (!active) return;
      setUserId(user.id);
      const { data, error } = await supabase.from("bulk_wholesaler_applications")
        .select("status,business_name,district,created_at").eq("user_id", user.id).maybeSingle();
      if (error && !error.message.toLowerCase().includes("does not exist")) setMessage("আবেদনের তথ্য লোড করা যায়নি।");
      if (data) {
        const row = data as Application;
        setApplication(row);
        setBusinessName(row.business_name);
        setDistrict(row.district);
      }
      setLoading(false);
    }
    void init();
    return () => { active = false; };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setSaving(true); setMessage("");
    const { error } = await supabase.from("bulk_wholesaler_applications").upsert({
      user_id: userId, business_name: businessName.trim(), contact_name: contactName.trim(),
      phone: phone.trim(), business_address: address.trim(), district: district.trim(),
      product_categories: categories.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20),
      service_districts: serviceDistricts.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 64),
      monthly_capacity: capacity ? Number(capacity) : null, note: note.trim(), status: "pending",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) setMessage("আবেদন জমা হয়নি। সব তথ্য যাচাই করুন; আগে আবেদন করে থাকলে সেটি যাচাইাধীন থাকতে পারে।");
    else {
      setApplication({ status: "pending", business_name: businessName.trim(), district: district.trim(), created_at: new Date().toISOString() });
      setMessage("আপনার আবেদন জমা হয়েছে। AGRIVA টিম যাচাই করে জানাবে।");
    }
    setSaving(false);
  }

  return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6">
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800"><ArrowLeft size={16}/> ড্যাশবোর্ডে ফিরুন</Link>
      <header className="mt-6 rounded-3xl bg-[#123f30] p-6 text-white sm:p-8"><span className="inline-flex rounded-xl bg-white/10 p-3"><Building2 size={25}/></span><h1 className="mt-4 text-3xl font-black">AGRIVA Wholesaler Network</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">পাইকারি ক্রেতা হিসেবে নিবন্ধন করুন। যাচাই সম্পন্ন হলে আপনার পণ্য ও এলাকার সঙ্গে মেলে এমন bulk demand এবং quotation invitation পাবেন।</p><p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-lime-200"><ShieldCheck size={15}/> আবেদন করলেই verified status পাওয়া যায় না</p></header>
      {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {application && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4"><CheckCircle2 className="mt-0.5 text-emerald-700" size={20}/><div><p className="font-bold">{statusLabel[application.status] ?? application.status}</p><p className="mt-1 text-sm text-[#647568]">{application.business_name} • {application.district}</p><p className="mt-1 text-xs text-[#718174]">অনুমোদন না হওয়া পর্যন্ত quotation বা verified wholesaler সুবিধা চালু হবে না।</p></div></div>}
      {loading ? <p className="mt-8 text-sm">তথ্য লোড হচ্ছে…</p> : <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl border border-[#e1e9df] bg-white p-5 shadow-sm sm:p-8">
        <div><h2 className="text-xl font-black">ব্যবসার তথ্য</h2><p className="mt-1 text-sm text-[#6a7b6e]">সঠিক তথ্য দিন; AGRIVA টিম প্রয়োজনে যোগাযোগ করবে।</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">প্রতিষ্ঠান / ব্যবসার নাম *<input required maxLength={120} value={businessName} onChange={(e)=>setBusinessName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"/></label>
          <label className="text-sm font-bold">যোগাযোগকারীর নাম *<input required maxLength={100} value={contactName} onChange={(e)=>setContactName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"/></label>
          <label className="text-sm font-bold">মোবাইল নম্বর *<input required type="tel" minLength={7} maxLength={24} value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="01XXXXXXXXX"/></label>
          <label className="text-sm font-bold">ব্যবসার জেলা *<input required maxLength={80} value={district} onChange={(e)=>setDistrict(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: ঢাকা"/></label>
        </div>
        <label className="block text-sm font-bold">ব্যবসার ঠিকানা *<textarea required maxLength={300} value={address} onChange={(e)=>setAddress(e.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"/></label>
        <label className="block text-sm font-bold">কোন পণ্য / ফসল কেনেন? *<input required value={categories} onChange={(e)=>setCategories(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="ধান, চাল, আলু, পেঁয়াজ (কমা দিয়ে লিখুন)"/></label>
        <label className="block text-sm font-bold">যেসব জেলায় সংগ্রহ করেন<input value={serviceDistricts} onChange={(e)=>setServiceDistricts(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="ঢাকা, গাজীপুর, মানিকগঞ্জ (ফাঁকা রাখলে সব জেলা)"/></label>
        <label className="block text-sm font-bold">মাসিক ক্রয়ক্ষমতা (ঐচ্ছিক)<input type="number" min="1" step="0.01" value={capacity} onChange={(e)=>setCapacity(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="পরিমাণ লিখুন"/></label>
        <label className="block text-sm font-bold">অতিরিক্ত তথ্য (ঐচ্ছিক)<textarea maxLength={1000} rows={3} value={note} onChange={(e)=>setNote(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="আপনার ক্রয়, পরিবহন বা পেমেন্ট সক্ষমতা সম্পর্কে লিখুন"/></label>
        <button disabled={saving || (application?.status === "approved")} className="w-full rounded-xl bg-[#126b4f] px-5 py-3.5 font-extrabold text-white hover:bg-[#0b563e] disabled:opacity-50">{saving ? "জমা হচ্ছে…" : application ? "আবেদন আপডেট করুন" : "যাচাইয়ের জন্য আবেদন জমা দিন"}</button>
        <p className="text-xs leading-5 text-[#718174]">আপনার দেওয়া ফোন নম্বর ও ব্যবসার তথ্য শুধু আবেদন যাচাইয়ের জন্য ব্যবহার করা হবে। অনুমোদন AGRIVA প্রশাসনিক যাচাইয়ের ওপর নির্ভরশীল।</p>
      </form>}
    </div>
  </main>;
}
