"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Item = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  qty: number;
  stock: number;
  available: boolean;
};

const money = (value: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);

export default function Cart() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setItems([]);
      setMessage("কার্ট ব্যবহার করতে আগে লগইন করুন।");
      setLoading(false);
      return;
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    if (cartError) {
      setMessage("কার্ট লোড করা যায়নি। আবার চেষ্টা করুন।");
      setLoading(false);
      return;
    }
    if (!cart) {
      setItems([]);
      setMessage("");
      setLoading(false);
      return;
    }

    const { data: rows, error } = await supabase
      .from("cart_items").select("id,product_id,quantity,unit_price").eq("cart_id", cart.id);
    if (error) {
      setMessage("কার্টের পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।");
      setLoading(false);
      return;
    }

    const ids = (rows || []).map(row => row.product_id);
    const { data: products, error: productsError } = ids.length
      ? await supabase.from("products").select("id,name,price,stock,status").in("id", ids)
      : { data: [], error: null };

    if (productsError) {
      setMessage("পণ্যের বর্তমান মূল্য ও স্টক যাচাই করা যায়নি।");
      setLoading(false);
      return;
    }

    const productMap = new Map((products || []).map(product => [product.id, product]));
    setItems((rows || []).map(row => {
      const product = productMap.get(row.product_id);
      const stock = Math.max(0, Number(product?.stock || 0));
      const available = Boolean(product && product.status === "active" && stock > 0);
      return {
        id: row.id,
        product_id: row.product_id,
        name: product?.name || "পণ্য আর পাওয়া যাচ্ছে না",
        price: Number(product?.price ?? row.unit_price),
        qty: Number(row.quantity),
        stock,
        available,
      };
    }));
    setMessage("");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeQuantity(item: Item, nextQuantity: number) {
    if (busyItem || !item.available) return;
    if (nextQuantity < 1) {
      await remove(item);
      return;
    }
    const maxQuantity = Math.min(item.stock, 100);
    if (nextQuantity > maxQuantity) {
      setMessage(item.stock > 100
        ? "একটি পণ্যের জন্য সর্বোচ্চ ১০০টি অর্ডার করা যাবে।"
        : "স্টকে থাকা পরিমাণের বেশি পণ্য যোগ করা যাবে না।");
      return;
    }
    setBusyItem(item.id);
    setMessage("");
    const { error } = await supabase.from("cart_items").update({ quantity: nextQuantity, unit_price: item.price }).eq("id", item.id);
    if (error) setMessage("পরিমাণ পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।");
    await load();
    setBusyItem(null);
  }

  async function remove(item: Item) {
    setBusyItem(item.id);
    setMessage("");
    const { error } = await supabase.from("cart_items").delete().eq("id", item.id);
    if (error) {
      setMessage("পণ্যটি কার্ট থেকে সরানো যায়নি। আবার চেষ্টা করুন।");
      setBusyItem(null);
    } else {
      await load();
      setBusyItem(null);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#f5f7f2] px-4 py-10 sm:px-6"><div className="mx-auto max-w-5xl rounded-3xl bg-white p-8">কার্ট লোড হচ্ছে…</div></main>;

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Marketplace</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">আপনার কার্ট</h1>
      <p className="mt-2 text-sm text-[#647468]">অর্ডার দেওয়ার আগে পণ্যের পরিমাণ ও বর্তমান মূল্য যাচাই করুন।</p>
      {message && <div role="status" aria-live="polite" className="mt-5 rounded-xl bg-[#eef5ed] p-4 text-sm font-semibold">{message}{message.includes("লগইন") && <Link href="/login" className="ml-2 underline">লগইন করুন</Link>}</div>}
      {items.length === 0 ? <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">
        <ShoppingBasket size={40} className="mx-auto text-emerald-800" />
        <h2 className="mt-4 text-xl font-black sm:text-2xl">আপনার কার্ট খালি</h2>
        <p className="mt-2 text-sm text-[#647468]">মার্কেটপ্লেস থেকে কৃষিপণ্য বেছে নিন।</p>
        <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-6 py-3 font-bold text-white">পণ্য দেখুন</Link>
      </section> : <section className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          {items.map(item => <article key={item.id} className="border-b py-5 last:border-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <b className="break-words">{item.name}</b>
                <p className="mt-1 text-sm text-[#647468]">প্রতি পণ্য: ৳{money(item.price)}</p>
                <p className={`mt-1 text-xs ${item.available ? "text-[#647468]" : "font-bold text-red-700"}`}>{item.available ? `স্টকে আছে: ${money(item.stock)}` : "পণ্যটি এখন অর্ডার করা যাবে না"}</p>
              </div>
              <button type="button" onClick={() => void remove(item)} disabled={busyItem === item.id} aria-label={`${item.name} কার্ট থেকে সরান`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 size={18} /></button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-xl border border-slate-200">
                <button type="button" onClick={() => void changeQuantity(item, item.qty - 1)} disabled={busyItem === item.id || !item.available} aria-label="পরিমাণ কমান" className="grid h-10 w-10 place-items-center hover:bg-emerald-50 disabled:opacity-40"><Minus size={15} /></button>
                <span aria-live="polite" className="min-w-10 text-center text-sm font-extrabold">{money(item.qty)}</span>
                <button type="button" onClick={() => void changeQuantity(item, item.qty + 1)} disabled={busyItem === item.id || !item.available || item.qty >= Math.min(item.stock, 100)} aria-label="পরিমাণ বাড়ান" className="grid h-10 w-10 place-items-center hover:bg-emerald-50 disabled:opacity-40"><Plus size={15} /></button>
              </div>
              <p className="text-right font-black">৳{money(item.price * item.qty)}</p>
            </div>
          </article>)}
        </div>
        <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black">অর্ডারের সারাংশ</h2>
          <p className="mt-4 text-sm text-[#647468]">পণ্যের সংখ্যা: {money(items.reduce((sum, item) => sum + item.qty, 0))}</p>
          <p className="mt-2 text-sm text-[#647468]">সাবটোটাল</p>
          <p className="mt-1 text-3xl font-black">৳{money(total)}</p>
          <p className="mt-3 text-xs leading-5 text-[#647468]">ডেলিভারি চার্জ checkout-এ নিশ্চিত করা হবে।</p>
          <Link href="/checkout" aria-disabled={items.some(item => !item.available)} className={`mt-6 block rounded-xl px-5 py-3 text-center font-bold text-white ${items.some(item => !item.available) ? "pointer-events-none bg-slate-400" : "bg-[#17351f] hover:bg-emerald-900"}`}>ক্যাশ অন ডেলিভারি checkout</Link>
          <Link href="/marketplace" className="mt-3 block rounded-xl border border-[#17351f] px-5 py-3 text-center text-sm font-bold">আরও পণ্য যোগ করুন</Link>
        </aside>
      </section>}
    </div>
  </main>;
}
