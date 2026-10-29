"use client";
import { useEffect, useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const INITIAL_FORM = { name: "", price: "", stock: "", description: "", category_slug: "", subcategory_slug: "" };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProductForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedCategory = MARKETPLACE_CATEGORIES.find((category) => category.slug === form.category_slug);
  const set = (key: keyof typeof INITIAL_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function chooseImage(file?: File) {
    setMessage("");
    if (!file) { setImage(null); setPreview(""); return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImage(null); setPreview(""); setMessage("শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।"); return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImage(null); setPreview(""); setMessage("ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।"); return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    let uploadedPath: string | null = null;
    try {
      let imageUrl: string | null = null;
      if (image) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("ছবি আপলোড করতে আবার লগইন করুন।");
        const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
        uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(uploadedPath, image, {
          contentType: image.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) {
          uploadedPath = null;
          console.error("Product image upload failed", uploadError.message);
          throw new Error("ছবি আপলোড করা যায়নি। আপনার seller account ও Storage policy যাচাই করুন।");
        }
        imageUrl = supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl;
      }
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url: imageUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // The API explicitly rejected the product, so remove its just-uploaded orphan image.
        if (uploadedPath) {
          const { error: cleanupError } = await supabase.storage.from("product-images").remove([uploadedPath]);
          if (cleanupError) console.warn("Could not clean up rejected product image", cleanupError.message);
          else uploadedPath = null;
        }
        throw new Error(data.error || "পণ্য জমা দেওয়া যায়নি।");
      }
      uploadedPath = null;
      setMessage("পণ্যটি অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের আগে এটি মার্কেটপ্লেসে দেখাবে না।");
      setForm(INITIAL_FORM);
      setImage(null);
      setPreview("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm">
    <div><label className="text-sm font-bold">পণ্যের নাম<input required maxLength={160} value={form.name} onChange={e=>set("name",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="যেমন: মানিপ্ল্যান্ট / কলমের লেবুর চারা / মাটির টব"/></label></div>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="text-sm font-bold">ক্যাটাগরি<select required value={form.category_slug} onChange={e=>{const next=MARKETPLACE_CATEGORIES.find(c=>c.slug===e.target.value);setForm(current=>({...current,category_slug:e.target.value,subcategory_slug:next?.subcategories[0]?.slug||""}));}} className="mt-2 w-full rounded-xl border bg-white px-4 py-3"><option value="" disabled>ক্যাটাগরি নির্বাচন করুন</option>{MARKETPLACE_CATEGORIES.map(category=><option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
      <label className="text-sm font-bold">সাব-ক্যাটাগরি<select required value={form.subcategory_slug} onChange={e=>set("subcategory_slug",e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">{(selectedCategory?.subcategories??[]).map(sub=><option key={sub.slug} value={sub.slug}>{sub.name}</option>)}</select></label>
    </div>
    <div className="grid gap-5 md:grid-cols-3">
      <label className="text-sm font-bold">মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
      <label className="text-sm font-bold">স্টক / প্যাক সংখ্যা<input required type="number" min="0" step="1" value={form.stock} onChange={e=>set("stock",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-bold" htmlFor="product-image">পণ্যের ছবি <span className="font-normal text-[#748074]">(ঐচ্ছিক, সর্বোচ্চ ৫ MB)</span></label>
      <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImage(e.target.files?.[0])} className="block w-full rounded-xl border px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf4e9] file:px-3 file:py-2 file:font-bold"/>
      {preview && <div className="flex items-center gap-4"><img src={preview} alt="পণ্যের ছবির preview" className="h-28 w-28 rounded-xl border object-cover"/><button type="button" onClick={()=>chooseImage()} className="text-sm font-bold text-red-700">ছবি সরান</button></div>}
      <p className="text-xs text-[#748074]">JPG, PNG বা WebP। আপনার নিজের ছবি ব্যবহার করুন।</p>
    </div>
    <div><label className="text-sm font-bold">পণ্যের বিবরণ<textarea maxLength={5000} value={form.description} onChange={e=>set("description",e.target.value)} className="mt-2 min-h-32 w-full rounded-xl border px-4 py-3" placeholder="গাছের ধরন, উচ্চতা, টবের মাপ, উপাদান, যত্ন ও ডেলিভারি-সংক্রান্ত তথ্য দিন..."/></label></div>
    <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">গাছের জন্য জাত, উচ্চতা ও যত্ন; টবের জন্য মাপ ও উপাদান; বীজ/মাটির জন্য প্যাক সাইজ ও উপাদান দিন। যাচাই ও অনুমোদনের আগে পণ্য প্রকাশ হবে না। রিসেলার কমিশন প্ল্যাটফর্মের নীতিমালা অনুযায়ী নির্ধারিত হবে।</p>
    <button disabled={loading} className="w-full rounded-2xl bg-[#17351f] px-5 py-4 font-black text-white disabled:opacity-50">{loading ? "জমা হচ্ছে..." : "পর্যালোচনার জন্য জমা দিন"}</button>
    {message&&<p role="status" className="text-sm font-semibold text-[#1f7a45]">{message}</p>}
  </form>;
}
