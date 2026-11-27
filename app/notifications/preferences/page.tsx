"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Preferences = {
  in_app_enabled: boolean;
  matching_harvest_enabled: boolean;
  matching_demand_enabled: boolean;
  demand_response_enabled: boolean;
  inquiry_enabled: boolean;
  wholesale_enabled: boolean;
  digest_enabled: boolean;
};
const defaults: Preferences = {
  in_app_enabled: true, matching_harvest_enabled: true, matching_demand_enabled: true,
  demand_response_enabled: true, inquiry_enabled: true, wholesale_enabled: true, digest_enabled: false,
};
const options: { key: keyof Preferences; title: string; description: string }[] = [
  { key: "in_app_enabled", title: "In-app notification", description: "AGRIVA dashboard-এর notification center চালু রাখুন।" },
  { key: "matching_harvest_enabled", title: "মিল থাকা ফসলের পোস্ট", description: "আপনার buyer demand-এর সঙ্গে ফসল মিললে জানান।" },
  { key: "matching_demand_enabled", title: "মিল থাকা buyer demand", description: "আপনার ফসলের এলাকার ক্রেতার চাহিদা এলে জানান।" },
  { key: "demand_response_enabled", title: "চাহিদায় নতুন সাড়া", description: "আপনার প্রকাশিত চাহিদায় কৃষক সাড়া দিলে জানান।" },
  { key: "inquiry_enabled", title: "ক্রেতার যোগাযোগের আগ্রহ", description: "আপনার ফসলের পোস্টে কেউ কল বা WhatsApp করলে জানান।" },
  { key: "wholesale_enabled", title: "পাইকারি ও wholesaler আপডেট", description: "Bulk demand, invitation, quotation ও application status জানান।" },
  { key: "digest_enabled", title: "সাপ্তাহিক সারাংশ", description: "সাপ্তাহিক marketplace activity summary (পরবর্তী ধাপে চালু হবে)।" },
];
export default function NotificationPreferencesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [values, setValues] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?next=/notifications/preferences"; return; }
      if (!active) return;
      setUserId(user.id);
      const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (error) setMessage("পছন্দের তথ্য লোড করা যায়নি।");
      else if (data) {
        const row = data as Partial<Preferences>;
        setValues({ ...defaults, ...row });
      } else {
        const { error: insertError } = await supabase.from("notification_preferences").insert({ user_id: user.id });
        if (insertError) setMessage("নোটিফিকেশন সেটিংস তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [supabase]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setSaving(true); setMessage("");
    const { error } = await supabase.from("notification_preferences").update({ ...values, updated_at: new Date().toISOString() }).eq("user_id", userId);
    setMessage(error ? "সেটিংস সংরক্ষণ হয়নি। আবার চেষ্টা করুন।" : "আপনার notification preference সংরক্ষণ হয়েছে।");
    setSaving(false);
  }
  return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6">
    <div className="mx-auto max-w-2xl">
      <Link href="/notifications" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800"><ArrowLeft size={16}/> নোটিফিকেশনে ফিরুন</Link>
      <header className="mt-6"><span className="inline-flex rounded-xl bg-[#eaf4eb] p-3 text-emerald-800"><Bell size={24}/></span><h1 className="mt-4 text-3xl font-black">নোটিফিকেশন পছন্দ</h1><p className="mt-2 text-sm leading-6 text-[#6a7b6e]">কোন marketplace update পেতে চান তা নিয়ন্ত্রণ করুন। গুরুত্বপূর্ণ account ও নিরাপত্তা বার্তা এই preference-এর আওতায় নয়।</p></header>
      {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {loading ? <p className="mt-8 text-sm">লোড হচ্ছে…</p> : <form onSubmit={save} className="mt-6 overflow-hidden rounded-2xl border border-[#e1e9df] bg-white">
        {options.map((option) => <label key={option.key} className="flex cursor-pointer items-start justify-between gap-4 border-b border-[#edf1eb] p-4 last:border-0 sm:p-5">
          <span><span className="block text-sm font-extrabold">{option.title}</span><span className="mt-1 block text-xs leading-5 text-[#718174]">{option.description}</span></span>
          <input type="checkbox" checked={values[option.key]} disabled={option.key !== "in_app_enabled" && !values.in_app_enabled} onChange={(e) => setValues((current) => ({ ...current, [option.key]: e.target.checked }))} className="mt-1 h-5 w-5 shrink-0 accent-emerald-700"/>
        </label>)}
        <div className="border-t border-[#edf1eb] p-4"><button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-3 font-extrabold text-white disabled:opacity-50"><Save size={17}/>{saving ? "সংরক্ষণ হচ্ছে…" : "পছন্দ সংরক্ষণ করুন"}</button></div>
      </form>}
    </div>
  </main>;
}
