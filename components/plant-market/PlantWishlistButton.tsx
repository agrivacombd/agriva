"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "agriva:plant-market:wishlist:v1";
type SavedPlant = { id: string; name: string; slug: string; price: number; image?: string | null; savedAt: number };

function readSaved(): SavedPlant[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export default function PlantWishlistButton({ product }: { product: Omit<SavedPlant, "savedAt"> }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const sync = () => setSaved(readSaved().some((item) => item.id === product.id));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("agriva:wishlist-updated", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("agriva:wishlist-updated", sync); };
  }, [product.id]);

  function toggle() {
    const items = readSaved();
    const next = saved
      ? items.filter((item) => item.id !== product.id)
      : [{ ...product, savedAt: Date.now() }, ...items.filter((item) => item.id !== product.id)];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(!saved);
    window.dispatchEvent(new Event("agriva:wishlist-updated"));
  }

  return <button type="button" onClick={toggle} aria-pressed={saved} aria-label={saved ? "Wishlist থেকে সরান" : "Wishlist-এ রাখুন"}
    className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${saved ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"}`}>
    <Heart size={17} fill={saved ? "currentColor" : "none"}/>{saved ? "Wishlist-এ আছে" : "Wishlist"}
  </button>;
}
