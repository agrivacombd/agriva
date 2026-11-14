"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBasket, ShoppingCart, Trash2, Truck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CART_UPDATED_EVENT } from "@/components/site/HeaderCartLink";

type Item = {
  id: string;
  product_id: string;
  slug: string | null;
  image_url: string | null;
  name: string;
  unit: string | null;
  price: number;
  qty: number;
  stock: number;
  available: boolean;
};

const UNIT_LABELS: Record<string, string> = {
  kg: "কেজি", g: "গ্রাম", piece: "পিস", pack: "প্যাকেট",
  liter: "লিটার", bag: "বস্তা",
};

const money = (value: number) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);

export default function Cart() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const invalidCart = items.some(item => !item.available || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > Math.min(item.stock, 100));
  const checkoutDisabled = invalidCart || Boolean(busyItem);

  const load = useCallback(async (silent = false) => {
    const supabase = createSupabaseBrowserClient();
    if (!silent) setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setItems([]);
        setMessage("কার্ট ব্যবহার করতে আগে লগইন করুন।");
        return;
      }

      const { data: cart, error: cartError } = await supabase
        .from("carts").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (cartError) throw new Error("কার্ট লোড করা যায়নি। আবার চেষ্টা করুন।");
      if (!cart) {
        setItems([]);
        setMessage("");
        return;
      }

      const { data: rows, error: rowsError } = await supabase
        .from("cart_items").select("id,product_id,quantity,unit_price").eq("cart_id", cart.id);
      if (rowsError) throw new Error("কার্টের পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।");

      const ids = (rows || []).map(row => row.product_id);
      const { data: products, error: productsError } = ids.length
        ? await supabase.from("products").select("id,name,slug,image_url,unit,price,stock,status").in("id", ids)
        : { data: [], error: null };
      if (productsError) throw new Error("পণ্যের বর্তমান মূল্য ও স্টক যাচাই করা যায়নি।");

      const productMap = new Map((products || []).map(product => [product.id, product]));
      setItems((rows || []).map(row => {
        const product = productMap.get(row.product_id);
        const stock = Math.max(0, Math.floor(Number(product?.stock || 0)));
        return {
          id: row.id,
          product_id: row.product_id,
          slug: product?.slug || null,
          image_url: product?.image_url || null,
          name: product?.name || "পণ্যটি এখন পাওয়া যাচ্ছে না",
          unit: product?.unit || null,
          price: Number(product?.price ?? row.unit_price),
          qty: Number(row.quantity),
          stock,
          available: Boolean(product && product.status === "active" && stock > 0),
        };
      }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "কার্ট লোড করা যাচ্ছে না। আবার চেষ্টা করুন।");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeQuantity(item: Item, nextQuantity: number) {
    if (busyItem || !item.available) return;
    if (nextQuantity < 1) {
      await remove(item);
      return;
    }
    if (!Number.isSafeInteger(nextQuantity) || nextQuantity > Math.min(item.stock, 100)) {
      setMessage("স্টকে থাকা পরিমাণ ও প্রতি পণ্যে সর্বোচ্চ ১০০টির সীমা যাচাই করুন।");
      return;
    }
    setBusyItem(item.id);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("cart_items")
        .update({ quantity: nextQuantity, unit_price: item.price }).eq("id", item.id);
      if (error) throw error;
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      await load(true);
    } catch {
      setMessage("পরিমাণ পরিবর্তন করা যায়নি। পুনরায় চেষ্টা করুন।");
    } finally {
      setBusyItem(null);
    }
  }

  async function remove(item: Item) {
    if (busyItem) return;
    setBusyItem(item.id);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("cart_items").delete().eq("id", item.id);
      if (error) throw error;
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      await load(true);
    } catch {
      setMessage("পণ্যটি কার্ট থেকে সরানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusyItem(null);
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8" role="status">কার্ট লোড হচ্ছে…</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-7 text-[#17351f] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA MARKETPLACE · CART</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black sm:text-4xl">আপনার শপিং কার্ট</h1>
            <p className="mt-2 text-sm text-[#647468]">পণ্যের ছবি, পরিমাণ ও মূল্য যাচাই করে অর্ডার নিশ্চিত করুন।</p>
          </div>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#17351f]/25 bg-white px-4 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50">
            <ArrowLeft size={16} /> কেনাকাটা চালিয়ে যান
          </Link>
        </div>

        {message && (
          <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold">
            {message}
            {message.includes("লগইন") && <Link href="/login?next=%2Fcart" className="ml-2 underline underline-offset-2">লগইন করুন</Link>}
          </div>
        )}

        {items.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-8 text-center shadow-sm sm:p-12">
            <ShoppingBasket size={44} className="mx-auto text-emerald-800" />
            <h2 className="mt-4 text-xl font-black sm:text-2xl">আপনার কার্ট খালি</h2>
            <p className="mt-2 text-sm text-[#647468]">AGRIVA মার্কেটপ্লেস থেকে প্রয়োজনীয় পণ্য বেছে নিন।</p>
            <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-6 py-3 font-bold text-white hover:bg-emerald-800">পণ্য দেখুন</Link>
          </section>
        ) : (
          <section className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-7">
            <div className="min-w-0 space-y-3">
              <h2 className="text-lg font-black">অর্ডার আইটেম ({money(items.length)} ধরনের পণ্য)</h2>
              {items.map(item => {
                const unitLabel = item.unit ? UNIT_LABELS[item.unit] || item.unit : "টি";
                const detailLink = item.slug ? "/marketplace/" + item.slug : "/marketplace";
                return (
                  <article key={item.id} className="relative rounded-2xl border border-emerald-950/10 bg-white p-3 shadow-sm sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Link href={detailLink} className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 sm:h-24 sm:w-24" aria-label={item.name + " পণ্যের বিবরণ"}>
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} fill unoptimized sizes="96px" className="object-contain p-1.5" />
                        ) : (
                          <span className="text-3xl" aria-hidden="true">🌱</span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1 pr-8">
                        <Link href={detailLink} className="line-clamp-2 text-sm font-black leading-6 text-slate-900 hover:text-emerald-800 sm:text-base">{item.name}</Link>
                        <p className="mt-1 text-xs leading-5 text-slate-500">প্রতি {unitLabel}: ৳{money(item.price)}</p>
                        <p className={"mt-1 text-xs font-semibold " + (item.available ? "text-emerald-700" : "text-red-700")}>
                          {item.available ? "স্টকে আছে: " + money(item.stock) + " " + unitLabel : "পণ্যটি এখন অর্ডার করা যাবে না"}
                        </p>
                      </div>
                      <button type="button" onClick={() => void remove(item)} disabled={Boolean(busyItem)}
                        aria-label={item.name + " কার্ট থেকে সরান"} title="কার্ট থেকে সরান"
                        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:pl-28">
                      <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-slate-200">
                        <button type="button" onClick={() => void changeQuantity(item, item.qty - 1)}
                          disabled={Boolean(busyItem) || !item.available || item.qty < 1}
                          aria-label={item.name + " পরিমাণ কমান"}
                          className="grid h-10 w-10 place-items-center bg-slate-50 hover:bg-emerald-50 disabled:opacity-40"><Minus size={15} /></button>
                        <output aria-live="polite" className="min-w-10 border-x border-slate-200 px-2 text-center text-sm font-extrabold tabular-nums">{money(item.qty)}</output>
                        <button type="button" onClick={() => void changeQuantity(item, item.qty + 1)}
                          disabled={Boolean(busyItem) || !item.available || item.qty >= Math.min(item.stock, 100)}
                          aria-label={item.name + " পরিমাণ বাড়ান"}
                          className="grid h-10 w-10 place-items-center bg-slate-50 hover:bg-emerald-50 disabled:opacity-40"><Plus size={15} /></button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-slate-500">এই পণ্যের মোট</p>
                        <p className="text-lg font-black tabular-nums text-emerald-950">৳{money(item.price * item.qty)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm lg:sticky lg:top-5 sm:p-6" aria-label="অর্ডারের মূল্যসারাংশ">
              <h2 className="text-lg font-black">অর্ডারের সারাংশ</h2>
              <p className="mt-1 text-xs text-slate-500">{money(items.length)} ধরনের পণ্য · মোট {money(itemCount)} {itemCount === 1 ? "টি" : "একক"}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-slate-600">পণ্যের মোট মূল্য</dt>
                  <dd className="font-bold tabular-nums">৳{money(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">ডিসকাউন্ট</dt>
                  <dd className="text-xs font-semibold text-slate-500">প্রযোজ্য নয়</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">ডেলিভারি চার্জ</dt>
                  <dd className="text-xs font-semibold text-slate-600">Checkout-এ যাচাই করুন</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <dt className="font-black">পণ্যের মোট (ডেলিভারি ছাড়া)</dt>
                  <dd className="text-xl font-black tabular-nums text-emerald-800">৳{money(subtotal)}</dd>
                </div>
              </dl>
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-3 text-xs leading-5 text-emerald-950">
                <Truck size={15} className="mr-1 inline-block align-text-bottom" />
                অর্ডারের চূড়ান্ত মূল্য ও প্রযোজ্য চার্জ নিশ্চিত করার আগে যাচাই করুন। কার্টের মূল্য বর্তমান পণ্যের তথ্য থেকে দেখানো হচ্ছে।
              </p>
              <Link href={checkoutDisabled ? "/cart" : "/checkout"} aria-disabled={checkoutDisabled}
                className={"mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-sm font-black text-white transition " +
                  (checkoutDisabled ? "pointer-events-none bg-slate-400" : "bg-emerald-700 hover:bg-emerald-800")}>
                <ShoppingCart size={17} /> COD অর্ডার নিশ্চিত করতে এগিয়ে যান
              </Link>
              {invalidCart && <p className="mt-2 text-xs leading-5 text-amber-800">স্টক শেষ বা পরিমাণ সীমার বেশি এমন পণ্য ঠিক করে আবার চেষ্টা করুন।</p>}
              <Link href="/marketplace" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-800 px-4 py-3 text-center text-xs font-extrabold text-emerald-900 hover:bg-emerald-50">
                <ArrowLeft size={15} /> আরও পণ্য যোগ করুন
              </Link>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
