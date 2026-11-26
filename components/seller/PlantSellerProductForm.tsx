"use client";
import OptimizedImage from "@/components/ui/OptimizedImage";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle, ArrowRight, BadgeCheck, Camera, Check, CheckCircle2, CircleHelp,
  FileText, ImagePlus, Leaf, Package, Search, ShieldCheck, Sparkles, UploadCloud, X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import ProductSeoEditor from "@/components/seller/ProductSeoEditor";
import AdminProductDescriptionEditor from "@/components/admin/AdminProductDescriptionEditor";
import { productDescriptionToText } from "@/lib/marketplace/product-description";
import { appendFiveFaq } from "@/lib/plant-market/faq-from-description";

const CATEGORIES = [
  ["indoor-outdoor-plants", "ইনডোর ও আউটডোর গাছ"],
  ["fruit-plants", "ফলের গাছ ও চারা"],
  ["flower-plants", "ফুলের গাছ ও চারা"],
  ["seeds-saplings", "বীজ ও চারা"],
  ["cactus-succulents", "ক্যাকটাস ও সাকুলেন্ট"],
  ["pots-planters", "টব ও প্ল্যান্টার"],
  ["gardening-supplies", "বাগানের উপকরণ"],
  ["soil-compost", "মাটি ও কম্পোস্ট"],
] as const;
const BASOR_LOTA_DRAFT = {
  name: "বাসরলতা ফুলের চারা",
  scientific_name: "Thunbergia mysorensis",
  category_slug: "flower-plants",
  sunlight: "উজ্জ্বল আলো থেকে আংশিক ছায়া",
  watering: "মাটির আর্দ্রতা বুঝে পানি দিন; জলাবদ্ধতা এড়িয়ে চলুন",
  flowering_season: "গাছের বয়স, আবহাওয়া ও পরিচর্যার ওপর নির্ভরশীল",
  seo_title: "বাসরলতা ফুলের চারা | Mysore Trumpet Vine | AGRIVA",
  seo_description: "বাসরলতা ফুলের চারা (Thunbergia mysorensis) সম্পর্কে জানুন। ঝুলন্ত ফুল, রোপণ, আলো, পানি ও পরিচর্যার তথ্যসহ দাম ও স্টক দেখুন AGRIVA Plant Market-এ।",
  focus_keyword: "বাসরলতা ফুলের চারা",
  related_keywords: "বাসর লতা গাছ, বাসরলতা ফুল, Basor Lota Plant, Thunbergia mysorensis, Mysore Trumpet Vine",
  image_alt: "বাসরলতা (Thunbergia mysorensis) ফুলের চারার বাস্তব ছবি",
  highlights: "হলুদ ও তামাটে-লাল রঙের ঝুলন্ত ফুল\nবহুবর্ষজীবী লতানো শোভাবর্ধক উদ্ভিদ\nমাচা ও পারগোলায় ব্যবহার উপযোগী",
  usage_instructions: "পানি নিষ্কাশনযোগ্য উর্বর মাটিতে রোপণ করুন। উজ্জ্বল আলো ও শক্ত অবলম্বন দিন। মাটির আর্দ্রতা বুঝে পানি দিন এবং প্রয়োজনমতো ডাল পরিচালনা করুন।",
  description: [
    "<h2>বাসরলতা ফুলের চারা — Thunbergia mysorensis</h2>",
    "<p>আপনার বাগানের মাচা, পারগোলা বা প্রবেশপথে ঝুলন্ত ফুলের সৌন্দর্য চান? বাসরলতা একটি বহুবর্ষজীবী শোভাবর্ধক আরোহী লতা। এর দীর্ঘ ঝুলন্ত মঞ্জরিতে হলুদ ও তামাটে-লাল ফুল ফোটে। উপযুক্ত পরিবেশে উঁচু কাঠামো বেয়ে বেড়ে ওঠে।</p>",
    "<h2>বাসরলতার বিশেষ বৈশিষ্ট্য</h2>",
    "<p>Thunbergia mysorensis উদ্ভিদটি Acanthaceae পরিবারের সদস্য। এর বিশেষ আকর্ষণ হলুদ ও মেরুন-লাল রঙের ঝুলন্ত নলাকার ফুল। সাধারণ একবর্ষজীবী ফুলগাছের পরিবর্তে বহু বছর পরিচর্যার জন্য উপযোগী একটি ফুলের লতা।</p>",
    "<h2>বাসরলতা কোথায় লাগাবেন</h2>",
    "<p>বাগানের প্রবেশপথের আর্চ, মাচা, জালি কিংবা পারগোলায় শক্ত অবলম্বন দিয়ে লতাটি পরিচালনা করা যায়। বড় টবে রাখলে শিকড়ের যথেষ্ট জায়গা, পানি নিষ্কাশন এবং লতার সাপোর্ট প্রয়োজন।</p>",
    "<h2>রোপণের নিয়ম</h2>",
    "<p>উজ্জ্বল আলো পাওয়া যায় এমন স্থান ও জৈব পদার্থসমৃদ্ধ পানি নিষ্কাশনযোগ্য মাটি নির্বাচন করুন। চারার শিকড়ের মাটি অক্ষত রেখে রোপণ করুন, গোড়ায় পানি দিন এবং ধীরে ধীরে উপযুক্ত অবলম্বনের দিকে লতাটি পরিচালনা করুন।</p>",
    "<h2>আলো ও সূর্যালোক</h2>",
    "<p>উজ্জ্বল আলো থেকে আংশিক ছায়া উপযোগী। নতুন চারাকে তীব্র দুপুরের রোদে হঠাৎ না রেখে ধীরে ধীরে অভ্যস্ত করুন। স্থানীয় আবহাওয়া অনুযায়ী অবস্থান ঠিক করুন।</p>",
    "<h2>পানি ও মাটির পরিচর্যা</h2>",
    "<p>মাটির উপরিভাগের আর্দ্রতা দেখে পানি দিন। দীর্ঘসময় জলাবদ্ধতা এড়িয়ে চলুন। পানি নিষ্কাশন ভালো থাকা জরুরি; প্রয়োজনমতো পরিমিত জৈব সার ব্যবহার করা যায়।</p>",
    "<h2>ফুল ফোটার সময় ও ছাঁটাই</h2>",
    "<p>গাছের বয়স, পরিবেশ, সূর্যালোক ও পরিচর্যা অনুযায়ী ফুল আসার সময় পরিবর্তিত হয়। নির্দিষ্ট সময়ে ফুল আসার নিশ্চয়তা নেই। ক্ষতিগ্রস্ত বা শুকনো ডাল প্রয়োজনমতো ছাঁটাই করুন।</p>",
    "<h2>কেনার আগে যে তথ্য দেখবেন</h2>",
    "<p>বিক্রেতার বাস্তব ছবি, বর্তমান চারার উচ্চতা, টবসহ বা টব ছাড়া সরবরাহ, মূল্য, স্টক ও ডেলিভারি এলাকা দেখে সিদ্ধান্ত নিন। ছবির পরিপক্ব ফুলের গাছ আর সরবরাহ করা চারা একই পর্যায়ের নাও হতে পারে।</p>"
  ].join(""),
} as const;

const LOCAL_DRAFT_PREFIX = "agriva-plant-seller-new-draft-v2:";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const INITIAL = {
  name: "", scientific_name: "", category_slug: CATEGORIES[0][0] as string,
  plant_size: "", pot_size: "", plant_age: "", sunlight: "", watering: "",
  flowering_season: "", delivery_area: "", description: "", price: "", stock: "",
  unit: "piece", seo_slug: "", seo_title: "", seo_description: "", focus_keyword: "",
  related_keywords: "", brand: "", origin: "", highlights: "",
  usage_instructions: "", image_alt: "",
};
type Field = keyof typeof INITIAL;
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";
const bnNumber = (number: number) => new Intl.NumberFormat("bn-BD").format(number);

function suggestSeo(values: typeof INITIAL) {
  const name = values.name.trim();
  const category = CATEGORIES.find(([slug]) => slug === values.category_slug)?.[1] || "গাছ ও বাগানের পণ্য";
  const cleanSummary = productDescriptionToText(values.description);
  const title = (name + " | AGRIVA Plant Market").slice(0, 70);
  const description = cleanSummary
    ? cleanSummary.slice(0, 160)
    : (name + " — " + category + "। বিস্তারিত তথ্য, মূল্য ও উপলভ্যতা জানতে AGRIVA Plant Market দেখুন।").slice(0, 160);
  return { seo_title: title, seo_description: description, focus_keyword: name.slice(0, 100) };
}

function SectionTitle({
  id, step, title, description, icon,
}: {
  id: string; step: string; title: string; description: string; icon: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 border-b border-emerald-900/10 pb-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.12em] text-emerald-700">ধাপ {step}</p>
          <h2 className="mt-1 text-xl font-black leading-snug text-[#183d2e] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function PlantSellerProductForm() {
  const [form, setForm] = useState(INITIAL);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [seoGenerated, setSeoGenerated] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const submitting = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function set(key: Field, value: string) {
    setSubmitted(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    let cancelled = false;
    async function restoreSellerDraft() {
      try {
        const { data: { user } } = await createSupabaseBrowserClient().auth.getUser();
        if (!user || cancelled) return;
        const key = LOCAL_DRAFT_PREFIX + user.id;
        const stored = window.localStorage.getItem(key);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const record = parsed as Record<string, unknown>;
            const restored = Object.fromEntries(
              Object.keys(INITIAL).filter((field) => typeof record[field] === "string")
                .map((field) => [field, record[field] as string])
            );
            if (!cancelled) setForm((current) => ({ ...current, ...restored }));
          }
        }
        if (!cancelled) {
          setDraftKey(key);
          setDraftLoaded(true);
        }
      } catch { /* Optional local draft support must not block the editor. */ }
    }
    void restoreSellerDraft();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!draftLoaded || !draftKey) return;
    try {
      if (form.name.trim() || form.description.trim()) {
        window.localStorage.setItem(draftKey, JSON.stringify(form));
      }
    } catch { /* Private browsing may disable persistence. */ }
  }, [form, draftLoaded, draftKey]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function chooseImage(file?: File) {
    setMessage("");
    setSubmitted(false);
    if (!file) { setImage(null); setPreview(""); return; }
    if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE || file.size === 0) {
      setIsError(true);
      setImage(null);
      setPreview("");
      if (fileInput.current) fileInput.current.value = "";
      setMessage("JPG, PNG বা WebP ফাইল দিন; ছবির আকার সর্বোচ্চ ৫ MB হতে হবে।");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    chooseImage(event.target.files?.[0]);
  }

  function loadBasorLotaTemplate() {
    if (form.name.trim() || productDescriptionToText(form.description).trim()) {
      if (!window.confirm("বর্তমান পণ্যের নাম ও বিবরণ বদলে বাসরলতার খসড়া বসাবেন? মূল্য ও স্টক অপরিবর্তিত থাকবে।")) return;
    }
    setForm((current) => ({ ...current, ...BASOR_LOTA_DRAFT, description: appendFiveFaq(BASOR_LOTA_DRAFT.description, BASOR_LOTA_DRAFT.name), price: current.price || "250", stock: current.stock || "20", plant_size: current.plant_size || "৫ ইঞ্চি" }));
    setSubmitted(false);
    setSeoGenerated(true);
    setIsError(false);
    setMessage("তথ্যসমৃদ্ধ বাসরলতার খসড়া এবং বিবরণ থেকে ৫টি FAQ যোগ হয়েছে। দাম, স্টক ও উচ্চতা যাচাই করুন; এগুলো পরেও আলাদা ফিল্ডে বদলানো যাবে।");
  }

  function regenerateFaq() {
    const next = appendFiveFaq(form.description, form.name);
    if (next === form.description) {
      setIsError(true);
      setMessage("৫টি FAQ তৈরির জন্য বিবরণে অন্তত ৫টি তথ্যসমৃদ্ধ শিরোনাম ও অনুচ্ছেদ লিখুন।");
      return;
    }
    set("description", next);
    setIsError(false);
    setMessage("পণ্যের বিবরণের তথ্য থেকে ঠিক ৫টি FAQ যোগ করা হয়েছে। প্রকাশের আগে প্রশ্ন ও উত্তর যাচাই করুন।");
  }

  function generateSeoDraft() {
    if (!form.name.trim()) {
      setIsError(true);
      setMessage("SEO খসড়া তৈরি করতে আগে পণ্যের নাম লিখুন।");
      document.getElementById("plant-product-name")?.focus();
      return;
    }
    const suggested = suggestSeo(form);
    setForm((current) => ({
      ...current,
      seo_title: current.seo_title.trim() || suggested.seo_title,
      seo_description: current.seo_description.trim() || suggested.seo_description,
      focus_keyword: current.focus_keyword.trim() || suggested.focus_keyword,
      image_alt: current.image_alt.trim() || (image ? (current.name.trim() + " এর বাস্তব ছবি").slice(0, 180) : ""),
    }));
    setSeoGenerated(true);
    setIsError(false);
    setMessage("আপনার দেওয়া তথ্য থেকে খালি SEO ঘরগুলো পূরণ করা হয়েছে। জমা দেওয়ার আগে যাচাই করুন।");
  }

  const categoryLabel = CATEGORIES.find(([slug]) => slug === form.category_slug)?.[1] || "";
  const descriptionText = useMemo(() => productDescriptionToText(form.description), [form.description]);
  const checks = useMemo(() => [
    { label: "পণ্যের নাম ও ক্যাটাগরি", ok: form.name.trim().length >= 2 && !!categoryLabel },
    { label: "মূল্য ও মজুত", ok: Number(form.price) > 0 && form.stock !== "" && Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0 },
    { label: "অন্তত ৪০ অক্ষরের বাস্তব বিবরণ", ok: descriptionText.length >= 40 && form.description.length <= 5000 },
    { label: "পণ্যের বাস্তব ছবি", ok: !!image },
    { label: "SEO title ও meta description", ok: !!form.seo_title.trim() && !!form.seo_description.trim() },
    { label: "Focus keyword", ok: !!form.focus_keyword.trim() },
  ], [form, image, categoryLabel, descriptionText]);
  const completed = checks.filter((item) => item.ok).length;
  const suggestions = suggestSeo(form);
  const effectiveTitle = form.seo_title.trim() || suggestions.seo_title || "আপনার পণ্যের নাম | AGRIVA";
  const effectiveMeta = form.seo_description.trim() || suggestions.seo_description;
  const slugHint = form.seo_slug.trim() || (form.scientific_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "plant") + "-xxxxxxxx";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (name.length < 2 || price <= 0 || !Number.isFinite(price) || form.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) {
      setIsError(true);
      setMessage("পণ্যের নাম, সঠিক মূল্য ও মজুতের পরিমাণ পূরণ করুন।");
      return;
    }
    if (form.description.length > 5000) {
      setIsError(true);
      setMessage("পণ্যের বিবরণ সর্বোচ্চ ৫,০০০ HTML অক্ষরের মধ্যে রাখতে হবে।");
      document.getElementById("plant-description-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (form.highlights.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).some((item) => item.length > 200)) {
      setIsError(true);
      setMessage("প্রতি বৈশিষ্ট্য সর্বোচ্চ ২০০ অক্ষরে লিখুন।");
      return;
    }
    submitting.current = true;
    setLoading(true);
    setMessage("");
    setIsError(false);
    const supabase = createSupabaseBrowserClient();
    let uploadedPath: string | null = null;
    try {
      let imageUrl: string | null = null;
      if (image) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("ছবি আপলোড করতে আবার লগইন করুন।");
        const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
        uploadedPath = user.id + "/" + crypto.randomUUID() + "." + ext;
        const { error } = await supabase.storage.from("plant-product-images").upload(uploadedPath, image, {
          contentType: image.type, cacheControl: "3600", upsert: false,
        });
        if (error) throw new Error("ছবি আপলোড করা যায়নি। আপনার Plant Seller অনুমোদন যাচাই করুন।");
        imageUrl = supabase.storage.from("plant-product-images").getPublicUrl(uploadedPath).data.publicUrl;
      }

      // SEO fallbacks contain only the seller's own text, with no invented claims or AI request.
      const auto = suggestSeo(form);
      const response = await fetch("/api/plant-seller/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          seo_title: form.seo_title.trim() || auto.seo_title,
          seo_description: form.seo_description.trim() || auto.seo_description,
          focus_keyword: form.focus_keyword.trim() || auto.focus_keyword,
          image_alt: form.image_alt.trim() || (image ? (name + " এর ছবি").slice(0, 180) : ""),
          price, stock, image_url: imageUrl,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) throw new Error("লগইন সেশন শেষ হয়েছে। আবার লগইন করে জমা দিন।");
        if (response.status === 403) throw new Error("পণ্য যোগ করতে আপনার Plant Seller অনুমোদন প্রয়োজন।");
        throw new Error(typeof data.error === "string" ? data.error : "পণ্য জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
      }

      uploadedPath = null;
      setSubmitted(true);
      setMessage("পণ্যটি সফলভাবে পর্যালোচনার জন্য জমা হয়েছে। অ্যাডমিন অনুমোদনের আগে প্রকাশিত হবে না।");
      try { window.localStorage.removeItem(draftKey); } catch { /* no storage */ }
      setForm(INITIAL);
      setImage(null);
      setPreview("");
      setSeoGenerated(false);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from("plant-product-images").remove([uploadedPath]);
        if (cleanupError) console.warn("Plant product image cleanup failed", cleanupError.name);
      }
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start lg:gap-7" aria-label="নতুন Plant Market পণ্য যোগ করুন">
      <div className="min-w-0 space-y-6">
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">আপনার লেখা এই ব্রাউজারে স্থানীয় খসড়া হিসেবে সংরক্ষিত থাকবে (ছবি ছাড়া)। এটি অ্যাডমিনের কাছে জমা দেওয়া Database Draft নয়। কাজ শেষে নিচের জমা দেওয়ার বাটন ব্যবহার করুন।</div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {[
            ["#plant-basic", "১. পণ্যের পরিচিতি"],
            ["#plant-price", "২. দাম ও তথ্য"],
            ["#plant-photo", "৩. ছবি"],
            ["#plant-seo", "৪. SEO প্রস্তুতি"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-emerald-200 bg-white px-3.5 py-2.5 text-emerald-900 transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500">{label}</a>
          ))}
        </div>

        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle id="plant-basic" step="০১" title="পণ্যের পরিচিতি দিন" description="ক্রেতা প্রথমে পণ্যের নাম, ধরন ও বিবরণ দেখবেন। সহজ ও পরিষ্কার ভাষায় লিখুন।" icon={<Leaf size={22} aria-hidden="true" />} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div><p className="text-sm font-black text-emerald-950">বাসরলতা ফুলের চারার SEO খসড়া</p><p className="mt-1 text-xs leading-5 text-slate-600">নাম, পরিচর্যা, FAQ ও SEO তথ্য পূরণ হবে; ছবি, দাম ও স্টক নিজের পণ্য অনুযায়ী দিন।</p></div>
            <button type="button" onClick={loadBasorLotaTemplate} className="rounded-xl bg-emerald-800 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700">বাসরলতার খসড়া ব্যবহার করুন</button>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-bold text-slate-800 md:col-span-2">
              পণ্যের নাম <span className="text-rose-600">*</span>
              <input id="plant-product-name" required minLength={2} maxLength={160} autoComplete="off" value={form.name} onChange={(event) => set("name", event.target.value)} className={inputClass} placeholder="যেমন: কলম করা থাই পেয়ারা গাছ" />
              <span className="mt-1.5 block text-xs font-normal text-slate-500">শুধু বাস্তবে যে পণ্য বিক্রি করবেন তার সঠিক নাম দিন।</span>
            </label>
            <label className="block text-sm font-bold text-slate-800">
              পণ্যের ক্যাটাগরি <span className="text-rose-600">*</span>
              <select required value={form.category_slug} onChange={(event) => set("category_slug", event.target.value)} className={inputClass}>
                {CATEGORIES.map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-800">
              বৈজ্ঞানিক নাম <span className="text-xs font-normal text-slate-400">(ঐচ্ছিক)</span>
              <input maxLength={160} value={form.scientific_name} onChange={(event) => set("scientific_name", event.target.value)} className={inputClass} placeholder="সঠিক নাম জানা থাকলে দিন" />
            </label>
            <div id="plant-description-editor" className="min-w-0 md:col-span-2">
              <AdminProductDescriptionEditor
                variant="plant"
                productName={form.name}
                focusKeyword={form.focus_keyword}
                previewPath={"/plant-market/" + (form.name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 70) || "your-plant") + "-xxxxxxxx"}
                maxHtmlLength={5000}
                value={form.description}
                onChange={(html) => set("description", html)}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="max-w-md text-xs leading-5 text-emerald-950">লেখার তথ্যভিত্তিক শিরোনাম ও অনুচ্ছেদ থেকে ৫টি FAQ তৈরি হবে। নতুন তথ্য বা প্রতিশ্রুতি বানানো হবে না।</p>
                <button type="button" onClick={regenerateFaq} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">বিবরণ থেকে ৫টি FAQ তৈরি করুন</button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">শুধু বাস্তব ও যাচাইযোগ্য তথ্য লিখুন। SEO outline একটি খালি কাঠামো; ভুল বা অপ্রযোজ্য তথ্য মুছে দিন।</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle id="plant-price" step="০২" title="দাম, মজুত ও সরবরাহ" description="মূল্য যেন একক অনুযায়ী পরিষ্কার থাকে এবং ক্রেতা সঠিক পরিমাণ অর্ডার করতে পারেন।" icon={<Package size={22} aria-hidden="true" />} />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-800">
              বিক্রয় মূল্য (৳) <span className="text-rose-600">*</span>
              <input required type="number" inputMode="decimal" min="0.01" max="99999999" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} className={inputClass} placeholder="যেমন: ২৫০" />
            </label>
            <label className="block text-sm font-bold text-slate-800">
              মজুত (Stock) <span className="text-rose-600">*</span>
              <input required type="number" inputMode="numeric" min="0" step="1" value={form.stock} onChange={(event) => set("stock", event.target.value)} className={inputClass} placeholder="যেমন: ২০" />
              <span className="mt-1.5 block text-xs font-normal text-slate-500">মজুত না থাকলে ০ লিখুন।</span>
            </label>
            <label className="block text-sm font-bold text-slate-800">
              বিক্রয় একক
              <select value={form.unit} onChange={(event) => set("unit", event.target.value)} className={inputClass}>
                <option value="piece">প্রতি গাছ / পিস</option>
                <option value="pot">প্রতি টব</option>
                <option value="pack">প্যাকেট</option>
                <option value="tray">ট্রে</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-800">
              সরবরাহ এলাকা <span className="text-xs font-normal text-slate-400">(ঐচ্ছিক)</span>
              <input maxLength={160} value={form.delivery_area} onChange={(event) => set("delivery_area", event.target.value)} className={inputClass} placeholder="যেমন: ঢাকা ও আশপাশের এলাকা" />
            </label>
          </div>
          <details className="group mt-6 rounded-2xl border border-emerald-100 bg-[#f8fbf7] p-4 open:pb-5">
            <summary className="cursor-pointer list-item text-sm font-extrabold text-emerald-900">গাছের আকার ও যত্নের অতিরিক্ত তথ্য (ঐচ্ছিক)</summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">টব, মাটি বা সরঞ্জাম হলে যে তথ্য প্রযোজ্য নয় তা খালি রাখুন।</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {([
                ["plant_size", "গাছের উচ্চতা / আকার", "যেমন: ২ ফুট"],
                ["pot_size", "টবের সাইজ", "যেমন: ৮ ইঞ্চি"],
                ["plant_age", "গাছের বয়স", "যেমন: ৮ মাস"],
                ["flowering_season", "ফুল / ফলের মৌসুম", "জানা থাকলে লিখুন"],
                ["sunlight", "সূর্যালোকের প্রয়োজন", "যেমন: সকালের আলো"],
                ["watering", "পানি দেওয়ার নিয়ম", "যেমন: মাটি শুকালে পানি দিন"],
              ] as const).map(([key, label, placeholder]) => (
                <label key={key} className="block text-sm font-bold text-slate-800">
                  {label}
                  <input maxLength={key === "sunlight" || key === "watering" ? 300 : key === "flowering_season" ? 120 : 80} value={form[key]} onChange={(event) => set(key, event.target.value)} className={inputClass} placeholder={placeholder} />
                </label>
              ))}
            </div>
          </details>
        </section>

        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle id="plant-photo" step="০৩" title="পণ্যের বাস্তব ছবি দিন" description="স্পষ্ট, সোজা এবং ভালো আলোতে তোলা নিজের পণ্যের ছবি ক্রেতাকে সিদ্ধান্ত নিতে সাহায্য করে।" icon={<Camera size={22} aria-hidden="true" />} />
          <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
              <label htmlFor="plant-product-image" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseImage(event.dataTransfer.files[0]); }} className={"flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-9 text-center transition " + (dragging ? "border-emerald-700 bg-emerald-50" : "border-emerald-200 bg-[#f7fbf7] hover:bg-emerald-50")}>
                <UploadCloud size={29} className="text-emerald-800" aria-hidden="true" />
                <span className="mt-3 text-sm font-black">ছবি নির্বাচন করুন</span>
                <span className="mt-1 text-xs leading-5 text-slate-500">মোবাইল/কম্পিউটার থেকে আপলোড করুন অথবা এখানে ফাইল টেনে আনুন</span>
                <span className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm">JPG, PNG, WebP · সর্বোচ্চ ৫ MB</span>
                <input ref={fileInput} id="plant-product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFiles} className="sr-only" aria-label="পণ্যের ছবি আপলোড করুন" />
              </label>
              {image && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
                  <span className="min-w-0 truncate">{image.name}</span>
                  <button type="button" onClick={() => { chooseImage(); if (fileInput.current) fileInput.current.value = ""; }} className="inline-flex shrink-0 items-center gap-1 text-rose-700 hover:underline" aria-label="নির্বাচিত ছবি সরান"><X size={14} /> সরান</button>
                </div>
              )}
            </div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {preview ? (
                <OptimizedImage src={preview} alt="নির্বাচিত পণ্যের ছবির প্রিভিউ" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center px-4 text-center text-slate-400">
                  <ImagePlus size={38} aria-hidden="true" />
                  <span className="mt-2 text-xs font-semibold">এখানে ছবির প্রিভিউ দেখাবে</span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> ছবি ছাড়া পণ্য জমা দেওয়া যাবে, তবে বাস্তব ছবি যুক্ত করার পরামর্শ দেওয়া হচ্ছে। ছবির Alt text নিচের SEO অংশে লিখতে পারবেন।</p>
        </section>

        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle id="plant-seo" step="০৪" title="Google-এর জন্য SEO তথ্য" description="নাম ও বিবরণের ভিত্তিতে খালি SEO ঘর পূরণ করতে পারেন; নিজেও সম্পাদনা করতে পারবেন।" icon={<Search size={22} aria-hidden="true" />} />
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-emerald-950">SEO কী লিখবেন বুঝতে পারছেন না?</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">আপনার দেওয়া তথ্য থেকেই শিরোনাম, বিবরণ ও keyword সাজানো হবে। খালি থাকলেও জমা দেওয়ার সময় এই মৌলিক SEO তথ্য স্বয়ংক্রিয় যুক্ত হবে। কোনো কৃত্রিম দাবি যোগ হবে না।</p>
            </div>
            <button type="button" onClick={generateSeoDraft} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700"><Sparkles size={17} aria-hidden="true" /> খালি SEO ঘর পূরণ করুন</button>
          </div>
          {seoGenerated && <p className="mt-3 text-xs font-semibold text-emerald-800"><Check size={14} className="mr-1 inline" /> SEO খসড়া তৈরি হয়েছে—যাচাই করে প্রয়োজনে পরিবর্তন করুন।</p>}
          <label className="mt-5 block text-sm font-bold text-slate-800">
            SEO-friendly English URL Slug <span className="text-xs font-normal text-slate-400">(ঐচ্ছিক)</span>
            <input value={form.seo_slug} maxLength={90} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event) => set("seo_slug", event.target.value.toLowerCase())} className={inputClass} placeholder="যেমন: basor-lota-flower-plant" />
            <span className="mt-1.5 block text-xs font-normal text-slate-500">ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন। খালি রাখলে স্বয়ংক্রিয় slug তৈরি হবে।</span>
          </label>
          <div className="mt-5">
            <ProductSeoEditor guided value={form} onChange={set} productName={form.name} description={descriptionText} previewPath={"/plant-market/" + slugHint} />
          </div>
        </section>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          <div className="flex items-start gap-2"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p><strong>প্রকাশের আগে পর্যালোচনা:</strong> জমা দেওয়া পণ্য প্রথমে Draft/Review অবস্থায় থাকবে। অ্যাডমিন অনুমোদন না করা পর্যন্ত Plant Market-এ প্রকাশিত হবে না।</p></div>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-black">সব তথ্য ঠিক আছে?</p><p className="mt-1 text-xs leading-5 text-slate-500">চূড়ান্তভাবে জমা দেওয়ার আগে পণ্যের তথ্য, ছবি ও মূল্য দেখে নিন।</p></div>
            <Link href="/plant-seller/products" className="text-xs font-bold text-emerald-800 underline underline-offset-4">আমার পণ্য দেখুন</Link>
          </div>
          <button type="submit" disabled={loading} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 focus-visible:ring-4 focus-visible:ring-emerald-500/30 disabled:cursor-wait disabled:opacity-60">
            {loading ? "পণ্য জমা হচ্ছে…" : "পর্যালোচনার জন্য পণ্য জমা দিন"} <ArrowRight size={18} aria-hidden="true" />
          </button>
          {message && (
            <div role={isError ? "alert" : "status"} className={"mt-4 rounded-xl border p-4 text-sm leading-6 " + (isError ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900")}>
              <span className="flex items-start gap-2">{isError ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}<span>{message}</span></span>
              {submitted && <Link href="/plant-seller/products" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 font-bold text-white">আমার জমা দেওয়া পণ্য দেখুন <ArrowRight size={15} /></Link>}
            </div>
          )}
        </div>
      </div>

      <aside className="mt-6 space-y-4 lg:sticky lg:top-6 lg:mt-0" aria-label="পণ্য জমার অগ্রগতি">
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><BadgeCheck size={20} className="text-emerald-800" /><h2 className="text-base font-black">পণ্যের প্রস্তুতি</h2></div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <span className="text-3xl font-black text-emerald-900">{bnNumber(completed)}<span className="text-lg text-slate-400">/৬</span></span>
            <span className="text-xs font-bold text-slate-500">তথ্য সম্পূর্ণতার নির্দেশক</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="পণ্য প্রস্তুতির অগ্রগতি" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={checks.length}>
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: (completed / checks.length * 100) + "%" }} />
          </div>
          <ul className="mt-5 space-y-3">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-2 text-xs leading-5">
                {check.ok ? <CheckCircle2 size={17} className="shrink-0 text-emerald-700" aria-hidden="true" /> : <span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border border-slate-300 text-slate-400">○</span>}
                <span className={check.ok ? "font-semibold text-emerald-900" : "text-slate-600"}>{check.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">এই তালিকা পরামর্শমূলক; ছবি ও SEO-র সব ঘর পূরণ বাধ্যতামূলক নয়।</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-sm">
          <div className="bg-[#ecf5ec] px-5 py-3 text-xs font-black text-emerald-900">পণ্যের প্রিভিউ</div>
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-700">
              {preview ? <OptimizedImage src={preview} alt="নির্বাচিত পণ্যের ছবির ক্ষুদ্র প্রিভিউ" className="h-full w-full object-contain" /> : <Leaf size={26} aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-700">{categoryLabel}</p>
              <p className="mt-1 line-clamp-2 text-sm font-black">{form.name.trim() || "আপনার পণ্যের নাম"}</p>
              <p className="mt-1 text-base font-black text-emerald-900">{form.price && Number(form.price) > 0 ? "৳" + bnNumber(Number(form.price)) : "মূল্য যোগ করুন"}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">মজুত: {form.stock !== "" ? bnNumber(Number(form.stock)) : "—"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-[#f4faed] p-4">
          <p className="flex items-center gap-2 text-sm font-black text-emerald-900"><FileText size={16} /> Google ফলাফলে সম্ভাব্য তথ্য</p>
          <p className="mt-2 line-clamp-2 break-words text-sm font-bold text-[#1a0dab]">{effectiveTitle}</p>
          <p className="mt-1 break-all text-[11px] text-emerald-800">agriva.com.bd/plant-market/…</p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{effectiveMeta || "পণ্যের সত্যিকার বিবরণ লিখলে এখানে দেখা যাবে।"}</p>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">এটি উদাহরণ। URL-এ স্বয়ংক্রিয় unique অংশ যোগ হয়; Google শিরোনাম বা বিবরণ পরিবর্তন করে দেখাতে পারে।</p>
        </div>
      </aside>
    </form>
  );
}
