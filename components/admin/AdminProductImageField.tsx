"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const MAX_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminProductImageField({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages.slice(0, MAX_IMAGES));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function chooseImages(files: FileList | null) {
    const selected = Array.from(files ?? []);
    setMessage("");
    if (images.length + selected.length > MAX_IMAGES) {
      setMessage("সর্বোচ্চ ৪টি ছবি রাখা যাবে।");
      return;
    }
    const invalid = selected.find(file => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalid) {
      setMessage("শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।");
      return;
    }
    if (!selected.length) return;

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const uploadedPaths: string[] = [];
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("ছবি আপলোড করতে Admin account-এ আবার লগইন করুন।");
      const uploadedUrls: string[] = [];
      for (const file of selected) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          contentType: file.type, cacheControl: "3600", upsert: false,
        });
        if (error) throw new Error("ছবি আপলোড করা যায়নি। Storage policy ও project upload limit যাচাই করুন।");
        uploadedPaths.push(path);
        uploadedUrls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
      }
      setImages(current => [...current, ...uploadedUrls].slice(0, MAX_IMAGES));
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "ছবি আপলোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  return <div className="space-y-2 md:col-span-2 xl:col-span-3">
    <label htmlFor="admin-product-images" className="block text-sm font-bold">পণ্যের ছবি <span className="font-normal text-[#748074]">(ঐচ্ছিক, সর্বোচ্চ ৪টি)</span></label>
    <input id="admin-product-images" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={loading || images.length >= MAX_IMAGES}
      onChange={event => { void chooseImages(event.target.files); event.currentTarget.value = ""; }}
      className="block w-full rounded-xl border px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf4e9] file:px-3 file:py-2 file:font-bold"/>
    <input type="hidden" name="image_urls" value={JSON.stringify(images)}/>
    <p className="text-xs text-[#748074]">JPG, PNG বা WebP। প্রতিটি ছবির জন্য আলাদা MB limit নেই; Supabase project-এর global upload limit প্রযোজ্য।</p>
    {images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((src, index) => <div key={src} className="space-y-1">
      <img src={src} alt={`পণ্যের ছবি ${index + 1}`} className="h-28 w-full rounded-xl border object-cover"/>
      <button type="button" disabled={loading} onClick={() => setImages(current => current.filter(item => item !== src))} className="text-xs font-bold text-red-700">ছবি {index + 1} সরান</button>
    </div>)}</div>}
    {loading && <p className="text-xs font-semibold text-[#637266]">ছবি আপলোড হচ্ছে...</p>}
    {message && <p role="alert" className="text-xs font-semibold text-red-700">{message}</p>}
  </div>;
}
