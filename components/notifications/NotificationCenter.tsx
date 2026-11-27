"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Notification = {
  id: string;
  event_type: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

const bnDate = (value: string) => new Intl.DateTimeFormat("bn-BD", {
  day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
}).format(new Date(value));

export default function NotificationCenter() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const unread = items.filter((item) => !item.read_at).length;

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data, error } = await supabase
      .from("notifications")
      .select("id,event_type,title,body,href,read_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    if (!error) setItems((data ?? []) as Notification[]);
  }, [supabase]);

  useEffect(() => {
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  async function markRead(id: string) {
    if (!userId) return;
    setBusy(true);
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: readAt })
      .eq("id", id).eq("user_id", userId);
    if (!error) setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: readAt } : item));
    setBusy(false);
  }

  async function markAllRead() {
    if (!userId || unread === 0) return;
    setBusy(true);
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: readAt })
      .eq("user_id", userId).is("read_at", null);
    if (!error) setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
    setBusy(false);
  }

  return (
    <div className="relative">
      <button type="button" aria-label={`নোটিফিকেশন ${unread ? `(${unread}টি অপঠিত)` : ""}`}
        aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void load(); }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce6da] bg-white text-[#176344] hover:bg-[#f0f7ee]">
        <Bell size={19} aria-hidden="true" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">{unread > 9 ? "৯+" : unread}</span>}
      </button>
      {open && <>
        <button type="button" aria-label="নোটিফিকেশন বন্ধ করুন" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
        <section className="absolute right-0 z-40 mt-3 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white text-[#173b2d] shadow-xl">
          <header className="flex items-center justify-between gap-3 border-b border-[#e7eee4] px-4 py-3">
            <div><h2 className="font-black">নোটিফিকেশন</h2><p className="text-xs text-[#708073]">{unread ? `${unread}টি অপঠিত` : "সব আপডেট দেখা হয়েছে"}</p></div>
            <button type="button" disabled={busy || unread === 0} onClick={() => void markAllRead()} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 disabled:opacity-40"><CheckCheck size={15}/> সব পড়া হয়েছে</button>
          </header>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? <div className="px-5 py-9 text-center"><Bell size={25} className="mx-auto text-[#9aab9c]"/><p className="mt-3 text-sm font-bold">এখনো কোনো নোটিফিকেশন নেই</p><p className="mt-1 text-xs leading-5 text-[#718174]">আপনার ফসল বা চাহিদার সঙ্গে মিল পাওয়া গেলে এখানে আপডেট দেখবেন।</p></div> :
              items.map((item) => <div key={item.id} className={`border-b border-[#eef2ec] px-4 py-3 last:border-0 ${item.read_at ? "bg-white" : "bg-[#f2f8ef]"}`}>
                <div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-transparent" : "bg-amber-500"}`}/>
                  <div className="min-w-0 flex-1"><Link href={item.href} onClick={() => { if (!item.read_at) void markRead(item.id); setOpen(false); }} className="block text-sm font-extrabold hover:text-emerald-800">{item.title}</Link>
                    {item.body && <p className="mt-1 text-xs leading-5 text-[#647568]">{item.body}</p>}
                    <p className="mt-2 text-[11px] text-[#8a998c]">{bnDate(item.created_at)}</p>
                  </div>
                </div>
              </div>)}
          </div>
          <footer className="border-t border-[#e7eee4] px-4 py-3 text-center"><Link href="/notifications" onClick={() => setOpen(false)} className="text-sm font-bold text-emerald-800 hover:underline">সব নোটিফিকেশন দেখুন</Link></footer>
        </section>
      </>}
    </div>
  );
}
