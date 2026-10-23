"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = { initialUrl?: string | null; initialAlt?: string | null; suggestedAlt?: string; };

const SIZE = 1200;
const MAX_BYTES = 3 * 1024 * 1024;

export default function ProductImageOptimizer({ initialUrl = "", initialAlt = "", suggestedAlt = "" }: Props) {
  const [imageUrl, setImageUrl] = useState(initialUrl || "");
  const [alt, setAlt] = useState(initialAlt || suggestedAlt);
  const [quality, setQuality] = useState(84);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function processImage(file: File) {
    setBusy(true);
    setMessage("");
    try {
      if (!file.type.startsWith("image/")) throw new Error("একটি image file বাছুন।");
      if (file.size > 15 * 1024 * 1024) throw new Error("মূল ছবি ১৫ MB-এর কম হতে হবে।");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("এই browser-এ image processing চালু করা যায়নি।");
      ctx.fillStyle = "#f8fbf6";
      ctx.fillRect(0, 0, SIZE, SIZE);
      const scale = Math.min(SIZE / bitmap.width, SIZE / bitmap.height, 1);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, Math.round((SIZE - width) / 2), Math.round((SIZE - height) / 2), width, height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality / 100));
      if (!blob || blob.type !== "image/webp") throw new Error("এই browser WebP export সমর্থন করছে না। Chrome বা Safari-এর নতুন সংস্করণ ব্যবহার করুন।");
      if (blob.size > MAX_BYTES) throw new Error("ছবিটি ৩ MB-এর বেশি হচ্ছে। Quality কমিয়ে আবার চেষ্টা করুন।");
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("লগইন সেশন পাওয়া যায়নি। আবার লগইন করুন।");
      const path = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, blob, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message.includes("row-level security") ? "Super Admin অনুমতি refresh করতে logout করে আবার login করুন।" : uploadError.message);
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      setMessage(`Optimized: 1200×1200 WebP · ${(blob.size / 1024).toFixed(0)} KB · quality ${quality}%`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ছবি optimize করা যায়নি।");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <div className="rounded-xl border border-emerald-950/10 bg-[#f8fbf6] p-3 sm:p-4">
    <input type="hidden" name="image_url" value={imageUrl} />
    <input type="hidden" name="image_processing" value={busy ? "true" : "false"} />
    <label className="block text-sm font-bold">পণ্যের ছবি <span className="font-normal text-slate-500">(ঐচ্ছিক)</span>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void processImage(file); }} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-900 file:px-3 file:py-2 file:font-bold file:text-white" />
    </label>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-bold text-slate-700">Image quality: {quality}%
        <input type="range" min="60" max="95" step="1" value={quality} disabled={busy} onChange={(event) => setQuality(Number(event.target.value))} />
      </label>
      {busy && <span role="status" className="text-xs font-bold text-emerald-800">ছবি optimize ও upload হচ্ছে…</span>}
    </div>
    <p className="mt-2 text-xs leading-5 text-slate-600">স্বয়ংক্রিয়ভাবে square 1200×1200 WebP-তে রূপান্তর হয়; ছবির অনুপাত না কেটে চারপাশে জায়গা রাখা হয়। ৩ MB সীমা ও quality control মোবাইল লোড দ্রুত রাখতে সাহায্য করে।</p>
    {imageUrl && <div className="mt-3 flex items-center gap-3"><img src={imageUrl} alt={alt || suggestedAlt || "Product image preview"} className="h-20 w-20 rounded-lg border bg-white object-contain" /><button type="button" onClick={() => { setImageUrl(""); setMessage("ছবির URL সরানো হয়েছে; সংরক্ষণ করলে পণ্য থেকে ছবিটি বাদ যাবে।"); }} className="text-xs font-bold text-red-700 underline">ছবি সরান</button></div>}
    <label className="mt-3 block text-sm font-bold">ছবির Alt text (SEO)
      <input name="image_alt" value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={180} placeholder="যেমন: সবজি চাষের উচ্চমানের টমেটো বীজের প্যাকেট" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 font-normal" />
    </label>
    {message && <p role="status" className="mt-2 text-xs leading-5 text-slate-700">{message}</p>}
  </div>;
}
