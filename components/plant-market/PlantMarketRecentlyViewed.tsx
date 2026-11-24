"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ViewedProduct = { id: string; name: string; slug: string; price: number; image?: string | null };
const STORAGE_KEY = "agriva-plant-market-recently-viewed";
const MAX_ITEMS = 8;

export default function PlantMarketRecentlyViewed({ product }: { product: ViewedProduct }) {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved: ViewedProduct[] = raw ? JSON.parse(raw) : [];
      const next = [product, ...saved.filter((item) => item.id !== product.id)].slice(0, MAX_ITEMS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next.filter((item) => item.id !== product.id));
    } catch {
      setItems([]);
    }
  }, [product]);

  if (!items.length) return null;

  return (
    <section aria-label="Recently viewed plants" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-emerald-700">আপনি আগে দেখেছেন</p>
          <h2 className="mt-1 text-xl font-black text-emerald-950">Recently Viewed</h2>
        </div>
        <button type="button" onClick={() => { try { window.localStorage.removeItem(STORAGE_KEY); setItems([]); } catch { setItems([]); } }} className="text-xs font-semibold text-slate-500 underline underline-offset-2">
          তালিকা মুছুন
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <Link key={item.id} href={"/plant-market/" + encodeURIComponent(item.slug)} className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white transition hover:shadow-md">
            <div className="flex aspect-square items-center justify-center bg-emerald-50">
              {item.image ? <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-contain" /> : <span className="text-5xl">🪴</span>}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-bold text-slate-800">{item.name}</p>
              <p className="mt-1 text-sm font-black text-emerald-900">৳{Number(item.price).toLocaleString("bn-BD")}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
