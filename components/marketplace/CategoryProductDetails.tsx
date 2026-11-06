"use client";

import { useMemo, useState } from "react";

type Props = { categorySlug: string; onChange: (html: string) => void };

const COMMON = [
  { key: "brand", label: "ব্র্যান্ড / প্রস্তুতকারক", placeholder: "যাচাই করা ব্র্যান্ডের নাম" },
  { key: "origin", label: "উৎপত্তিস্থল", placeholder: "দেশ / অঞ্চল" },
  { key: "pack", label: "প্যাক সাইজ / পরিমাণ", placeholder: "যেমন ২৫০ গ্রাম, ১ কেজি" },
];
const CATEGORY_FIELDS: { match: string[]; fields: { key: string; label: string; placeholder: string }[] }[] = [
  { match: ["seed", "seeds", "বীজ"], fields: [
    { key: "variety", label: "জাত / ভ্যারাইটি", placeholder: "বীজের জাত" },
    { key: "purity", label: "বীজের বিশুদ্ধতা", placeholder: "শতকরা হার (যাচাই করা থাকলে)" },
    { key: "germination", label: "অঙ্কুরোদ্গম হার", placeholder: "শতকরা হার ও পরীক্ষার তারিখ" },
    { key: "season", label: "বপনের মৌসুম", placeholder: "উপযুক্ত মৌসুম" },
  ] },
  { match: ["fertilizer", "fertiliser", "সার"], fields: [
    { key: "npk", label: "NPK / পুষ্টি উপাদান", placeholder: "যেমন NPK ১০-১০-১০" },
    { key: "ingredients", label: "উপাদান", placeholder: "লেবেল অনুযায়ী উপাদান" },
    { key: "weight", label: "নেট ওজন", placeholder: "যেমন ১ কেজি" },
    { key: "application", label: "প্রয়োগের মাত্রা", placeholder: "লেবেল / কৃষি বিশেষজ্ঞের নির্দেশনা" },
  ] },
  { match: ["pesticide", "insecticide", "herbicide", "fungicide", "কীটনাশক"], fields: [
    { key: "active", label: "সক্রিয় উপাদান", placeholder: "লেবেলে উল্লেখিত নাম ও ঘনত্ব" },
    { key: "registration", label: "নিবন্ধন নম্বর", placeholder: "অনুমোদিত নিবন্ধন নম্বর" },
    { key: "target", label: "লক্ষ্যবস্তু / ফসল", placeholder: "লেবেল অনুযায়ী" },
    { key: "safety", label: "নিরাপত্তা নির্দেশনা", placeholder: "লেবেলের সতর্কতা ও PPE" },
  ] },
  { match: ["machinery", "machine", "equipment", "যন্ত্র"], fields: [
    { key: "model", label: "মডেল", placeholder: "মডেল নম্বর" },
    { key: "power", label: "ক্ষমতা / পাওয়ার", placeholder: "যেমন ২ HP" },
    { key: "capacity", label: "কাজের সক্ষমতা", placeholder: "প্রতি ঘণ্টায় / দিনে" },
    { key: "warranty", label: "ওয়ারেন্টি", placeholder: "প্রযোজ্য সময় ও শর্ত" },
  ] },
  { match: ["fruit", "vegetable", "food", "grain", "ফল", "সবজি"], fields: [
    { key: "grade", label: "গ্রেড / মান", placeholder: "পণ্যের গ্রেড" },
    { key: "harvest", label: "সংগ্রহ / উৎপাদনের সময়", placeholder: "মৌসুম বা তারিখ" },
    { key: "storage", label: "সংরক্ষণ পদ্ধতি", placeholder: "তাপমাত্রা / পরিবেশ" },
    { key: "shelf", label: "ব্যবহারযোগ্যতার সময়", placeholder: "যাচাই করা তথ্য" },
  ] },
];

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default function CategoryProductDetails({ categorySlug, onChange }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const schema = useMemo(() => CATEGORY_FIELDS.find(group => group.match.some(term => categorySlug.toLowerCase().includes(term)))?.fields ?? [
    { key: "material", label: "উপাদান / মূল বৈশিষ্ট্য", placeholder: "যাচাই করা তথ্য" },
    { key: "quality", label: "গুণমান / গ্রেড", placeholder: "প্রযোজ্য মান" },
    { key: "storage", label: "সংরক্ষণ পদ্ধতি", placeholder: "সংরক্ষণের নির্দেশনা" },
    { key: "usage", label: "ব্যবহার", placeholder: "ব্যবহারের নির্দেশনা" },
  ], [categorySlug]);
  const fields = [...COMMON, ...schema];
  const filled = fields.filter(field => values[field.key]?.trim());
  const highlights = (values.highlights ?? "").split("\n").map(item => item.trim()).filter(Boolean).slice(0, 5);

  function update(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    const rows = fields.filter(field => next[field.key]?.trim());
    const bullets = (next.highlights ?? "").split("\n").map(item => item.trim()).filter(Boolean).slice(0, 5);
    const parts = [
      bullets.length ? `<h2>পণ্যের প্রধান বৈশিষ্ট্য</h2><ul>${bullets.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "",
      rows.length ? `<h2>পণ্যের বিস্তারিত তথ্য</h2><ul>${rows.map(field => `<li><strong>${escapeHtml(field.label)}:</strong> ${escapeHtml(next[field.key].trim())}</li>`).join("")}</ul>` : "",
    ].filter(Boolean);
    onChange(parts.join(""));
  }

  return <section className="space-y-4 rounded-2xl border border-[#dce8dc] bg-[#f8fbf7] p-4 md:col-span-2 xl:col-span-3">
    <div><h3 className="text-base font-extrabold text-[#173f29]">পণ্যের Highlights ও Specification</h3><p className="mt-1 text-xs leading-5 text-[#68796b]">ক্যাটাগরি অনুযায়ী প্রাসঙ্গিক তথ্য যোগ করুন। কোনো তথ্য নিশ্চিত না হলে ফাঁকা রাখুন—অনুমান করে লিখবেন না।</p></div>
    <label className="block text-sm font-bold">প্রধান বৈশিষ্ট্য (প্রতি লাইনে একটি, সর্বোচ্চ ৫টি)<textarea value={values.highlights ?? ""} onChange={event => update("highlights", event.target.value)} rows={3} maxLength={1000} placeholder={"উদাহরণ: ভালো মানের প্যাকেজিং\nযাচাই করা উৎপত্তিস্থল"} className="mt-1.5 w-full rounded-xl border border-[#d4dfd3] bg-white px-3 py-2.5 text-sm font-normal"/></label>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(field => <label key={field.key} className="block text-sm font-bold">{field.label}<input value={values[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} maxLength={180} placeholder={field.placeholder} className="mt-1.5 w-full rounded-xl border border-[#d4dfd3] bg-white px-3 py-2.5 text-sm font-normal"/></label>)}
    </div>
    <div className="rounded-xl border border-[#e1e9df] bg-white p-4"><p className="text-[11px] font-extrabold uppercase tracking-wide text-[#718073]">Product details preview</p>{highlights.length > 0 && <><h4 className="mt-3 text-sm font-extrabold text-[#244b32]">প্রধান বৈশিষ্ট্য</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-[#46584a]">{highlights.map((item, index) => <li key={index}>{item}</li>)}</ul></>}{filled.length > 0 && <><h4 className="mt-3 text-sm font-extrabold text-[#244b32]">পণ্যের বিস্তারিত তথ্য</h4><dl className="mt-2 grid gap-2 sm:grid-cols-2">{filled.map(field => <div key={field.key} className="flex flex-wrap justify-between gap-2 border-b border-[#edf1eb] pb-2 text-sm"><dt className="font-semibold text-[#68796b]">{field.label}</dt><dd className="font-bold text-[#243d2b]">{values[field.key]}</dd></div>)}</dl></>}</div>
    <p className="text-xs text-[#718073]">{highlights.length + filled.length}টি তথ্য যোগ করা হয়েছে। এগুলো পণ্যের বিবরণের সঙ্গে সুন্দরভাবে দেখানো হবে।</p>
  </section>;
}
