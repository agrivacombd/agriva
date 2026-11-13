"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Camera, ImageUp, Loader2, ScanSearch } from "lucide-react";
import {
  fingerprintFromRgba,
  VISUAL_SIDE,
  VISUAL_QUERY_EVENT,
  VISUAL_QUERY_STORAGE_KEY,
  type SavedVisualQuery,
} from "@/lib/search/visual-fingerprint";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function processPhoto(file: File): Promise<SavedVisualQuery> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।");
  if (file.size > MAX_UPLOAD_BYTES || file.size === 0) throw new Error("সর্বোচ্চ ৪ MB আকারের ছবি নির্বাচন করুন।");

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < 24 || bitmap.height < 24 || bitmap.width * bitmap.height > 20_000_000) {
      throw new Error("ছবির রেজল্যুশনটি উপযুক্ত নয়।");
    }
    const sample = document.createElement("canvas");
    sample.width = VISUAL_SIDE;
    sample.height = VISUAL_SIDE;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("এই ব্রাউজারে ছবি বিশ্লেষণ করা যাচ্ছে না।");

    // The same white background and contain-fit are used by the server index.
    const dimension = VISUAL_SIDE;
    const scale = Math.min(dimension / bitmap.width, dimension / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, dimension, dimension);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, (dimension - width) / 2, (dimension - height) / 2, width, height);

    const preview = document.createElement("canvas");
    preview.width = 128;
    preview.height = 128;
    const previewContext = preview.getContext("2d");
    if (!previewContext) throw new Error("ছবির preview তৈরি করা যাচ্ছে না।");
    const previewScale = Math.min(128 / bitmap.width, 128 / bitmap.height);
    previewContext.fillStyle = "#ffffff";
    previewContext.fillRect(0, 0, 128, 128);
    previewContext.drawImage(bitmap, (128 - bitmap.width * previewScale) / 2, (128 - bitmap.height * previewScale) / 2, bitmap.width * previewScale, bitmap.height * previewScale);

    // Keep a locally scaled higher-resolution image for optional learned
    // embeddings. Neither this thumbnail nor the original is uploaded.
    const semantic = document.createElement("canvas");
    semantic.width = 320;
    semantic.height = 320;
    const semanticContext = semantic.getContext("2d");
    if (!semanticContext) throw new Error("উন্নত ছবি বিশ্লেষণের preview তৈরি করা যাচ্ছে না।");
    const semanticScale = Math.min(320 / bitmap.width, 320 / bitmap.height);
    semanticContext.fillStyle = "#ffffff";
    semanticContext.fillRect(0, 0, 320, 320);
    semanticContext.imageSmoothingQuality = "high";
    semanticContext.drawImage(bitmap, (320 - bitmap.width * semanticScale) / 2, (320 - bitmap.height * semanticScale) / 2, bitmap.width * semanticScale, bitmap.height * semanticScale);
    const embeddingPreview = semantic.toDataURL("image/jpeg", 0.72);

    return {
      fingerprint: fingerprintFromRgba(context.getImageData(0, 0, dimension, dimension).data),
      preview: preview.toDataURL("image/jpeg", 0.64),
      // The local query validator permits up to 400 KB of base64 text.
      semanticPreview: embeddingPreview.length < 400_000 ? embeddingPreview : undefined,
      createdAt: Date.now(),
    };
  } finally {
    bitmap.close();
  }
}

/** Camera/gallery menu for the header, homepage hero and unified search page. */
export default function VisualSearchButton({ english = false }: { english?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function selected(file?: File) {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      // No photo is transmitted: only a tiny thumbnail + numerical signature
      // stay in this tab's short-lived session storage.
      const visualQuery = await processPhoto(file);
      sessionStorage.setItem(VISUAL_QUERY_STORAGE_KEY, JSON.stringify(visualQuery));
      setOpen(false);
      window.dispatchEvent(new Event(VISUAL_QUERY_EVENT));
      if (pathname === "/search") {
        router.replace("/search?visual=1");
      } else {
        router.push("/search?visual=1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ছবিটি পড়া যায়নি, অন্য ছবি ব্যবহার করুন।");
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        title={english ? "Search with a photo" : "ছবি দিয়ে পণ্য খুঁজুন"}
        aria-label={english ? "Search with a photo" : "ছবি দিয়ে পণ্য খুঁজুন"}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => { setOpen((value) => !value); setError(""); }}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60"
      >
        {busy ? <Loader2 size={21} className="animate-spin" /> : <Camera size={21} />}
      </button>
      <input
        ref={cameraRef}
        type="file"
        hidden
        tabIndex={-1}
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => { void selected(event.target.files?.[0]); event.target.value = ""; }}
      />
      <input
        ref={galleryRef}
        type="file"
        hidden
        tabIndex={-1}
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => { void selected(event.target.files?.[0]); event.target.value = ""; }}
      />
      {open && (
        <div role="menu" aria-label={english ? "Visual search options" : "ছবি দিয়ে সার্চের অপশন"} className="absolute right-0 top-full z-[100] mt-2 w-64 rounded-2xl border border-emerald-100 bg-white p-3 shadow-xl">
          <p className="px-2 pb-2 text-xs font-extrabold text-emerald-900">{english ? "Find similar products" : "ছবি দিয়ে পণ্য খুঁজুন"}</p>
          <button type="button" role="menuitem" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50" onClick={() => cameraRef.current?.click()}>
            <Camera size={18} className="text-emerald-700" />{english ? "Take a photo" : "ক্যামেরায় ছবি তুলুন"}
          </button>
          <button type="button" role="menuitem" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50" onClick={() => galleryRef.current?.click()}>
            <ImageUp size={18} className="text-emerald-700" />{english ? "Choose from gallery" : "গ্যালারি থেকে ছবি দিন"}
          </button>
          <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-2 text-xs leading-5 text-emerald-800"><ScanSearch size={15} className="mt-0.5 shrink-0" />{english ? "JPG, PNG or WebP, up to 4 MB. Your photo stays on this device." : "JPG, PNG বা WebP · সর্বোচ্চ ৪ MB। মূল ছবি ডিভাইসেই থাকবে।"}</p>
          {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-800">{error}</p>}
        </div>
      )}
    </div>
  );
}
