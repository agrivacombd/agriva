"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = { product: { id: string; slug: string; name: string; category: string | null; price: number | string | null; stock: number | null }; className?: string };

export default function AddToCartButton({ product, className = "" }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const sample = product.id.startsWith("sample-");
  const stock = Math.max(0, Number(product.stock || 0));
  const maxQuantity = Math.min(stock, 100);

  async function add() {
    if (sample || stock < 1 || busy) return;
    setBusy(true);
    setMessage("");
    setAdded(false);
    try {
      // Match the cookie-backed client used by /login.
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setMessage("কার্টে পণ্য যোগ করতে আগে লগইন করুন।");
        return;
      }

      const { error: addError } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: product.id,
        p_quantity: quantity,
      });
      if (addError) {
        setMessage(/Insufficient stock|maximum quantity/i.test(addError.message)
          ? "স্টক বা সর্বোচ্চ অর্ডারযোগ্য পরিমাণ অতিক্রম হয়েছে।"
          : "পণ্যটি কার্টে যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      setAdded(true);
      setMessage(`${quantity}টি পণ্য কার্টে যোগ হয়েছে।`);
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return <div className={className}>
    {!sample && stock > 0 && <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-1.5">
      <span className="pl-2 text-xs font-bold text-slate-600">পরিমাণ</span>
      <div className="inline-flex items-center rounded-lg border border-slate-200">
        <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={busy || quantity <= 1} aria-label="পরিমাণ কমান" className="grid h-9 w-9 place-items-center rounded-l-lg hover:bg-emerald-50 disabled:opacity-40"><Minus size={15} /></button>
        <span aria-live="polite" className="min-w-9 text-center text-sm font-extrabold">{quantity}</span>
        <button type="button" onClick={() => setQuantity(value => Math.min(maxQuantity, value + 1))} disabled={busy || quantity >= maxQuantity} aria-label="পরিমাণ বাড়ান" className="grid h-9 w-9 place-items-center rounded-r-lg hover:bg-emerald-50 disabled:opacity-40"><Plus size={15} /></button>
      </div>
    </div>}
    <button type="button" onClick={add} disabled={sample || stock < 1 || busy}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-white px-3 py-2 text-xs font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      {added ? <Check size={15} /> : <ShoppingCart size={15} />}
      {sample ? "নমুনা পণ্য" : stock < 1 ? "স্টকে নেই" : busy ? "যোগ হচ্ছে..." : added ? "আরও কার্টে যোগ করুন" : "কার্টে যোগ করুন"}
    </button>
    {message && <p role="status" aria-live="polite" className={`mt-2 text-xs leading-5 ${added ? "text-emerald-800" : "text-amber-800"}`}>{message}</p>}
    {message.includes("আগে লগইন") && <Link href={`/login?next=${encodeURIComponent(`/marketplace/${product.slug}`)}`} className="mt-2 inline-flex text-xs font-bold text-emerald-900 underline">লগইন করুন</Link>}
    {added && <Link href="/cart" className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-900 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-800">কার্ট দেখুন</Link>}
    {!sample && stock > 100 && <p className="mt-1 text-[11px] text-slate-500">একবারে সর্বোচ্চ ১০০টি; স্টক: {stock}</p>}
  </div>;
}
