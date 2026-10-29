"use client";
import { useEffect, useRef, useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const INITIAL_FORM = { name: "", price: "", stock: "", description: "", category_slug: "", subcategory_slug: "" };
const MAX_PRODUCT_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_PLANT_DESCRIPTION_LENGTH = 80;

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max - 1);
  const boundary = slice.lastIndexOf(" ");
  return `${(boundary > max * 0.65 ? slice.slice(0, boundary) : slice).trim()}…`;
}

export default function ProductForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedCategory = MARKETPLACE_CATEGORIES.find((category) => category.slug === form.category_slug);
  const isPlantListing = form.category_slug === "plants-gardening";
  const descriptionText = plainText(form.description);
  const seoTitle = `${truncate(form.name.trim() || "আপনার পণ্যের নাম", isPlantListing ? 35 : 37)} | ${isPlantListing ? "AGRIVA Plant Market" : "AGRIVA Marketplace"}`;
  const seoDescription = truncate(
    descriptionText || (form.name.trim()
      ? `AGRIVA Plant Market-এ ${form.name.trim()} পণ্যের ছবি, মূল্য, বিবরণ ও মজুত দেখুন।`
      : "পণ্যের নাম ও উপকারী বিবরণ দিলে এখানে সার্চ ফলাফলের সম্ভাব্য বিবরণ দেখা যাবে।"),
    155,
  );
  const set = (key: keyof typeof INITIAL_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function chooseImages(fileList: FileList | null) {
    setMessage("");
    const selected = Array.from(fileList ?? []);
    if (selected.length > MAX_PRODUCT_IMAGES) {
      setImages([]); setPreviews([]); setMessage("সর্বোচ্চ ৪টি ছবি নির্বাচন করুন।"); return;
    }
    if (selected.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))) {
      setImages([]); setPreviews([]); setMessage("শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।"); return;
    }
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const nextPreviews = selected.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = nextPreviews;
    setImages(selected);
    setPreviews(nextPreviews);
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed);
      previewUrlsRef.current = current.filter((_, i) => i !== index);
      return current.filter((_, i) => i !== index);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (isPlantListing && images.length === 0) {
      setMessage("Plant Market-এর পণ্যের জন্য নিজের তোলা বা ব্যবহারের অধিকার থাকা পরিষ্কার ছবি আপলোড করুন।");
      setLoading(false);
      return;
    }
    if (isPlantListing && descriptionText.length < MIN_PLANT_DESCRIPTION_LENGTH) {
      setMessage(`Plant Market-এর বিবরণ অন্তত ${MIN_PLANT_DESCRIPTION_LENGTH} অক্ষরের হতে হবে। পণ্যের আকার, ধরন, উপাদান বা যত্নের তথ্য লিখুন।`);
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const uploadedPaths: string[] = [];
    try {
      const imageUrls: string[] = [];
      if (images.length) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("ছবি আপলোড করতে আবার লগইন করুন।");
        for (const image of images) {
          const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
          const uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from("product-images").upload(uploadedPath, image, {
            contentType: image.type,
            cacheControl: "3600",
            upsert: false,
          });
          if (uploadError) {
            console.error("Product image upload failed", { message: uploadError.message, size: image.size, type: image.type });
            throw new Error("ছবি আপলোড করা যায়নি। Storage bucket, account permission ও প্রকল্পের upload limit যাচাই করুন।");
          }
          uploadedPaths.push(uploadedPath);
          imageUrls.push(supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl);
        }
      }
      const imageUrl = imageUrls[0] ?? null;
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: descriptionText, image_url: imageUrl, image_urls: imageUrls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (uploadedPaths.length) {
          const { error: cleanupError } = await supabase.storage.from("product-images").remove(uploadedPaths);
          if (cleanupError) console.warn("Could not clean up rejected product images", cleanupError.message);
          else uploadedPaths.length = 0;
        }
        throw new Error(data.error || "পণ্য জমা দেওয়া যায়নি।");
      }
      uploadedPaths.length = 0;
      setMessage("পণ্যটি অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের আগে এটি মার্কেটপ্লেসে দেখাবে না।");
      setForm(INITIAL_FORM);
      setImages([]);
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      setPreviews([]);
    } catch (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from("product-images").remove(uploadedPaths);
        if (cleanupError) console.warn("Could not clean up partially uploaded product images", cleanupError.message);
        else uploadedPaths.length = 0;
      }
      setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm">
    <div>
      <label className="text-sm font-bold">পণ্যের নাম
        <input required minLength={3} maxLength={160} value={form.name} onChange={e=>set("name",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="যেমন: মানিপ্ল্যান্টের চারা ৬ ইঞ্চি টবে / কলমের লেবুর চারা"/>
      </label>
      <p className="mt-2 text-xs leading-5 text-[#748074]">সুনির্দিষ্ট নাম দিন: গাছ/পণ্যের ধরন + জাত বা মাপ (যদি জানা থাকে)। শুধু “সুন্দর গাছ” বা একই keyword বারবার লিখবেন না।</p>
    </div>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="text-sm font-bold">ক্যাটাগরি
        <select required value={form.category_slug} onChange={e=>{const next=MARKETPLACE_CATEGORIES.find(c=>c.slug===e.target.value);setForm(current=>({...current,category_slug:e.target.value,subcategory_slug:next?.subcategories[0]?.slug||""}));}} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">
          <option value="" disabled>ক্যাটাগরি নির্বাচন করুন</option>
          {MARKETPLACE_CATEGORIES.map(category=><option key={category.slug} value={category.slug}>{category.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">সাব-ক্যাটাগরি
        <select required value={form.subcategory_slug} onChange={e=>set("subcategory_slug",e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">
          {(selectedCategory?.subcategories??[]).map(sub=><option key={sub.slug} value={sub.slug}>{sub.name}</option>)}
        </select>
      </label>
    </div>
    <div className="grid gap-5 md:grid-cols-3">
      <label className="text-sm font-bold">মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
      <label className="text-sm font-bold">স্টক / প্যাক সংখ্যা<input required type="number" min="0" step="1" value={form.stock} onChange={e=>set("stock",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-bold" htmlFor="product-images">পণ্যের ছবি {isPlantListing ? <span className="font-normal text-red-700">(Plant Market-এর জন্য আবশ্যক)</span> : <span className="font-normal text-[#748074]">(ঐচ্ছিক)</span>}</label>
      <input id="product-images" required={isPlantListing} multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImages(e.target.files)} className="block w-full rounded-xl border px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf4e9] file:px-3 file:py-2 file:font-bold"/>
      <p className="text-xs leading-5 text-[#748074]">একসঙ্গে সর্বোচ্চ ৪টি JPG, PNG বা WebP ছবি দিন। অ্যাপে নির্দিষ্ট MB সীমা নেই; Storage প্রকল্পের নিজস্ব সীমা প্রযোজ্য হতে পারে। নিজের তোলা বা ব্যবহারের অধিকার থাকা পরিষ্কার ছবি দিন।</p>
      {previews.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{previews.map((url, index) => <div key={url} className="space-y-1"><img src={url} alt={`${form.name || "পণ্য"} — ছবি ${index + 1}`} className="h-28 w-full rounded-xl border object-cover"/><button type="button" onClick={()=>removeImage(index)} className="text-xs font-bold text-red-700">ছবি {index + 1} সরান</button></div>)}</div>}
    </div>
    <div>
      <label className="block text-sm font-bold">পণ্যের বিবরণ
        <textarea required={isPlantListing} minLength={isPlantListing ? MIN_PLANT_DESCRIPTION_LENGTH : undefined} maxLength={5000} value={form.description} onChange={e=>set("description",e.target.value)} className="mt-2 min-h-36 w-full rounded-xl border px-4 py-3" placeholder={isPlantListing ? "যেমন: মানিপ্ল্যান্টের চারা, আনুমানিক উচ্চতা, টবের মাপ, আলো-পানির প্রয়োজন, কী অন্তর্ভুক্ত, ডেলিভারির তথ্য..." : "পণ্যের ধরন, মাপ, উপাদান, ব্যবহার ও ডেলিভারি-সংক্রান্ত তথ্য দিন..."}/>
      </label>
      <div className="mt-2 flex justify-between gap-3 text-xs text-[#748074]"><span>{descriptionText.length}/5000 অক্ষর{isPlantListing ? ` · কমপক্ষে ${MIN_PLANT_DESCRIPTION_LENGTH}` : ""}</span><span>সার্চ বিবরণে সাধারণত প্রথম ১৫৫ অক্ষর কাজে লাগে</span></div>
      {isPlantListing && descriptionText.length < MIN_PLANT_DESCRIPTION_LENGTH && <p className="mt-2 text-xs font-semibold text-amber-800">আরও নির্দিষ্ট তথ্য যোগ করুন—শুধু keyword-এর তালিকা নয়, ক্রেতার কাজে লাগে এমন বিবরণ লিখুন।</p>}
    </div>

    <section aria-labelledby="seo-preview-heading" className="rounded-2xl border border-emerald-900/15 bg-[#f7faf5] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="seo-preview-heading" className="font-extrabold">Google search preview</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">স্বয়ংক্রিয় SEO</span></div>
      <p className="mt-1 text-xs leading-5 text-[#748074]">প্রকাশিত পণ্যের নাম ও বিবরণ থেকে পেজের title, meta description, canonical URL ও schema স্বয়ংক্রিয়ভাবে তৈরি হবে—আলাদা SEO ফিল্ড মুখস্থ করতে হবে না।</p>
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs text-emerald-800">agriva.com.bd/marketplace/{form.name.trim() ? "product-slug" : "..."}</p>
        <p className="mt-1 text-lg font-medium leading-snug text-[#1a0dab]">{seoTitle}</p>
        <p className="mt-1 text-sm leading-6 text-[#4d5156]">{seoDescription}</p>
      </div>
      <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#536456] sm:grid-cols-2">
        <li>{form.name.trim().length >= 3 ? "✓" : "○"} নির্দিষ্ট পণ্যের নাম</li>
        <li>{selectedCategory ? "✓" : "○"} সঠিক ক্যাটাগরি</li>
        <li>{images.length > 0 || !isPlantListing ? "✓" : "○"} {isPlantListing ? "নিজস্ব পণ্যের ছবি" : "পণ্যের ছবি (ঐচ্ছিক)"}</li>
        <li>{descriptionText.length >= MIN_PLANT_DESCRIPTION_LENGTH || (!isPlantListing && descriptionText.length > 0) ? "✓" : "○"} উপকারী, অনন্য বিবরণ</li>
      </ul>
    </section>

    <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">গাছের জন্য জাত/ধরন, আনুমানিক উচ্চতা, টবের মাপ ও যত্নের প্রয়োজন; টবের জন্য মাপ ও উপাদান; বীজ/মাটির জন্য প্যাক সাইজ ও উপাদান দিন। ভুল বা অপ্রমাণিত তথ্য দেবেন না। অ্যাডমিন যাচাই ও অনুমোদনের আগে পণ্য প্রকাশ হবে না।</p>
    <button disabled={loading} className="w-full rounded-2xl bg-[#17351f] px-5 py-4 font-black text-white disabled:opacity-50">{loading ? "জমা হচ্ছে..." : "SEO তথ্যসহ পর্যালোচনার জন্য জমা দিন"}</button>
    {message&&<p role="status" className="text-sm font-semibold text-[#1f7a45]">{message}</p>}
  </form>;
}
