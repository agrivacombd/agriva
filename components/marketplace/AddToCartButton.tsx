"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/components/marketplace/CartProvider";

type Props = { product: { id: string; slug: string; name: string; category: string | null; price: number | string | null; stock: number | null }; className?: string };

export default function AddToCartButton({ product, className = "" }: Props) {
  const { addItem } = useCart();
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const sample = product.id.startsWith("sample-");
  const stock = Math.max(0, Number(product.stock || 0));

  function add() {
    const result = addItem({ id: product.id, slug: product.slug, name: product.name, category: product.category, price: Number(product.price), stock });
    setMessage(result.message);
    setAdded(result.ok);
  }

  return <div className={className}>
    <button type="button" onClick={add} disabled={sample || stock < 1}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-white px-3 py-2 text-xs font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      {added ? <Check size={15} /> : <ShoppingCart size={15} />}
      {sample ? "নমুনা পণ্য" : stock < 1 ? "স্টকে নেই" : added ? "আবার যোগ করুন" : "কার্টে যোগ করুন"}
    </button>
    {message && <p role="status" aria-live="polite" className="mt-2 text-xs leading-5 text-emerald-800">{message}</p>}
    {added && <Link href="/cart" className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-900 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-800">কার্ট দেখুন</Link>}
  </div>;
}
