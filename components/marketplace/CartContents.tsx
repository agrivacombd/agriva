"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useCart } from "@/components/marketplace/CartProvider";
const money = (value: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);

export default function CartContents() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } = useCart();
  if (!items.length) return <section className="mt-8 rounded-3xl border border-dashed border-emerald-950/20 bg-white p-8 text-center sm:p-12">
    <ShoppingBasket size={42} className="mx-auto text-emerald-800" /><h2 className="mt-4 text-xl font-black">আপনার কার্ট এখন খালি</h2>
    <p className="mt-2 text-sm text-slate-600">মার্কেটপ্লেস থেকে বাস্তব ও অনুমোদিত পণ্য বেছে নিন।</p>
    <Link href="/marketplace" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">পণ্য দেখুন</Link>
  </section>;

  return <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
    <section className="space-y-3" aria-label="কার্টের পণ্য">
      {items.map(item => <article key={item.id} className="rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-lime-100 text-3xl">🌾</div>
          <div className="min-w-0 flex-1"><Link href={`/marketplace/${item.slug}`} className="break-words font-extrabold hover:text-emerald-800">{item.name}</Link>
            {item.category && <p className="mt-1 text-xs text-slate-500">{item.category}</p>}<p className="mt-2 font-black text-emerald-900">৳{money(item.price)}</p><p className="mt-1 text-xs text-slate-500">স্টক: {money(item.stock)}</p></div>
          <button type="button" onClick={() => removeItem(item.id)} aria-label={`${item.name} কার্ট থেকে সরান`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={18} /></button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="inline-flex items-center rounded-xl border border-slate-200">
            <button type="button" onClick={() => item.quantity === 1 ? removeItem(item.id) : setQuantity(item.id, item.quantity - 1)} aria-label="পরিমাণ কমান" className="grid h-10 w-10 place-items-center hover:bg-emerald-50"><Minus size={15} /></button>
            <span aria-live="polite" className="min-w-10 text-center text-sm font-extrabold">{money(item.quantity)}</span>
            <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="পরিমাণ বাড়ান" className="grid h-10 w-10 place-items-center hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button>
          </div><p className="text-right text-sm font-black">৳{money(item.price * item.quantity)}</p>
        </div>
      </article>)}
      <button type="button" onClick={clearCart} className="text-sm font-bold text-red-700 hover:underline">কার্ট খালি করুন</button>
    </section>
    <aside className="h-fit rounded-2xl border border-emerald-950/10 bg-white p-5"><h2 className="text-lg font-black">অর্ডারের সারাংশ</h2>
      <div className="mt-4 flex justify-between gap-3 text-sm"><span className="text-slate-600">পণ্যের সংখ্যা</span><span className="font-bold">{money(itemCount)}টি</span></div>
      <div className="mt-3 flex justify-between gap-3 text-sm"><span className="text-slate-600">সাবটোটাল</span><span className="font-bold">৳{money(subtotal)}</span></div>
      <div className="mt-3 flex justify-between gap-3 border-t border-slate-100 pt-3 text-sm"><span className="font-extrabold">মোট (ডেলিভারি বাদে)</span><span className="font-black text-emerald-900">৳{money(subtotal)}</span></div>
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">ডেলিভারি চার্জ ও চূড়ান্ত মোট মূল্য checkout-এ নিশ্চিত করতে হবে। একাধিক পণ্যের একক checkout পরবর্তী ধাপে যুক্ত হবে; এই কার্ট এখনো অর্ডার জমা দেয় না।</p>
      <Link href="/marketplace" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-900 px-4 py-3 text-sm font-extrabold text-emerald-900 hover:bg-emerald-50">আরও পণ্য যোগ করুন</Link>
    </aside>
  </div>;
}
