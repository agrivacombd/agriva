"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const MAX_IMAGES = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminProductImages({ productId, initialUrls }: { productId: string; initialUrls: string[] }) {
  const [urls, setUrls] = useState(initialUrls.slice(0, MAX_IMAGES));
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function addFiles(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (urls.length + selected.length > MAX_IMAGES) { setMessage("সর্বোচ্চ ৪টি ছবি রাখা যাবে।"); return; }
    const invalid = selected.find(file => !ALLOWED_TYPES.includes(file.type));
    if (invalid) { setMessage("শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।"); return; }
    if (!selected.length) return;
    setBusy(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("আবার লগইন করুন।");
      const uploaded: string[] = [];
      for (const file of selected) {
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = user.id + "/" + crypto.randomUUID() + "." + ext;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
        if (error) throw new Error("ছবি আপলোড হয়নি। Storage policy ও project global limit যাচাই করুন।");
        uploaded.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
      }
      setUrls(current => [...current, ...uploaded]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ছবি আপলোড করা যায়নি।");
    } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/products/images", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, image_urls: urls }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ছবিগুলো সংরক্ষণ করা যায়নি।");
      setMessage("পণ্যের ছবিগুলো সংরক্ষণ হয়েছে।");
    } catch (error) { setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে।"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const next = urls.map(url => url);
    setPreviews(next);
  }, [urls]);

  return <section className="mt-4 rounded-xl border border-[#e2e9df] bg-[#fbfcfa] p-4 md:col-span-2 xl:col-span-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">Product images ({urls.length}/4)</p><span className="text-xs text-[#748074]">JPG, PNG, WebP · MB app limit নেই</span></div>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {previews.map((url, index) => <div key={url} className="relative"><img src={url} alt={"Product image " + (index + 1)} className="h-28 w-full rounded-lg border object-cover"/><button type="button" disabled={busy} onClick={() => setUrls(current => current.filter((_, i) => i !== index))} className="mt-1 text-xs font-bold text-red-700">ছবি সরান</button></div>)}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy || urls.length >= MAX_IMAGES} onChange={e => { void addFiles(e.target.files); e.currentTarget.value = ""; }} className="max-w-full text-sm"/>
      <button type="button" disabled={busy} onClick={save} className="rounded-lg bg-[#17452c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "অপেক্ষা করুন..." : "ছবি Save করুন"}</button>
    </div>
    <p className="mt-2 text-xs text-[#748074]">প্রতিটি ছবির আলাদা MB limit নেই; Supabase project-এর global upload limit প্রযোজ্য।</p>
    {message && <p role="status" className="mt-2 text-sm font-semibold">{message}</p>}
  </section>;
}
