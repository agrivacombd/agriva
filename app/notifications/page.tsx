"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, ChevronLeft } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Notification = { id: string; title: string; body: string; href: string; read_at: string | null; created_at: string };
export default function NotificationsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?next=/notifications"; return; }
    setUserId(user.id);
    const { data, error } = await supabase.from("notifications")
      .select("id,title,body,href,read_at,created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(100);
    if (error) setNotice("নোটিফিকেশন লোড করা যায়নি। ডাটাবেস migration চালু হওয়ার পর আবার চেষ্টা করুন।");
    else setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);
  const unread = items.filter((item) => !item.read_at).length;
  async function markAllRead() {
    if (!userId || !unread) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("user_id", userId).is("read_at", null);
    if (error) setNotice("নোটিফিকেশন আপডেট করা যায়নি।");
    else setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
  }
  async function markRead(id: string) {
    if (!userId) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", id).eq("user_id", userId);
    if (!error) setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: readAt } : item));
  }
  return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6">
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800"><ChevronLeft size={17}/> ড্যাশবোর্ডে ফিরুন</Link>
      <header className="mt-6 flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-[#a67f25]">AGRIVA UPDATES</p><h1 className="mt-2 text-3xl font-black">নোটিফিকেশন</h1><p className="mt-1 text-sm text-[#6a7b6e]">{unread}টি অপঠিত আপডেট</p></div><button type="button" onClick={() => void markAllRead()} disabled={!unread} className="inline-flex items-center gap-2 rounded-xl border border-[#dce6da] bg-white px-3 py-2 text-xs font-bold disabled:opacity-40"><CheckCheck size={16}/> সব পড়ুন</button></header>
      {notice && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e9df] bg-white">
        {loading ? <p className="p-8 text-center text-sm text-[#718174]">লোড হচ্ছে…</p> : items.length === 0 ? <div className="p-12 text-center"><Bell size={30} className="mx-auto text-[#9aab9c]"/><p className="mt-3 font-bold">এখনো কোনো নোটিফিকেশন নেই</p><p className="mt-1 text-sm text-[#718174]">আপনার ফসল বা চাহিদার সঙ্গে মিল পাওয়া গেলে এখানে আপডেট পাবেন।</p></div> :
          items.map((item) => <article key={item.id} className={`border-b border-[#edf1eb] p-4 last:border-0 sm:p-5 ${item.read_at ? "" : "bg-[#f2f8ef]"}`}>
            <div className="flex gap-3"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.read_at ? "bg-transparent" : "bg-amber-500"}`}/><div className="min-w-0 flex-1"><Link href={item.href} onClick={() => { if (!item.read_at) void markRead(item.id); }} className="font-extrabold hover:text-emerald-800">{item.title}</Link>{item.body && <p className="mt-1 text-sm leading-6 text-[#647568]">{item.body}</p>}<p className="mt-2 text-xs text-[#8a998c]">{new Intl.DateTimeFormat("bn-BD",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.created_at))}</p></div></div>
          </article>)}
      </section>
    </div>
  </main>;
}
