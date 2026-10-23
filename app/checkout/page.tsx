"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Item = { product_id: string; quantity: number; unit_price: number; name: string };
type Address = { name: string; phone: string; address: string; city: string; area: string };

export default function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Address>({ name: "", phone: "", address: "", city: "", area: "" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codEnabled, setCodEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setMessage("চেকআউটের আগে লগইন করুন।");
        setLoading(false);
        return;
      }

      const [{ data: settings }, { data: cart }] = await Promise.all([
        supabase.rpc("get_public_site_settings"),
        supabase.from("carts").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      if (!active) return;
      const codSetting = (settings || []).find((setting: { key: string; value: string }) => setting.key === "cod_enabled");
      setCodEnabled(codSetting?.value === "true");
      if (!cart) {
        setMessage("আপনার কার্ট খালি।");
        setLoading(false);
        return;
      }

      const { data: rows, error } = await supabase
        .from("cart_items").select("product_id,quantity,unit_price").eq("cart_id", cart.id);
      if (!active) return;
      if (error) {
        setMessage("কার্ট লোড করা যায়নি। আবার চেষ্টা করুন।");
        setLoading(false);
        return;
      }
      const ids = (rows || []).map(row => row.product_id);
      const { data: products } = ids.length
        ? await supabase.from("products").select("id,name,price,stock,status").in("id", ids)
        : { data: [] };
      if (!active) return;
      const productMap = new Map((products || []).map(product => [product.id, product]));
      setItems((rows || []).map(row => {
        const product = productMap.get(row.product_id);
        return {
          ...row,
          unit_price: Number(product?.price ?? row.unit_price),
          name: product?.name || "পণ্য",
        };
      }));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length || busy || confirmed) return;
    if (!codEnabled) {
      setMessage("Cash on Delivery বন্ধ আছে। সাপোর্টের সঙ্গে যোগাযোগ করুন।");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            fullName: form.name,
            phone: form.phone,
            district: form.city,
            address: [form.address, form.area].filter(Boolean).join(", "),
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Checkout ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setConfirmed(true);
      setItems([]);
      setMessage(`অর্ডার নিশ্চিত হয়েছে। অর্ডার নম্বর: ${result.orderId}। মোট: ৳${Number(result.total).toFixed(2)}।`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8">চেকআউট লোড হচ্ছে…</div></main>;

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Checkout</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">ডেলিভারি ও পেমেন্ট</h1>
      {items.length > 0 && <section className="mt-6 rounded-2xl bg-white p-5">
        <p className="font-bold">আপনার কার্টে {items.length} ধরনের পণ্য</p>
        {items.map(item => <p key={item.product_id} className="mt-2 text-sm text-[#647468]">{item.name} × {item.quantity} · ৳{(item.unit_price * item.quantity).toFixed(2)}</p>)}
        <p className="mt-4 border-t pt-3 font-black">পণ্যের মোট: ৳{items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0).toFixed(2)}</p>
      </section>}
      {message && <div role="status" aria-live="polite" className="mt-6 rounded-xl bg-[#eef5ed] p-4 text-sm font-semibold">{message}</div>}
      {confirmed && <Link href="/marketplace" className="mt-5 inline-flex rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white">মার্কেটপ্লেসে ফিরে যান</Link>}
      {!confirmed && items.length > 0 && <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <Field label="সম্পূর্ণ নাম" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <Field label="মোবাইল নম্বর" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <Field label="সম্পূর্ণ ঠিকানা" value={form.address} onChange={v => setForm({ ...form, address: v })} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="জেলা" value={form.city} onChange={v => setForm({ ...form, city: v })} />
          <Field label="এলাকা / উপজেলা" value={form.area} onChange={v => setForm({ ...form, area: v })} />
        </div>
        <div className="rounded-2xl border p-4">
          <b>ক্যাশ অন ডেলিভারি</b>
          <p className="mt-1 text-sm text-[#647468]">{codEnabled ? "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।" : "সাইট অ্যাডমিন বর্তমানে Cash on Delivery বন্ধ রেখেছেন।"}</p>
        </div>
        <button type="submit" disabled={busy || !codEnabled} className="w-full rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">
          {busy ? "একটি অর্ডার তৈরি হচ্ছে…" : "সব পণ্যের অর্ডার নিশ্চিত করুন"}
        </button>
      </form>}
      {!items.length && !confirmed && <Link href="/cart" className="mt-5 inline-flex rounded-xl border border-[#17351f] px-5 py-3 font-bold">কার্টে ফিরে যান</Link>}
    </div>
  </main>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block">
    <span className="text-sm font-bold">{label}</span>
    <input required value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" />
  </label>;
}
