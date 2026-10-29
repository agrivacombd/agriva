"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const INITIAL_FORM = {
  name: "", price: "", stock: "", description: "", category_slug: "", subcategory_slug: "", brand: "",
};
const INITIAL_ATTRIBUTES: Record<string, string> = {};
const MAX_PRODUCT_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_PLANT_DESCRIPTION_LENGTH = 80;

type SellerProfile = {
  full_name: string;
  phone: string;
  business_name: string;
  business_address: string;
  business_district: string;
  trade_license_number: string;
  trade_license_expiry: string;
  seed_registration_number: string;
  other_registration_details: string;
};

const EMPTY_SELLER_PROFILE: SellerProfile = {
  full_name: "", phone: "", business_name: "", business_address: "", business_district: "",
  trade_license_number: "", trade_license_expiry: "", seed_registration_number: "", other_registration_details: "",
};

const CATEGORY_FIELDS: Record<string, Array<{ key: string; label: string; placeholder?: string; type?: string; required?: boolean }>> = {
  seeds: [
    { key: "crop_name", label: "ফসলের নাম", placeholder: "যেমন: ধান, টমেটো" },
    { key: "variety", label: "বীজের জাত / variety", placeholder: "প্যাকেট বা লেবেল অনুযায়ী" },
    { key: "pack_size", label: "প্যাক সাইজ", placeholder: "যেমন: ১০০ গ্রাম, ১ কেজি", required: true },
    { key: "germination_rate", label: "Germination rate (%)", placeholder: "পরীক্ষিত তথ্য থাকলে" },
    { key: "batch_number", label: "Lot / batch number", placeholder: "লেবেলে থাকলে" },
    { key: "expiry_date", label: "মেয়াদ শেষের তারিখ", type: "date" },
  ],
  fertilizer: [
    { key: "fertilizer_type", label: "সারের ধরন", placeholder: "যেমন: জৈব সার, NPK" },
    { key: "composition", label: "Composition / NPK ratio", placeholder: "লেবেল অনুযায়ী" },
    { key: "pack_size", label: "প্যাক সাইজ", placeholder: "যেমন: ১ কেজি, ৫ লিটার", required: true },
    { key: "batch_number", label: "Batch number", placeholder: "লেবেলে থাকলে" },
    { key: "expiry_date", label: "মেয়াদ শেষের তারিখ", type: "date" },
    { key: "usage_instructions", label: "ব্যবহারবিধি", placeholder: "লেবেলের নির্দেশনা অনুযায়ী" },
  ],
  "crop-protection": [
    { key: "active_ingredient", label: "Active ingredient", placeholder: "শুধু পণ্যের লেবেল অনুযায়ী" },
    { key: "composition", label: "Composition / concentration", placeholder: "লেবেল অনুযায়ী" },
    { key: "pack_size", label: "প্যাক সাইজ", placeholder: "যেমন: ১০০ মিলি", required: true },
    { key: "registration_number", label: "Registration number", placeholder: "থাকলে" },
    { key: "expiry_date", label: "মেয়াদ শেষের তারিখ", type: "date" },
    { key: "usage_instructions", label: "ব্যবহার ও সতর্কতা", placeholder: "অনুমোদিত label অনুযায়ী" },
  ],
  "plants-gardening": [
    { key: "variety", label: "গাছের জাত / variety", placeholder: "যদি জানা থাকে" },
    { key: "plant_size", label: "গাছের উচ্চতা / আকার", placeholder: "যেমন: ২৫–৩০ সেমি" },
    { key: "suitable_season", label: "উপযুক্ত মৌসুম", placeholder: "যদি প্রযোজ্য হয়" },
    { key: "care_instructions", label: "আলো, পানি ও যত্ন", placeholder: "ক্রেতার জন্য কার্যকর নির্দেশনা" },
  ],
  "tools-equipment": [
    { key: "model", label: "Model", placeholder: "মডেল নম্বর থাকলে" },
    { key: "material", label: "উপাদান / material", placeholder: "যেমন: stainless steel" },
    { key: "dimensions", label: "মাপ / dimensions", placeholder: "যদি জানা থাকে" },
    { key: "warranty", label: "Warranty", placeholder: "যদি প্রযোজ্য হয়" },
    { key: "usage_instructions", label: "ব্যবহারবিধি", placeholder: "নিরাপদ ব্যবহারের নির্দেশনা" },
  ],
  "premium-food-grains": [
    { key: "food_type", label: "পণ্যের ধরন", placeholder: "যেমন: খাদ্যোপযোগী চিয়া সিড" },
    { key: "pack_size", label: "প্যাক সাইজ", placeholder: "যেমন: ২৫০ গ্রাম", required: true },
    { key: "ingredients", label: "উপাদান", placeholder: "প্যাকেটের তথ্য অনুযায়ী" },
    { key: "origin", label: "উৎপত্তিস্থল", placeholder: "শুধু নিশ্চিত হলে" },
    { key: "expiry_date", label: "মেয়াদ শেষের তারিখ", type: "date" },
  ],
};

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
  const [attributes, setAttributes] = useState<Record<string, string>>(INITIAL_ATTRIBUTES);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>(EMPTY_SELLER_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const selectedCategory = MARKETPLACE_CATEGORIES.find((category) => category.slug === form.category_slug);
  const isPlantListing = form.category_slug === "plants-gardening";
  const descriptionText = plainText(form.description);
  const categoryFields = useMemo(() => CATEGORY_FIELDS[form.category_slug] ?? [
    { key: "pack_size", label: "প্যাক সাইজ / পরিমাণ", placeholder: "যদি প্রযোজ্য হয়" },
    { key: "model", label: "Brand / model", placeholder: "যদি থাকে" },
    { key: "usage_instructions", label: "ব্যবহারবিধি", placeholder: "প্রাসঙ্গিক হলে" },
  ], [form.category_slug]);
  const seoTitle = `${truncate(form.name.trim() || "আপনার পণ্যের নাম", isPlantListing ? 35 : 37)} | ${isPlantListing ? "AGRIVA Plant Market" : "AGRIVA Marketplace"}`;
  const seoDescription = truncate(
    descriptionText || (form.name.trim()
      ? `AGRIVA-তে ${form.name.trim()} পণ্যের ছবি, মূল্য, বিবরণ ও মজুত দেখুন।`
      : "পণ্যের নাম ও উপকারী বিবরণ দিলে এখানে সার্চ ফলাফলের সম্ভাব্য বিবরণ দেখা যাবে।"),
    155,
  );
  const set = (key: keyof typeof INITIAL_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setProfile = (key: keyof SellerProfile, value: string) => setSellerProfile((current) => ({ ...current, [key]: value }));
  const setAttribute = (key: string, value: string) => setAttributes((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setProfileLoaded(true); return; }
      const { data, error } = await supabase.from("profiles")
        .select("full_name,phone,business_name,business_address,business_district,trade_license_number,trade_license_expiry,seed_registration_number,other_registration_details")
        .eq("id", user.id).maybeSingle();
      if (!cancelled) {
        if (!error && data) {
          setSellerProfile({
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            business_name: data.business_name ?? "",
            business_address: data.business_address ?? "",
            business_district: data.business_district ?? "",
            trade_license_number: data.trade_license_number ?? "",
            trade_license_expiry: data.trade_license_expiry ?? "",
            seed_registration_number: data.seed_registration_number ?? "",
            other_registration_details: data.other_registration_details ?? "",
          });
        }
        setProfileLoaded(true);
      }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function chooseImages(fileList: FileList | null) {
    setMessage("");
    const selected = Array.from(fileList ?? []);
    if (selected.length > MAX_PRODUCT_IMAGES) {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      setImages([]); setPreviews([]); setMessage("সর্বোচ্চ ৪টি ছবি নির্বাচন করুন।"); return;
    }
    if (selected.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))) {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
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

  function nextStep() {
    setMessage("");
    if (formRef.current?.reportValidity()) setStep((current) => Math.min(current + 1, 3));
  }

  function previousStep() {
    setMessage("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (!images.length) {
      setMessage("পণ্যের অন্তত একটি পরিষ্কার ছবি আপলোড করুন।");
      setLoading(false);
      setStep(2);
      return;
    }
    if (isPlantListing && descriptionText.length < MIN_PLANT_DESCRIPTION_LENGTH) {
      setMessage(`Plant Market-এর বিবরণ অন্তত ${MIN_PLANT_DESCRIPTION_LENGTH} অক্ষরের হতে হবে। পণ্যের আকার, ধরন বা যত্নের তথ্য লিখুন।`);
      setLoading(false);
      setStep(1);
      return;
    }
    if (attributes.germination_rate && (!Number.isFinite(Number(attributes.germination_rate)) || Number(attributes.germination_rate) < 0 || Number(attributes.germination_rate) > 100)) {
      setMessage("Germination rate ০ থেকে ১০০-এর মধ্যে দিন।");
      setLoading(false);
      setStep(1);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const uploadedPaths: string[] = [];
    try {
      const imageUrls: string[] = [];
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("পণ্য জমা দিতে আবার লগইন করুন।");
      for (const image of images) {
        const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
        const uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(uploadedPath, image, {
          contentType: image.type, cacheControl: "3600", upsert: false,
        });
        if (uploadError) {
          console.error("Product image upload failed", { message: uploadError.message, size: image.size, type: image.type });
          throw new Error("ছবি আপলোড করা যায়নি। Storage bucket, account permission ও প্রকল্পের upload limit যাচাই করুন।");
        }
        uploadedPaths.push(uploadedPath);
        imageUrls.push(supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl);
      }

      const cleanedAttributes = Object.fromEntries(Object.entries({ ...attributes, brand: form.brand }).map(([key, value]) => [key, value.trim()]).filter(([, value]) => Boolean(value)));
      const response = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: descriptionText,
          image_url: imageUrls[0] ?? null,
          image_urls: imageUrls,
          product_attributes: cleanedAttributes,
          seller_profile: {
            business_name: sellerProfile.business_name,
            business_address: sellerProfile.business_address,
            business_district: sellerProfile.business_district,
            trade_license_number: sellerProfile.trade_license_number,
            trade_license_expiry: sellerProfile.trade_license_expiry,
            seed_registration_number: sellerProfile.seed_registration_number,
            other_registration_details: sellerProfile.other_registration_details,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (uploadedPaths.length) {
          const { error: cleanupError } = await supabase.storage.from("product-images").remove(uploadedPaths);
          if (cleanupError) console.warn("Could not clean up rejected product images", cleanupError.message);
          else uploadedPaths.length = 0;
        }
        throw new Error(result.error || "পণ্য জমা দেওয়া যায়নি।");
      }
      uploadedPaths.length = 0;
      setMessage("পণ্যটি অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের আগে এটি মার্কেটপ্লেসে দেখাবে না।");
      setForm(INITIAL_FORM);
      setAttributes(INITIAL_ATTRIBUTES);
      setImages([]);
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      setPreviews([]);
      setStep(0);
    } catch (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from("product-images").remove(uploadedPaths);
        if (cleanupError) console.warn("Could not clean up partially uploaded product images", cleanupError.message);
      }
      setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["পণ্যের পরিচয়", "বিস্তারিত তথ্য", "ছবি ও seller তথ্য", "Preview ও submit"];

  return <form ref={formRef} onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">Product listing wizard · ধাপ {step + 1}/4</p>
      <div className="mt-3 grid grid-cols-4 gap-2" aria-label="পণ্য যোগ করার ধাপ">
        {steps.map((label, index) => <div key={label} className={`h-1.5 rounded-full ${index <= step ? "bg-[#17452c]" : "bg-[#e4eae1]"}`} />)}
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#748074]"><span>{steps[step]}</span><span>আপনার তথ্য আগে save না হওয়া পর্যন্ত submit হবে না</span></div>
    </div>

    {step === 0 && <section className="space-y-5">
      <label className="block text-sm font-bold">পণ্যের নাম
        <input required minLength={3} maxLength={160} value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="যেমন: BRRI ধানের বীজ — ১ কেজি" />
      </label>
      <p className="-mt-3 text-xs leading-5 text-[#748074]">সুনির্দিষ্ট নাম দিন: পণ্যের ধরন + জাত/মাপ (যদি জানা থাকে)। keyword বারবার লিখবেন না।</p>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-bold">ক্যাটাগরি
          <select required value={form.category_slug} onChange={(e) => { const next = MARKETPLACE_CATEGORIES.find((category) => category.slug === e.target.value); setForm((current) => ({ ...current, category_slug: e.target.value, subcategory_slug: next?.subcategories[0]?.slug || "" })); setAttributes({}); }} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">
            <option value="" disabled>ক্যাটাগরি নির্বাচন করুন</option>
            {MARKETPLACE_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">সাব-ক্যাটাগরি
          <select required value={form.subcategory_slug} onChange={(e) => set("subcategory_slug", e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">
            {(selectedCategory?.subcategories ?? []).map((subcategory) => <option key={subcategory.slug} value={subcategory.slug}>{subcategory.name}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-bold">Brand / manufacturer <span className="font-normal text-[#748074]">(জানা থাকলে)</span>
        <input maxLength={160} value={form.brand} onChange={(e) => set("brand", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="প্যাকেট বা পণ্যের লেবেল অনুযায়ী" />
      </label>
    </section>}

    {step === 1 && <section className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-bold">মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" /></label>
        <label className="text-sm font-bold">স্টক / প্যাক সংখ্যা<input required type="number" min="0" step="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" /></label>
      </div>
      <label className="block text-sm font-bold">পণ্যের বিবরণ
        <textarea required minLength={isPlantListing ? MIN_PLANT_DESCRIPTION_LENGTH : 30} maxLength={5000} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-2 min-h-36 w-full rounded-xl border px-4 py-3" placeholder="পণ্যের ধরন, মাপ, উপাদান, ব্যবহার, যত্ন বা ডেলিভারি-সংক্রান্ত বাস্তব তথ্য দিন..." />
      </label>
      <div className="flex justify-between gap-3 text-xs text-[#748074]"><span>{descriptionText.length}/5000 অক্ষর{isPlantListing ? ` · কমপক্ষে ${MIN_PLANT_DESCRIPTION_LENGTH}` : ""}</span><span>সত্য ও নির্দিষ্ট তথ্য দিন</span></div>
      {isPlantListing && descriptionText.length < MIN_PLANT_DESCRIPTION_LENGTH && <p className="text-xs font-semibold text-amber-800">আরও নির্দিষ্ট তথ্য যোগ করুন—শুধু keyword-এর তালিকা নয়।</p>}
      {categoryFields.length > 0 && <div className="rounded-2xl border border-[#dfe8dc] p-4">
        <h2 className="font-extrabold">{selectedCategory?.name ?? "পণ্য"}-এর অতিরিক্ত তথ্য</h2>
        <p className="mt-1 text-xs leading-5 text-[#748074]">পণ্যের লেবেল বা নির্ভরযোগ্য তথ্য অনুযায়ী পূরণ করুন। যেগুলো জানা নেই সেগুলো ফাঁকা রাখতে পারবেন।</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {categoryFields.map((field) => <label key={field.key} className="text-sm font-bold">{field.label}
            <input type={field.type ?? "text"} required={Boolean(field.required)} maxLength={field.key === "usage_instructions" || field.key === "care_instructions" ? 1000 : 160} value={attributes[field.key] ?? ""} onChange={(e) => setAttribute(field.key, e.target.value)} placeholder={field.placeholder} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" />
          </label>)}
        </div>
      </div>}
    </section>}

    {step === 2 && <section className="space-y-5">
      <div>
        <label className="block text-sm font-bold" htmlFor="product-images">পণ্যের ছবি <span className="font-normal text-red-700">(কমপক্ষে ১টি আবশ্যক)</span></label>
        <input id="product-images" required={images.length === 0} multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseImages(e.target.files)} className="mt-2 block w-full rounded-xl border px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf4e9] file:px-3 file:py-2 file:font-bold" />
        <p className="mt-2 text-xs leading-5 text-[#748074]">সর্বোচ্চ ৪টি JPG, PNG বা WebP ছবি। অ্যাপে নির্দিষ্ট MB সীমা নেই; Storage প্রকল্পের নিজস্ব সীমা প্রযোজ্য হতে পারে।</p>
        {previews.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{previews.map((url, index) => <div key={url} className="space-y-1"><img src={url} alt={`${form.name || "পণ্য"} — ছবি ${index + 1}`} className="h-28 w-full rounded-xl border object-cover" /><button type="button" onClick={() => removeImage(index)} className="text-xs font-bold text-red-700">ছবি {index + 1} সরান</button></div>)}</div>}
      </div>
      <div className="rounded-2xl border border-[#dfe8dc] p-4">
        <h2 className="font-extrabold">Seller ও business information</h2>
        <p className="mt-1 text-xs leading-5 text-[#748074]">Account profile থেকে থাকা তথ্য auto-fill করা হয়েছে। এখানে পরিবর্তন করলে seller profile-এও save হবে। Licence তথ্য optional; জমা দেওয়া তথ্য নিজে থেকে verified হিসেবে গণ্য হবে না.</p>
        {!profileLoaded && <p className="mt-2 text-xs text-emerald-800">Profile তথ্য লোড হচ্ছে...</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Seller name<input readOnly value={sellerProfile.full_name} className="mt-1.5 w-full rounded-xl border bg-slate-50 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Phone<input readOnly value={sellerProfile.phone} className="mt-1.5 w-full rounded-xl border bg-slate-50 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Business / shop name<input maxLength={160} value={sellerProfile.business_name} onChange={(e) => setProfile("business_name", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">District<input maxLength={100} value={sellerProfile.business_district} onChange={(e) => setProfile("business_district", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold sm:col-span-2">Business address<input maxLength={300} value={sellerProfile.business_address} onChange={(e) => setProfile("business_address", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Trade licence number <span className="font-normal text-[#748074]">(optional)</span><input maxLength={100} value={sellerProfile.trade_license_number} onChange={(e) => setProfile("trade_license_number", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Trade licence expiry <span className="font-normal text-[#748074]">(optional)</span><input type="date" value={sellerProfile.trade_license_expiry} onChange={(e) => setProfile("trade_license_expiry", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Seed registration / dealer licence <span className="font-normal text-[#748074]">(optional)</span><input maxLength={100} value={sellerProfile.seed_registration_number} onChange={(e) => setProfile("seed_registration_number", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Other applicable registration <span className="font-normal text-[#748074]">(optional)</span><input maxLength={500} value={sellerProfile.other_registration_details} onChange={(e) => setProfile("other_registration_details", e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
        </div>
      </div>
    </section>}

    {step === 3 && <section className="space-y-5">
      <section aria-labelledby="seo-preview-heading" className="rounded-2xl border border-emerald-900/15 bg-[#f7faf5] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="seo-preview-heading" className="font-extrabold">Google search preview</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">Preview only</span></div>
        <p className="mt-1 text-xs leading-5 text-[#748074]">Seller-এর দেওয়া নাম ও বিবরণ থেকে সম্ভাব্য search preview। Admin পরে AI সাহায্যে SEO title, description, content ও FAQ উন্নত করতে পারবে।</p>
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-emerald-800">agriva.com.bd/marketplace/product-slug</p>
          <p className="mt-1 text-lg font-medium leading-snug text-[#1a0dab]">{seoTitle}</p>
          <p className="mt-1 text-sm leading-6 text-[#4d5156]">{seoDescription}</p>
        </div>
        <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#536456] sm:grid-cols-2">
          <li>{form.name.trim().length >= 3 ? "✓" : "○"} নির্দিষ্ট পণ্যের নাম</li>
          <li>{selectedCategory ? "✓" : "○"} সঠিক ক্যাটাগরি</li>
          <li>{images.length > 0 ? "✓" : "○"} পণ্যের ছবি</li>
          <li>{descriptionText.length >= MIN_PLANT_DESCRIPTION_LENGTH || (!isPlantListing && descriptionText.length > 0) ? "✓" : "○"} উপকারী বিবরণ</li>
        </ul>
      </section>
      <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-extrabold">Submit করার আগে নিশ্চিত করুন</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>পণ্যের তথ্য ও ছবির ব্যবহার করার অধিকার আপনার আছে।</li>
          <li>Licence/registration তথ্য সঠিক; জমা দেওয়া তথ্য verified badge নয়।</li>
          <li>অজানা germination, certification, ফলন বা composition দাবি যোগ করা হয়নি।</li>
          <li>Admin review ও প্রয়োজনীয় compliance check শেষ না হওয়া পর্যন্ত product public হবে না।</li>
        </ul>
      </div>
    </section>}

    <div className="flex flex-wrap gap-3 border-t border-[#e4eae1] pt-5">
      {step > 0 && <button type="button" onClick={previousStep} disabled={loading} className="rounded-xl border border-[#cbd7c9] px-5 py-3 font-bold text-[#17452c] disabled:opacity-50">পেছনে</button>}
      {step < 3 && <button type="button" onClick={nextStep} className="ml-auto rounded-xl bg-[#17452c] px-5 py-3 font-extrabold text-white">পরের ধাপ →</button>}
      {step === 3 && <button type="submit" disabled={loading} className="ml-auto rounded-xl bg-[#17351f] px-5 py-3 font-black text-white disabled:opacity-50">{loading ? "জমা হচ্ছে..." : "Admin review-এর জন্য জমা দিন"}</button>}
    </div>
    {message && <p role="status" aria-live="polite" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-[#1f7a45]">{message}</p>}
  </form>;
}
