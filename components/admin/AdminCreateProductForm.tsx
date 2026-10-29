"use client";

import { useEffect, useRef, useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const initial = {
  name: "",
  category_slug: "premium-food-grains",
  subcategory_slug: "edible-seeds",
  price: "",
  stock: "",
  commission: "",
  description: "",
  status: "draft",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminCreateProductForm() {
  const [form, setForm] = useState(initial);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const category = MARKETPLACE_CATEGORIES.find((item) => item.slug === form.category_slug);
  const set = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    let uploadedPath = "";
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

    try {
      let imageUrl: string | null = null;
      if (!imageFile) {
        setMessage("Draft তৈরি করার আগে পণ্যের ছবি নির্বাচন করুন।");
        return;
      }
      if (imageFile) {
        supabase = createSupabaseBrowserClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setMessage("ছবি আপলোডের আগে Admin হিসেবে লগইন করুন।");
          return;
        }

        const extension = imageFile.type === "image/jpeg" ? "jpg" : imageFile.type === "image/png" ? "png" : "webp";
        uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(uploadedPath, imageFile, {
          cacheControl: "3600",
          contentType: imageFile.type,
          upsert: false,
        });
        if (uploadError) {
          uploadedPath = "";
          setMessage("ছবি আপলোড করা যায়নি। Product image storage migration ও Admin permission যাচাই করুন।");
          return;
        }
        imageUrl = supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl;
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url: imageUrl }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (uploadedPath && supabase) await supabase.storage.from("product-images").remove([uploadedPath]).catch(() => undefined);
        uploadedPath = "";
        setMessage(typeof result?.error === "string" ? result.error : "পণ্য তৈরি করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।");
        return;
      }

      setMessage("পণ্যটি তৈরি হয়েছে। Draft হিসেবে রাখা হয়েছে; প্রকাশের আগে তথ্য ও ছবি যাচাই করুন।");
      setForm(initial);
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setPreviewUrl("");
    } catch {
      // Keep the uploaded object after an ambiguous network failure: the database
      // request may have succeeded even if the response never reached this browser.
      // Removing it here could leave a successfully-created product with a broken image.
      setMessage("নেটওয়ার্ক সমস্যা হয়েছে। আবার জমা দেওয়ার আগে Catalogue-এ পণ্যটি আছে কি না যাচাই করুন; ছবি সংরক্ষিত রাখা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-black">নতুন পণ্য যোগ করুন</h2>
        <p className="mt-1 text-sm text-[#637266]">বাস্তব মূল্য ও স্টক দিন। পণ্য প্রথমে Draft থাকবে। ছবি বাধ্যতামূলক; সর্বোচ্চ ৫ MB, JPEG/PNG/WebP।</p>
      </div>
      <label className="block text-sm font-bold">পণ্যের নাম
        <input required maxLength={160} value={form.name} onChange={(event) => set("name", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="যেমন: Chia Seed — 250g" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">ক্যাটাগরি
          <select required value={form.category_slug} onChange={(event) => {
            const next = MARKETPLACE_CATEGORIES.find((item) => item.slug === event.target.value);
            setForm((current) => ({ ...current, category_slug: event.target.value, subcategory_slug: next?.subcategories[0]?.slug || "" }));
          }} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal">
            {MARKETPLACE_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">সাব-ক্যাটাগরি
          <select required value={form.subcategory_slug} onChange={(event) => set("subcategory_slug", event.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal">
            {(category?.subcategories ?? []).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-bold">বিক্রয়মূল্য (৳)
          <input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="প্রকৃত বিক্রয়মূল্য" />
        </label>
        <label className="text-sm font-bold">স্টক / প্যাক সংখ্যা
          <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => set("stock", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="প্রকৃত স্টক" />
        </label>
        <label className="text-sm font-bold">রিসেলার কমিশন (%)
          <input required type="number" min="0" max="100" step="0.01" value={form.commission} onChange={(event) => set("commission", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" />
        </label>
      </div>
      <div className="space-y-2">
        <label htmlFor="product-image" className="block text-sm font-bold">পণ্যের ছবি (বাধ্যতামূলক)</label>
        <input
          id="product-image"
          ref={imageInputRef}
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            if (!selected) {
              setImageFile(null);
              setPreviewUrl("");
              return;
            }
            if (!IMAGE_TYPES.includes(selected.type) || selected.size > MAX_IMAGE_SIZE) {
              event.currentTarget.value = "";
              setImageFile(null);
              setPreviewUrl("");
              setMessage("শুধু JPEG, PNG বা WebP ছবি দিন; ফাইলের আকার ৫ MB-এর বেশি হতে পারবে না।");
              return;
            }
            setMessage("");
            setImageFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
          }}
          className="block w-full rounded-xl border px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold"
        />
        {imageFile && <p className="text-xs text-[#637266]">{imageFile.name} · {(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>}
        {previewUrl && <div role="img" aria-label="Selected product image preview" className="h-36 w-36 rounded-xl border bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${previewUrl}")` }} />}
      </div>
      <label className="block text-sm font-bold">বিবরণ
        <textarea maxLength={5000} rows={4} value={form.description} onChange={(event) => set("description", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" placeholder="প্যাক সাইজ, প্রকৃত উৎপত্তিস্থল, খাদ্য/বপনের ব্যবহার, প্যাকেজিং ও মেয়াদের তথ্য লিখুন।" />
      </label>
      <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">চিয়া সিডের ক্ষেত্রে নিশ্চিত করুন এটি মানুষের খাওয়ার উপযোগী। প্রতিটি প্যাক সাইজ (250g, 500g, 1kg) আলাদা পণ্য হিসেবে যোগ করুন, যদি দাম বা স্টক আলাদা হয়। উৎপত্তিস্থল পণ্যভেদে নিশ্চিত করে লিখুন।</p>
      <button disabled={loading} className="w-full rounded-xl bg-[#17452c] px-4 py-3 font-extrabold text-white disabled:opacity-50">{loading ? "তৈরি হচ্ছে..." : "Draft পণ্য তৈরি করুন"}</button>
      {message && <p role="status" className="text-sm font-semibold" aria-live="polite">{message}</p>}
    </form>
  );
}
