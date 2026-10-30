"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Props = { product: { id: string; slug: string; name: string; category: string | null; price: number | string | null; stock: number | null }; className?: string };

export default function AddToCartButton({ product, className = "" }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const sample = product.id.startsWith("sample-");
  const stock = Math.max(0, Number(product.stock || 0));

  async function add() {
    if (sample || stock < 1 || busy) return;
    setBusy(true);
    setMessage("");
    setAdded(false);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) {
        setMessage("কার্টে পণ্য যোগ করতে আগে লগইন করুন।");
        return;
      }

      const { error: addError } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: product.id,
        p_quantity: 1,
      });
      if (addError) {
        setMessage(/Insufficient stock|maximum quantity/i.test(addError.message)
          ? "স্টক বা সর্বোচ্চ অর্ডারযোগ্য পরিমাণ অতিক্রম হয়েছে।"
          : "পণ্যটি কার্টে যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      setAdded(true);
      setMessage("পণ্যটি কার্টে যোগ হয়েছে।");
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return <div className={className}>
    <button type="button" onClick={add} disabled={sample || stock < 1 || busy}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-white px-3 py-2 text-xs font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      {added ? <Check size={15} /> : <ShoppingCart size={15} />}
      {sample ? "নমুনা পণ্য" : stock < 1 ? "স্টকে নেই" : busy ? "যোগ হচ্ছে..." : added ? "কার্টে যোগ হয়েছে" : "কার্টে যোগ করুন"}
    </button>
    {message && <p role="status" aria-live="polite" className={`mt-2 text-xs leading-5 ${added ? "text-emerald-800" : "text-amber-800"}`}>{message}</p>}
    {message.includes("আগে লগইন") && <Link href="/login" className="mt-2 inline-flex text-xs font-bold text-emerald-900 underline">লগইন করুন</Link>}
    {added && <Link href="/cart" className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-900 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-800">কার্ট দেখুন</Link>}
  </div>;
}
