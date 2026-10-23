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

      // Recheck live availability and price instead of trusting values rendered in the browser.
      const { data: liveProduct, error: productError } = await supabase
        .from("products")
        .select("id,price,stock,status,moderation_status")
        .eq("id", product.id)
        .eq("status", "active")
        .eq("moderation_status", "approved")
        .maybeSingle();
      if (productError || !liveProduct) {
        setMessage("পণ্যটি এখন পাওয়া যাচ্ছে না। পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
        return;
      }
      const liveStock = Number(liveProduct.stock || 0);
      const livePrice = Number(liveProduct.price);
      if (liveStock < 1 || !Number.isFinite(livePrice) || livePrice < 0) {
        setMessage("পণ্যটি বর্তমানে স্টকে নেই বা মূল্য যাচাই করা যাচ্ছে না।");
        return;
      }

      let { data: cart, error: cartError } = await supabase
        .from("carts").select("id").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
      if (cartError) {
        setMessage("কার্ট লোড করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        return;
      }
      if (!cart) {
        const created = await supabase.from("carts").insert({ user_id: auth.user.id, status: "active" }).select("id").single();
        if (created.error || !created.data) {
          setMessage("কার্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।");
          return;
        }
        cart = created.data;
      }

      const { data: existing, error: itemError } = await supabase
        .from("cart_items").select("id,quantity").eq("cart_id", cart.id).eq("product_id", product.id).maybeSingle();
      if (itemError) {
        setMessage("কার্টের পণ্য যাচাই করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      const nextQuantity = Math.min(Number(existing?.quantity || 0) + 1, liveStock);
      if (existing && Number(existing.quantity) >= liveStock) {
        setMessage("কার্টে ইতিমধ্যে স্টকের সর্বোচ্চ পরিমাণ আছে।");
        return;
      }
      const saved = existing
        ? await supabase.from("cart_items").update({ quantity: nextQuantity, unit_price: livePrice }).eq("id", existing.id)
        : await supabase.from("cart_items").insert({ cart_id: cart.id, product_id: product.id, quantity: 1, unit_price: livePrice });
      if (saved.error) {
        setMessage("পণ্যটি কার্টে যোগ করা যায়নি। আবার চেষ্টা করুন।");
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
