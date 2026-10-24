"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Category = { name: string; slug: string };
type Subcategory = { name: string; slug: string; category_slug: string };
type Farmer = { id: string; full_name: string | null; phone: string | null };

export default function AdminNewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [commission, setCommission] = useState("10");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/products/options").then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "ফর্মের তথ্য লোড করা যায়নি");
      setCategories(data.categories ?? []);
      setSubcategories(data.subcategories ?? []);
      setFarmers(data.farmers ?? []);
    }).catch(e => setMessage(e.message || "তথ্য লোড করা যায়নি")).finally(() => setLoading(false));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("");
    try {
      if (!imageFile) throw new Error("পণ্যের ছবি নির্বাচন করুন");
      const imageForm = new FormData();
      imageForm.set("image", imageFile);
      const imageResponse = await fetch("/api/admin/products/image", { method: "POST", body: imageForm });
      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.error || "ছবি আপলোড হয়নি");
      const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId, name, description, price, stock, commission, categorySlug: category, subcategorySlug: subcategory, imageUrl: imageData.imageUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "পণ্য যোগ করা যায়নি");
      setMessage("পণ্য যোগ হয়েছে এবং Admin review-এর জন্য pending রাখা হয়েছে।");
      setName(""); setDescription(""); setPrice(""); setStock(""); setCommission("10"); setSubcategory(""); setImageFile(null);
    } catch (e) { setMessage(e instanceof Error ? e.message : "পণ্য যোগ করা যায়নি"); }
    finally { setSaving(false); }
  }

  const filteredSubcategories = subcategories.filter(s => s.category_slug === category);
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue management</p></div>
        <Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← পণ্য ব্যবস্থাপনা</Link>
      </header>
      <p className="mt-7 text-xs font-extrabold uppercase tracking-[.16em] text-[#a47b20]">Admin only · All marketplace categories</p>
      <h1 className="mt-2 text-3xl font-black">নতুন পণ্য যোগ করুন</h1>
      <p className="mt-2 text-sm leading-6 text-[#637266]">সাইটের সক্রিয় মূল ক্যাটাগরি থেকে নির্বাচন করুন। ছবি ও তথ্য যাচাই করে সংরক্ষণ করুন। নতুন পণ্য সরাসরি প্রকাশ হবে না—প্রথমে draft review-তে থাকবে।</p>
      {loading ? <p className="mt-6 rounded-xl bg-white p-5">ক্যাটাগরি ও বিক্রেতার তথ্য লোড হচ্ছে…</p> : <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm sm:p-7">
        <label className="block text-sm font-bold">বিক্রেতা / Farmer <select required value={farmerId} onChange={e=>setFarmerId(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal"><option value="">বিক্রেতা নির্বাচন করুন</option>{farmers.map(f=><option key={f.id} value={f.id}>{f.full_name || "নাম নেই"}{f.phone ? " · "+f.phone : ""}</option>)}</select></label>
        <label className="block text-sm font-bold">পণ্যের নাম <input required maxLength={160} value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" placeholder="যেমন: BRRI ধানের বীজ"/></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">মূল ক্যাটাগরি <select required value={category} onChange={e=>{setCategory(e.target.value);setSubcategory("");}} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal"><option value="">ক্যাটাগরি নির্বাচন করুন</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
          <label className="block text-sm font-bold">সাব-ক্যাটাগরি <select value={subcategory} onChange={e=>setSubcategory(e.target.value)} disabled={!category} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal disabled:bg-slate-100"><option value="">প্রযোজ্য হলে নির্বাচন করুন</option>{filteredSubcategories.map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}</select></label>
          <label className="block text-sm font-bold">দাম (৳) <input required type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal"/></label>
          <label className="block text-sm font-bold">স্টক <input required type="number" min="0" step="1" value={stock} onChange={e=>setStock(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal"/></label>
          <label className="block text-sm font-bold">রিসেলার কমিশন (%) <input required type="number" min="0" max="100" step="0.01" value={commission} onChange={e=>setCommission(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal"/></label>
        </div>
        <label className="block text-sm font-bold">পণ্যের ছবি (JPG/PNG/WebP, সর্বোচ্চ ৫ MB) <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImageFile(e.target.files?.[0] ?? null)} className="mt-1.5 block w-full rounded-xl border px-3 py-3 font-normal"/></label>
        <label className="block text-sm font-bold">পণ্যের বিবরণ <textarea maxLength={10000} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1.5 min-h-32 w-full rounded-xl border px-3 py-3 font-normal" placeholder="মান, জাত, প্যাকেটের ওজন, উৎপাদন/মেয়াদ বা ব্যবহারের তথ্য লিখুন"/></label>
        {message && <p role="status" className="rounded-xl border border-[#dfe8dc] bg-[#f7faf5] p-3 text-sm font-semibold">{message}</p>}
        <button disabled={saving || !farmers.length || !categories.length} className="w-full rounded-xl bg-[#173f2b] px-5 py-4 font-black text-white disabled:opacity-50">{saving ? "সংরক্ষণ হচ্ছে…" : "পণ্য যোগ করুন (Pending Review)"}</button>
        {!farmers.length && <p className="text-sm text-amber-800">কোনো Farmer account পাওয়া যায়নি। আগে বিক্রেতার account তৈরি/role ঠিক করুন।</p>}
      </form>}
    </div>
  </main>;
}
