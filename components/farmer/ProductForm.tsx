"use client";
import { useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

const INITIAL_FORM = { name: "", price: "", stock: "", commission: "10", description: "", category_slug: "premium-food-grains", subcategory_slug: "edible-seeds" };

export default function ProductForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedCategory = MARKETPLACE_CATEGORIES.find((category) => category.slug === form.category_slug);
  const set = (key: keyof typeof INITIAL_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/farmer/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      setMessage(res.ok ? "পণ্যটি অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের আগে এটি মার্কেটপ্লেসে দেখাবে না।" : (data.error || "পণ্য জমা দেওয়া যায়নি।"));
      if (res.ok) setForm(INITIAL_FORM);
    } catch {
      setMessage("নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }
  return <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm">
    <div><label className="text-sm font-bold">পণ্যের নাম<input required maxLength={160} value={form.name} onChange={e=>set("name",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="যেমন: Premium Basmati Rice / Chia Seed 250g"/></label></div>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="text-sm font-bold">ক্যাটাগরি<select required value={form.category_slug} onChange={e=>{const next=MARKETPLACE_CATEGORIES.find(c=>c.slug===e.target.value);setForm(current=>({...current,category_slug:e.target.value,subcategory_slug:next?.subcategories[0]?.slug||""}));}} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">{MARKETPLACE_CATEGORIES.map(category=><option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
      <label className="text-sm font-bold">সাব-ক্যাটাগরি<select required value={form.subcategory_slug} onChange={e=>set("subcategory_slug",e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">{(selectedCategory?.subcategories??[]).map(sub=><option key={sub.slug} value={sub.slug}>{sub.name}</option>)}</select></label>
    </div>
    <div className="grid gap-5 md:grid-cols-3">
      <label className="text-sm font-bold">মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
      <label className="text-sm font-bold">স্টক / প্যাক সংখ্যা<input required type="number" min="0" step="1" value={form.stock} onChange={e=>set("stock",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
      <label className="text-sm font-bold">রিসেলার কমিশন (%)<input required type="number" min="0" max="100" step="0.01" value={form.commission} onChange={e=>set("commission",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
    </div>
    <div><label className="text-sm font-bold">পণ্যের বিবরণ<textarea maxLength={5000} value={form.description} onChange={e=>set("description",e.target.value)} className="mt-2 min-h-32 w-full rounded-xl border px-4 py-3" placeholder="ওজন, উৎপত্তিস্থল, প্যাকেজিং, উপাদান ও মেয়াদোত্তীর্ণের তথ্য দিন..."/></label></div>
    <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">পণ্যের সঠিক ওজন/প্যাক সাইজ, উপাদান, উৎস এবং মেয়াদোত্তীর্ণের তথ্য দিন। অনুমোদনের আগে পণ্য প্রকাশ হবে না।</p>
    <button disabled={loading} className="w-full rounded-2xl bg-[#17351f] px-5 py-4 font-black text-white disabled:opacity-50">{loading ? "জমা হচ্ছে..." : "পর্যালোচনার জন্য জমা দিন"}</button>
    {message&&<p role="status" className="text-sm font-semibold text-[#1f7a45]">{message}</p>}
  </form>;
}
