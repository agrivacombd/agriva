"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

export default function CompanyProductForm() {
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category_slug: "seeds", subcategory_slug: "rice-seeds" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const selectedCategory = MARKETPLACE_CATEGORIES.find((item) => item.slug === form.category_slug);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setMessage("পণ্যের একটি ছবি নির্বাচন করুন।"); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("JPG, PNG বা WebP ছবি দিন; সর্বোচ্চ ৫ MB।");
      return;
    }
    const fileInput = event.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
    setBusy(true); setMessage(""); setSuccess(false);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { setMessage("সেশন শেষ হয়েছে। আবার লগইন করুন।"); return; }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = `${user.id}/company-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
        contentType: file.type, cacheControl: "3600", upsert: false,
      });
      if (uploadError) {
        setMessage("ছবি আপলোড হয়নি। Company image storage migration প্রয়োগ হয়েছে কি না যাচাই করুন।");
        return;
      }
      const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(path);
      const response = await fetch("/api/company/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url: publicData.publicUrl }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof result?.error === "string" ? result.error : "পণ্য জমা হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।");
        return;
      }
      setSuccess(true);
      setMessage("পণ্য moderation queue-তে জমা হয়েছে। অনুমোদনের আগে Marketplace-এ প্রকাশ হবে না।");
      setForm({ name: "", description: "", price: "", stock: "", category_slug: "seeds", subcategory_slug: "rice-seeds" });
      setFile(null);
      if (fileInput) fileInput.value = "";
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। জমা সফল হয়েছিল কি না নিশ্চিত না হওয়া পর্যন্ত একই পণ্য আবার তৈরি করবেন না; ড্যাশবোর্ডে তালিকা দেখুন।");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-emerald-900/10 bg-white p-5 sm:p-6">
    <div><h2 className="text-xl font-black">নতুন কোম্পানি পণ্য</h2><p className="mt-1 text-sm leading-6 text-slate-600">ছবি ও সঠিক পণ্যের তথ্য দিন। প্রতিটি নতুন পণ্য প্রথমে Draft/Pending moderation-এ থাকবে।</p></div>
    <label className="block text-sm font-bold">পণ্যের নাম *
      <input required minLength={2} maxLength={160} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: BRRI ধান বীজ — ১ কেজি" />
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold">ক্যাটাগরি *
        <select required value={form.category_slug} onChange={(e) => { const next = MARKETPLACE_CATEGORIES.find((item) => item.slug === e.target.value); setForm({ ...form, category_slug: e.target.value, subcategory_slug: next?.subcategories[0]?.slug || "" }); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">
          {MARKETPLACE_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold">সাব-ক্যাটাগরি *
        <select required value={form.subcategory_slug} onChange={(e) => setForm({ ...form, subcategory_slug: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">
          {(selectedCategory?.subcategories ?? []).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold">বিক্রয়মূল্য (৳) *
        <input required type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
      </label>
      <label className="block text-sm font-bold">স্টক / প্যাক সংখ্যা *
        <input required type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
      </label>
    </div>
    <label className="block text-sm font-bold">পণ্যের ছবি * (JPG, PNG, WebP; সর্বোচ্চ ৫ MB)
      <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1.5 block w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" />
    </label>
    <label className="block text-sm font-bold">পণ্যের বিবরণ
      <textarea maxLength={5000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="জাত/ভ্যারাইটি, প্যাক সাইজ, উৎপত্তি, বীজের মৌসুম, ব্যাচ বা লেবেলের তথ্য লিখুন।" />
    </label>
    <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">ভুল, বিভ্রান্তিকর বা লাইসেন্সবিহীন পণ্য-তথ্য দেবেন না। AGRIVA অনুমোদন না দেওয়া পর্যন্ত পণ্য public Marketplace-এ দেখাবে না।</p>
    <button disabled={busy} className="w-full rounded-xl bg-emerald-900 px-5 py-3.5 font-extrabold text-white disabled:opacity-50">{busy ? "ছবি ও পণ্য জমা হচ্ছে…" : "Moderation-এর জন্য পণ্য জমা দিন"}</button>
    {message && <p role="status" className={`rounded-xl p-3 text-sm leading-6 ${success ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>{message}</p>}
  </form>;
}
