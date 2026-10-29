"use client";

import { useState } from "react";

type SeoFaq = { question: string; answer: string };
type AttributeSuggestion = { key: string; label: string; reason: string };
type Props = {
  productId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string | null;
  stock: number | null;
  productAttributes: Record<string, string> | null;
  imageCount: number;
  seoImageAltTexts: string[] | null;
  seoAttributeSuggestions: AttributeSuggestion[] | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
  seoContent: string | null;
  seoFaqs: SeoFaq[] | null;
};

export default function AdminProductSeoAssistant(props: Props) {
  const [seoTitle, setSeoTitle] = useState(props.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(props.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(Array.isArray(props.seoKeywords) ? props.seoKeywords.join(", ") : "");
  const [seoContent, setSeoContent] = useState(props.seoContent ?? "");
  const [seoFaqs, setSeoFaqs] = useState(Array.isArray(props.seoFaqs) ? props.seoFaqs.map((faq) => `${faq.question ?? ""} | ${faq.answer ?? ""}`).join("\n") : "");
  const [seoImageAltTexts, setSeoImageAltTexts] = useState(Array.isArray(props.seoImageAltTexts) ? props.seoImageAltTexts.join("\n") : "");
  const [seoAttributeSuggestions, setSeoAttributeSuggestions] = useState(Array.isArray(props.seoAttributeSuggestions) ? props.seoAttributeSuggestions.map((item) => `${item.key} | ${item.label} | ${item.reason}`).join("\n") : "");
  const [loading, setLoading] = useState<"generate" | "improve" | null>(null);
  const [message, setMessage] = useState("");

  async function generate(mode: "generate" | "improve") {
    setLoading(mode);
    setMessage("");
    try {
      const response = await fetch("/api/admin/products/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          mode,
          product: {
            name: props.name,
            description: props.description ?? "",
            category: props.category ?? "",
            price: props.price,
            stock: props.stock,
            product_attributes: props.productAttributes ?? {},
            image_count: props.imageCount,
          },
          existing: {
            seo_title: seoTitle,
            seo_description: seoDescription,
            seo_keywords: seoKeywords.split(",").map((value) => value.trim()).filter(Boolean),
            seo_content: seoContent,
            seo_faqs: seoFaqs,
            seo_image_alt_texts: seoImageAltTexts.split("\n").map((value) => value.trim()).filter(Boolean),
            seo_attribute_suggestions: seoAttributeSuggestions.split("\n").map((line) => { const [key, label, ...reason] = line.split("|").map((value) => value.trim()); return { key, label, reason: reason.join(" | ") }; }).filter((item) => item.key && item.label && item.reason),
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "AI SEO content তৈরি করা যায়নি।");
      const draft = result.content;
      if (!draft || typeof draft !== "object") throw new Error("AI থেকে সঠিক content পাওয়া যায়নি।");
      setSeoTitle(typeof draft.seo_title === "string" ? draft.seo_title : seoTitle);
      setSeoDescription(typeof draft.seo_description === "string" ? draft.seo_description : seoDescription);
      setSeoKeywords(Array.isArray(draft.seo_keywords) ? draft.seo_keywords.filter((value: unknown): value is string => typeof value === "string").join(", ") : seoKeywords);
      setSeoContent(typeof draft.seo_content === "string" ? draft.seo_content : seoContent);
      setSeoFaqs(Array.isArray(draft.seo_faqs) ? draft.seo_faqs.filter((faq: unknown): faq is SeoFaq => !!faq && typeof faq === "object" && typeof (faq as SeoFaq).question === "string" && typeof (faq as SeoFaq).answer === "string").map((faq: SeoFaq) => `${faq.question} | ${faq.answer}`).join("\n") : seoFaqs);
      setSeoImageAltTexts(Array.isArray(draft.seo_image_alt_texts) ? draft.seo_image_alt_texts.filter((value: unknown): value is string => typeof value === "string").join("\n") : seoImageAltTexts);
      setSeoAttributeSuggestions(Array.isArray(draft.seo_attribute_suggestions) ? draft.seo_attribute_suggestions.filter((item: unknown): item is AttributeSuggestion => !!item && typeof item === "object" && typeof (item as AttributeSuggestion).key === "string" && typeof (item as AttributeSuggestion).label === "string" && typeof (item as AttributeSuggestion).reason === "string").map((item: AttributeSuggestion) => `${item.key} | ${item.label} | ${item.reason}`).join("\n") : seoAttributeSuggestions);
      setMessage("AI draft ফর্মে বসানো হয়েছে। তথ্য যাচাই ও প্রয়োজনে সম্পাদনা করে নিচের Save changes বোতামে ক্লিক করুন। এখনো public page-এ প্রকাশ হয়নি।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black">Admin AI SEO Assistant</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#637266]">AI seller-এর দেওয়া তথ্য থেকে SEO draft তৈরি করবে। AI-generated তথ্য যাচাই করুন; save না করা পর্যন্ত কোনো পরিবর্তন প্রকাশ হবে না।</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => generate("generate")} disabled={loading !== null} className="rounded-xl bg-[#17452c] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">
            {loading === "generate" ? "তৈরি হচ্ছে..." : "Generate SEO draft"}
          </button>
          <button type="button" onClick={() => generate("improve")} disabled={loading !== null} className="rounded-xl border border-[#17452c] bg-white px-3 py-2 text-xs font-extrabold text-[#17452c] disabled:opacity-50">
            {loading === "improve" ? "উন্নত হচ্ছে..." : "Improve existing content"}
          </button>
        </div>
      </div>
      {message && <p role="status" aria-live="polite" className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#17452c]">{message}</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">SEO Title <span className="font-normal text-slate-500">({seoTitle.length}/70)</span>
          <input name="seo_title" maxLength={70} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder={`${props.name} | AGRIVA`} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
        <label className="text-sm font-bold">Meta Description <span className="font-normal text-slate-500">({seoDescription.length}/160)</span>
          <textarea name="seo_description" rows={2} maxLength={160} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="পণ্যের প্রধান উপকারিতা, ধরন ও প্রাসঙ্গিক তথ্য লিখুন..." className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
        <label className="text-sm font-bold md:col-span-2">Target Keywords <span className="font-normal text-slate-500">(কমা দিয়ে আলাদা, সর্বোচ্চ ১০টি)</span>
          <input name="seo_keywords" value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} placeholder="ধানের বীজ, rice seeds Bangladesh" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
        <label className="text-sm font-bold md:col-span-2">SEO Landing Page Content <span className="font-normal text-slate-500">({seoContent.length}/10000)</span>
          <textarea name="seo_content" rows={6} maxLength={10000} value={seoContent} onChange={(event) => setSeoContent(event.target.value)} placeholder="ব্যবহার, বৈশিষ্ট্য, উপযোগিতা, সংরক্ষণ/যত্ন ও যাচাইকৃত পণ্যের তথ্য..." className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
        <label className="text-sm font-bold md:col-span-2">FAQ <span className="font-normal text-slate-500">(প্রতি লাইনে প্রশ্ন | উত্তর; সর্বোচ্চ ৮টি)</span>
          <textarea name="seo_faqs" rows={4} value={seoFaqs} onChange={(event) => setSeoFaqs(event.target.value)} placeholder={"এই পণ্যটি কী কাজে লাগে? | শুধু যাচাইকৃত ব্যবহার লিখুন।"} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
        <label className="text-sm font-bold md:col-span-2">Image alt text <span className="font-normal text-slate-500">(প্রতি লাইনে একটি; সর্বোচ্চ {props.imageCount}টি, প্রতিটি ২৫০ অক্ষরের মধ্যে)</span>
          <textarea name="seo_image_alt_texts" rows={Math.max(2, Math.min(4, props.imageCount || 2))} maxLength={1000} value={seoImageAltTexts} onChange={(event) => setSeoImageAltTexts(event.target.value)} placeholder="পণ্যের নাম ও নিশ্চিত পরিচয় দিয়ে ছবির সংক্ষিপ্ত বর্ণনা" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
        <label className="text-sm font-bold md:col-span-2">Missing product attribute suggestions <span className="font-normal text-slate-500">(প্রতি লাইনে key | label | কেন দরকার)</span>
          <textarea name="seo_attribute_suggestions" rows={4} maxLength={8000} value={seoAttributeSuggestions} onChange={(event) => setSeoAttributeSuggestions(event.target.value)} placeholder={"pack_size | প্যাক সাইজ | ক্রেতার পরিমাণ বুঝতে সাহায্য করবে"} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" />
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">AI অজানা licence, certification, ফলন, germination rate বা পণ্যের সুবিধা অনুমান করে যোগ করবে না। বাস্তব তথ্য যাচাই করে তারপর Save changes করুন।</p>
    </section>
  );
}
