"use client";
import { useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

const initial = { name: "", category_slug: "premium-food-grains", subcategory_slug: "edible-seeds", price: "", stock: "", commission: "", description: "", status: "draft" };

export default function AdminCreateProductForm() {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const category = MARKETPLACE_CATEGORIES.find(item => item.slug === form.category_slug);
  const set = (key: keyof typeof initial, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "পণ্য তৈরি করা যায়নি।"); return; }
      setMessage("পণ্যটি তৈরি হয়েছে। Draft হিসেবে রাখা হয়েছে; প্রকাশ করতে Admin product list থেকে status Active করতে হবে।");
      setForm(initial);
    } catch { setMessage("নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।"); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
    <div><h2 className="text-xl font-black">নতুন পণ্য যোগ করুন</h2><p className="mt-1 text-sm text-[#637266]">বাস্তব মূল্য ও স্টক দিন। পণ্য প্রথমে Draft থাকবে।</p></div>
    <label className="block text-sm font-bold">পণ্যের নাম<input required maxLength={160} value={form.name} onChange={e=>set("name",e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="যেমন: Chia Seed — 250g"/></label>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold">ক্যাটাগরি<select required value={form.category_slug} onChange={e=>{const next=MARKETPLACE_CATEGORIES.find(c=>c.slug===e.target.value);setForm(current=>({...current,category_slug:e.target.value,subcategory_slug:next?.subcategories[0]?.slug||""}));}} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal">{MARKETPLACE_CATEGORIES.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">সাব-ক্যাটাগরি<select required value={form.subcategory_slug} onChange={e=>set("subcategory_slug",e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal">{(category?.subcategories??[]).map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <label className="text-sm font-bold">বিক্রয়মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="প্রকৃত বিক্রয়মূল্য"/></label>
      <label className="text-sm font-bold">স্টক / প্যাক সংখ্যা<input required type="number" min="0" step="1" value={form.stock} onChange={e=>set("stock",e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="প্রকৃত স্টক"/></label>
      <label className="text-sm font-bold">রিসেলার কমিশন (%)<input required type="number" min="0" max="100" step="0.01" value={form.commission} onChange={e=>set("commission",e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
    </div>
    <label className="block text-sm font-bold">বিবরণ<textarea maxLength={5000} rows={4} value={form.description} onChange={e=>set("description",e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="প্যাক সাইজ, প্রকৃত উৎপত্তিস্থল, খাদ্য/বপনের ব্যবহার, প্যাকেজিং ও মেয়াদের তথ্য লিখুন।"/></label>
    <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">চিয়া সিডের ক্ষেত্রে নিশ্চিত করুন এটি মানুষের খাওয়ার উপযোগী। প্রতিটি প্যাক সাইজ (250g, 500g, 1kg) আলাদা পণ্য হিসেবে যোগ করুন, যদি দাম বা স্টক আলাদা হয়। উৎপত্তিস্থল পণ্যভেদে নিশ্চিত করে লিখুন।</p>
    <button disabled={loading} className="w-full rounded-xl bg-[#17452c] px-4 py-3 font-extrabold text-white disabled:opacity-50">{loading ? "তৈরি হচ্ছে..." : "Draft পণ্য তৈরি করুন"}</button>
    {message && <p role="status" className="text-sm font-semibold" aria-live="polite">{message}</p>}
  </form>;
}
