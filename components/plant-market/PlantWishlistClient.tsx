"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";

const KEY = "agriva:plant-market:wishlist:v1";
type SavedPlant = { id: string; name: string; slug: string; price: number; image?: string | null; savedAt: number };

export default function PlantWishlistClient() {
  const [items, setItems] = useState<SavedPlant[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        const value = JSON.parse(localStorage.getItem(KEY) || "[]");
        setItems(Array.isArray(value) ? value : []);
      } catch { setItems([]); }
      setReady(true);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("agriva:wishlist-updated", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("agriva:wishlist-updated", sync); };
  }, []);
  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("agriva:wishlist-updated"));
  }
  if (!ready) return <p className="rounded-xl bg-white p-5 text-sm text-slate-500">Wishlist লোড হচ্ছে…</p>;
  if (!items.length) return <div className="rounded-3xl border border-dashed border-emerald-900/20 bg-white p-8 text-center"><Heart className="mx-auto text-emerald-700" size={36}/><h2 className="mt-3 text-lg font-extrabold">আপনার Wishlist এখন খালি</h2><p className="mt-2 text-sm text-slate-600">পছন্দের গাছ সংরক্ষণ করলে এখানে পাবেন।</p><Link href="/plant-market" className="mt-4 inline-flex rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white">গাছ দেখুন</Link></div>;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white"><Link href={`/plant-market/${encodeURIComponent(item.slug)}`} className="block"><div className="aspect-square bg-emerald-50">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain" loading="lazy"/> : <div className="grid h-full place-items-center text-5xl">🪴</div>}</div><div className="p-4"><h3 className="font-extrabold">{item.name}</h3><p className="mt-2 font-black text-emerald-900">৳{Number(item.price).toLocaleString("bn-BD")}</p></div></Link><div className="px-4 pb-4"><button type="button" onClick={()=>remove(item.id)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={15}/> সরান</button></div></article>)}</div>;
}
