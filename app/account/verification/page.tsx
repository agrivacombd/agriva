"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, FileUp, LoaderCircle, ShieldCheck, Sprout, Store, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import BrandLogo from "@/components/BrandLogo";
import {
  MARKETPLACE_SELLER_CATEGORIES,
  PLANT_MARKET_SELLER_CATEGORIES,
  PLANT_GARDENING_TYPES,
  SELLER_EVIDENCE_TYPES,
  OPERATING_MODELS,
} from "@/lib/seller-verification/catalog";

type Module = "plant_market" | "marketplace" | "employer" | "transport" | "sell_harvest";
type Application = { id: string; module: Module; status: string; review_note: string | null; created_at: string };
type EvidenceFile = { file: File; type: string };

const statusLabel: Record<string, string> = {
  pending: "পর্যালোচনার অপেক্ষায়",
  under_review: "পর্যালোচনা চলছে",
  approved: "অনুমোদিত",
  rejected: "সংশোধন প্রয়োজন",
  withdrawn: "প্রত্যাহার করা হয়েছে",
};

const defaultCategory = (selectedModule: Module) =>
  selectedModule === "plant_market" ? "hobby_gardener" : "retailer";

export default function IdentityVerificationPage() {
  const router = useRouter();
  const [module, setModule] = useState<Module>("plant_market");
  const [sellerCategory, setSellerCategory] = useState<string>("hobby_gardener");
  const [applications, setApplications] = useState<Application[]>([]);
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/identity/applications", { cache: "no-store" });
    if (response.status === 401) {
      router.push("/login?next=/account/verification");
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "আবেদন লোড করা যায়নি");
    setApplications(data.applications || []);
  }, [router]);

  useEffect(() => {
    load().catch((cause: unknown) => {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "আবেদন লোড করা যায়নি");
    }).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("module");
    if (requested === "marketplace" || requested === "plant_market") {
      setModule(requested);
      setSellerCategory(defaultCategory(requested));
    }
  }, []);

  function changeModule(next: "marketplace" | "plant_market") {
    setModule(next);
    setSellerCategory(defaultCategory(next));
    setFiles([]);
    setMessage("");
    setError(false);
  }

  function changeFiles(selected: FileList | null) {
    const chosen = Array.from(selected || []);
    if (chosen.length > 5) {
      setFiles([]);
      setError(true);
      setMessage("সর্বোচ্চ ৫টি সহায়ক নথি আপলোড করতে পারবেন।");
      return;
    }
    const next = chosen.map((file) => ({ file, type: "other" }));
    setFiles(next);
    if (chosen.length <= 5) {
      setError(false);
      setMessage("");
    }
  }

  function changeEvidenceType(index: number, type: string) {
    setFiles((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type } : item));
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (busy) return;
    if (files.length < 1 || files.length > 5) {
      setError(true);
      setMessage("কমপক্ষে ১টি এবং সর্বোচ্চ ৫টি সহায়ক নথি নির্বাচন করুন।");
      return;
    }

    setBusy(true);
    setError(false);
    setMessage("");
    const form = new FormData(formElement);
    let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | undefined;
    const uploadedPaths: string[] = [];

    try {
      const supabase = supabaseClient = createSupabaseBrowserClient();
      const auth = await supabase.auth.getUser();
      if (auth.error || !auth.data.user) {
        router.push("/login?next=/account/verification");
        return;
      }

      const evidencePaths: string[] = [];
      for (const item of files) {
        const extension = item.file.name.toLowerCase().split(".").pop() || "";
        const allowedMime = (extension === "pdf" && item.file.type === "application/pdf") ||
          (["jpg", "jpeg"].includes(extension) && item.file.type === "image/jpeg") ||
          (extension === "png" && item.file.type === "image/png");
        if (!allowedMime || item.file.size > 5 * 1024 * 1024) {
          throw new Error("প্রতি ফাইল JPG, PNG বা PDF হতে হবে এবং ৫ MB-এর মধ্যে হতে হবে।");
        }

        const path = auth.data.user.id + "/" + crypto.randomUUID() + "." + extension;
        const uploaded = await supabase.storage.from("identity-verification")
          .upload(path, item.file, { upsert: false, contentType: item.file.type });
        if (uploaded.error) {
          const statusValue = (uploaded.error as unknown as { statusCode?: string | number }).statusCode;
          const status = statusValue ? String(statusValue) : "unknown";
          throw new Error("Storage upload ব্যর্থ (HTTP " + status + "): " + uploaded.error.message);
        }
        uploadedPaths.push(path);
        evidencePaths.push(path);
      }

      const payload: Record<string, unknown> = {
        module,
        sellerCategory,
        contactName: form.get("contactName"),
        contactPhone: form.get("contactPhone"),
        district: form.get("district"),
        deliveryCoverage: form.get("deliveryCoverage"),
        sourceDeclaration: form.get("sourceDeclaration"),
        policyAccepted: form.get("policyAccepted") === "on",
        evidencePaths,
        evidenceTypes: files.map((item) => item.type),
      };

      if (module === "plant_market") {
        payload.gardeningTypes = form.getAll("gardeningTypes");
        payload.experienceNote = form.get("experienceNote");
        payload.operatingModel = form.get("operatingModel");
        payload.nurseryName = form.get("nurseryName");
        payload.nurseryAddress = form.get("nurseryAddress");
      } else {
        payload.organizationName = form.get("organizationName");
        payload.businessAddress = form.get("businessAddress");
        payload.businessDescription = form.get("businessDescription");
        payload.tradeLicense = form.get("tradeLicense");
        payload.website = form.get("website");
      }

      const response = await fetch("/api/identity/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "আবেদন জমা হয়নি");

      uploadedPaths.length = 0;
      setFiles([]);
      formElement.reset();
      setSellerCategory(defaultCategory(module));
      setMessage("আপনার আবেদন জমা হয়েছে। Admin review সম্পন্ন না হওয়া পর্যন্ত সংশ্লিষ্ট মার্কেটে বিক্রির অনুমতি সক্রিয় হবে না।");
      await load();
    } catch (cause) {
      if (supabaseClient && uploadedPaths.length) {
        const cleanup = await supabaseClient.storage.from("identity-verification").remove(uploadedPaths);
        if (cleanup.error) console.error("Seller evidence cleanup failed:", cleanup.error.message);
      }
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "আবেদন জমা হয়নি");
    } finally {
      setBusy(false);
    }
  }

  const hasOpen = applications.some((application) =>
    application.module === module && ["pending", "under_review", "approved"].includes(application.status)
  );
  const plantNurseryFields = module === "plant_market" && sellerCategory === "nursery_owner";

  return (
    <main className="min-h-screen bg-[#f5f8f2] text-[#173b2d]">
      <header className="border-b border-[#e1e9df] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <BrandLogo href="/dashboard" imageClassName="h-10 w-40"/>
          <Link href="/dashboard" className="text-sm font-bold text-[#126b4f]">Dashboard</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#52705d]">
          <ArrowLeft size={16}/> ড্যাশবোর্ডে ফিরুন
        </Link>

        <div className="mt-6 rounded-[2rem] border border-[#e1e9df] bg-white p-5 shadow-sm sm:p-9">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#eaf4eb] p-3 text-[#126b4f]"><ShieldCheck size={25}/></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#a67f25]">Seller onboarding & access</p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">বিক্রেতা আবেদন ও যাচাই</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#637568]">
            একটি account থেকে Marketplace এবং Plant Market-এর জন্য আলাদা আবেদন করা যাবে।
            পরিচয়-সহায়ক নথি, ব্যবসা বা নার্সারির তথ্য Admin review করবেন।
            আবেদন জমা দিলেই বিক্রির অনুমতি পাওয়া যায় না।
          </p>

          {loading ? (
            <div className="py-8 text-sm text-slate-500">
              <LoaderCircle className="mr-2 inline animate-spin" size={17}/>আবেদন লোড হচ্ছে…
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => changeModule("plant_market")}
                  aria-pressed={module === "plant_market"}
                  className={"flex items-center gap-3 rounded-2xl border p-4 text-left transition " + (module === "plant_market" ? "border-[#167453] bg-[#eef7ef] ring-1 ring-[#167453]" : "border-slate-200 hover:border-[#9bb8a3]")}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4f2e6] text-[#167453]"><Sprout size={25}/></span>
                  <span><b className="block">Plant Market</b><span className="mt-1 block text-xs text-slate-500">নার্সারি, উৎপাদক, চারা ও গাছ</span></span>
                </button>
                <button type="button" onClick={() => changeModule("marketplace")}
                  aria-pressed={module === "marketplace"}
                  className={"flex items-center gap-3 rounded-2xl border p-4 text-left transition " + (module === "marketplace" ? "border-[#167453] bg-[#eef7ef] ring-1 ring-[#167453]" : "border-slate-200 hover:border-[#9bb8a3]")}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4f2e6] text-[#167453]"><Store size={25}/></span>
                  <span><b className="block">Marketplace</b><span className="mt-1 block text-xs text-slate-500">দোকান, পাইকার, ডিলার ও প্রতিষ্ঠান</span></span>
                </button>
              </div>

              {applications.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#e5ece2] p-4">
                  <h2 className="font-bold">আপনার আবেদনের অবস্থা</h2>
                  <div className="mt-3 space-y-2">
                    {applications.map((application) => (
                      <div key={application.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f8faf6] p-3 text-sm">
                        <span>{application.module === "plant_market" ? "Plant Market" : application.module === "marketplace" ? "Marketplace" : application.module === "employer" ? "নিয়োগদাতা (পুরোনো আবেদন)" : application.module === "transport" ? "পরিবহন সেবাদাতা (পুরোনো আবেদন)" : "Sell Harvest"}</span>
                        <span className="rounded-full bg-[#eaf4eb] px-3 py-1 text-xs font-bold">{statusLabel[application.status] || application.status}</span>
                        {application.review_note && <p className="w-full text-xs text-[#8b4a35]">Admin note: {application.review_note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasOpen ? (
                <p className="mt-6 rounded-xl bg-[#f7faf5] p-4 text-sm text-[#647568]">
                  এই module-এর জন্য আবেদন জমা আছে অথবা অনুমোদিত। Rejected হলে Admin-এর review note অনুযায়ী সংশোধন করে পুনরায় আবেদন করতে পারবেন।
                </p>
              ) : (
                <form onSubmit={submit} className="mt-7 space-y-6">
                  <section className="rounded-2xl border border-[#e5ece2] p-4 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#779080]">01 · Seller profile</p>
                    <h2 className="mt-1 text-lg font-black">আপনি কী ধরনের বিক্রেতা?</h2>
                    <label className="mt-4 block text-sm font-semibold">
                      Seller category <span className="text-rose-600">*</span>
                      <select name="sellerCategory" value={sellerCategory} onChange={(event) => setSellerCategory(event.target.value)} required
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
                        {(module === "plant_market" ? PLANT_MARKET_SELLER_CATEGORIES : MARKETPLACE_SELLER_CATEGORIES).map((category) => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-[#637568]">
                      {(module === "plant_market" ? PLANT_MARKET_SELLER_CATEGORIES : MARKETPLACE_SELLER_CATEGORIES).find((category) => category.value === sellerCategory)?.description}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-[#e5ece2] p-4 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#779080]">02 · Contact & location</p>
                    <h2 className="mt-1 text-lg font-black">যোগাযোগ ও অবস্থান</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold">যোগাযোগকারীর নাম <span className="text-rose-600">*</span>
                        <input name="contactName" required maxLength={120} autoComplete="name" className="mt-2 w-full rounded-xl border p-3"/>
                      </label>
                      <label className="block text-sm font-semibold">মোবাইল নম্বর <span className="text-rose-600">*</span>
                        <input name="contactPhone" type="tel" required maxLength={30} placeholder="01XXXXXXXXX" autoComplete="tel" className="mt-2 w-full rounded-xl border p-3"/>
                      </label>
                      <label className="block text-sm font-semibold">জেলা <span className="text-rose-600">*</span>
                        <input name="district" required maxLength={80} className="mt-2 w-full rounded-xl border p-3"/>
                      </label>
                      {module === "marketplace" && (
                        <label className="block text-sm font-semibold">ব্যবসার পূর্ণ ঠিকানা <span className="text-rose-600">*</span>
                          <input name="businessAddress" required maxLength={300} className="mt-2 w-full rounded-xl border p-3"/>
                        </label>
                      )}
                      <label className="block text-sm font-semibold sm:col-span-2">কোন কোন এলাকায় ডেলিভারি / সেবা দিতে পারবেন? <span className="text-rose-600">*</span>
                        <input name="deliveryCoverage" required minLength={3} maxLength={240} placeholder="যেমন: ঢাকা, গাজীপুর ও আশেপাশের এলাকা" className="mt-2 w-full rounded-xl border p-3"/>
                      </label>
                    </div>
                  </section>

                  {module === "marketplace" ? (
                    <section className="rounded-2xl border border-[#e5ece2] p-4 sm:p-5">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#779080]">03 · Business details</p>
                      <h2 className="mt-1 text-lg font-black">প্রতিষ্ঠান ও পণ্যের তথ্য</h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold sm:col-span-2">প্রতিষ্ঠান / দোকানের নাম <span className="text-rose-600">*</span>
                          <input name="organizationName" required maxLength={180} className="mt-2 w-full rounded-xl border p-3"/>
                        </label>
                        <label className="block text-sm font-semibold">Trade License / নিবন্ধন নম্বর (যদি প্রযোজ্য হয়)
                          <input name="tradeLicense" maxLength={100} className="mt-2 w-full rounded-xl border p-3"/>
                        </label>
                        <label className="block text-sm font-semibold">Website / ব্যবসায়িক পেজ (ঐচ্ছিক)
                          <input name="website" type="url" maxLength={300} placeholder="https://example.com" className="mt-2 w-full rounded-xl border p-3"/>
                        </label>
                        <label className="block text-sm font-semibold sm:col-span-2">আপনার ব্যবসা সম্পর্কে সংক্ষেপে লিখুন <span className="text-rose-600">*</span>
                          <textarea name="businessDescription" required minLength={20} maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border p-3"/>
                        </label>
                      </div>
                    </section>
                  ) : (
                    <section className="rounded-2xl border border-[#e5ece2] p-4 sm:p-5">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#779080]">03 · Nursery & growing details</p>
                      <h2 className="mt-1 text-lg font-black">গাছ, নার্সারি ও উৎপাদনের তথ্য</h2>
                      {plantNurseryFields && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <label className="block text-sm font-semibold">নার্সারির নাম <span className="text-rose-600">*</span>
                            <input name="nurseryName" required maxLength={180} className="mt-2 w-full rounded-xl border p-3"/>
                          </label>
                          <label className="block text-sm font-semibold">নার্সারির ঠিকানা / অবস্থান <span className="text-rose-600">*</span>
                            <input name="nurseryAddress" required maxLength={300} className="mt-2 w-full rounded-xl border p-3"/>
                          </label>
                        </div>
                      )}
                      <fieldset className="mt-4">
                        <legend className="text-sm font-semibold">কী ধরনের গাছ বা পণ্য নিয়ে কাজ করেন? <span className="text-rose-600">*</span></legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {PLANT_GARDENING_TYPES.map((type) => (
                            <label key={type.value} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                              <input type="checkbox" name="gardeningTypes" value={type.value} className="h-4 w-4 accent-[#167453]"/>
                              {type.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <label className="mt-4 block text-sm font-semibold">আপনার উৎপাদন / সংগ্রহ / বিক্রির ধরন <span className="text-rose-600">*</span>
                        <select name="operatingModel" required className="mt-2 w-full rounded-xl border bg-white p-3">
                          <option value="">নির্বাচন করুন</option>
                          {OPERATING_MODELS.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-4 block text-sm font-semibold">আপনার অভিজ্ঞতা ও কাজের বিবরণ <span className="text-rose-600">*</span>
                        <textarea name="experienceNote" required minLength={20} maxLength={2000} rows={4} className="mt-2 w-full rounded-xl border p-3"/>
                      </label>
                    </section>
                  )}

                  <section className="rounded-2xl border border-[#e5ece2] p-4 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#779080]">04 · Source & supporting documents</p>
                    <h2 className="mt-1 text-lg font-black">পণ্যের উৎস ও সহায়ক নথি</h2>
                    <label className="mt-4 block text-sm font-semibold">পণ্য কোথা থেকে সংগ্রহ / উৎপাদন করেন? <span className="text-rose-600">*</span>
                      <textarea name="sourceDeclaration" required minLength={20} maxLength={2000} rows={3} placeholder="নিজস্ব উৎপাদন, নার্সারি, সরবরাহকারী বা ব্র্যান্ডের তথ্য লিখুন..." className="mt-2 w-full rounded-xl border p-3"/>
                    </label>
                    <div className="mt-4 rounded-xl border border-dashed border-[#b8cbb7] bg-[#f8faf6] p-4">
                      <label className="block text-sm font-semibold">
                        <span className="flex items-center gap-2"><FileUp size={18}/> সহায়ক নথি আপলোড করুন (১–৫টি, প্রতিটি সর্বোচ্চ ৫ MB) <span className="text-rose-600">*</span></span>
                        <input type="file" required multiple accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => changeFiles(event.target.files)} className="mt-3 block w-full text-xs"/>
                      </label>
                      <p className="mt-2 text-xs font-normal text-slate-500">JPG, PNG বা PDF। নথি private storage-এ থাকবে; public URL তৈরি হবে না। কোন নথি দিচ্ছেন তা প্রতিটির পাশে নির্বাচন করুন।</p>
                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((item, index) => (
                            <div key={item.file.name + item.file.size + index} className="grid gap-2 rounded-xl border border-[#e3ebe0] bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                              <span className="min-w-0 break-all text-xs font-medium">{item.file.name}</span>
                              <select aria-label={item.file.name + " document type"} value={item.type} onChange={(event) => changeEvidenceType(index, event.target.value)} className="min-h-10 rounded-lg border p-2 text-xs">
                                {SELLER_EVIDENCE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                              </select>
                              <button type="button" onClick={() => removeFile(index)} aria-label="Remove file" className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                                <Trash2 size={14}/> Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <label className="flex items-start gap-3 rounded-xl border border-[#e5ece2] bg-[#f8faf6] p-4 text-sm leading-6">
                    <input type="checkbox" name="policyAccepted" required className="mt-1 h-4 w-4 shrink-0 accent-[#167453]"/>
                    <span>আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক, পণ্যের উৎস সম্পর্কে সত্য তথ্য দিয়েছি এবং AGRIVA-এর seller ও marketplace policies মেনে চলব। <span className="text-rose-600">*</span></span>
                  </label>

                  <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-3 font-bold text-white transition hover:bg-[#0f5942] disabled:cursor-not-allowed disabled:opacity-60">
                    {busy ? <LoaderCircle className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                    {busy ? "আবেদন জমা হচ্ছে…" : "আবেদন জমা দিন"}
                  </button>
                  <p className="text-center text-xs text-[#7a897e]">Admin review শেষ না হওয়া পর্যন্ত seller access সক্রিয় হবে না।</p>
                </form>
              )}
            </>
          )}

          {message && <p role="status" aria-live="polite" className={"mt-4 rounded-xl p-3 text-sm " + (error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>{message}</p>}
        </div>
      </section>
    </main>
  );
}
