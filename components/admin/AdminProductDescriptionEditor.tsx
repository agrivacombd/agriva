"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_PRODUCT_DESCRIPTION_HTML_LENGTH, sanitizeProductDescription } from "@/lib/marketplace/product-description";

type Props = { value: string; onChange?: (value: string) => void; productName?: string };

const tools = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "H2", command: "formatBlock", value: "h2", title: "Heading 2" },
  { label: "H3", command: "formatBlock", value: "h3", title: "Heading 3" },
  { label: "• List", command: "insertUnorderedList", title: "Bullet list" },
  { label: "1. List", command: "insertOrderedList", title: "Numbered list" },
  { label: "Quote", command: "formatBlock", value: "blockquote", title: "Quote" },
];

function toText(html: string) {
  return html.replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AdminProductDescriptionEditor({ value, onChange, productName = "" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState(productName);
  const [html, setHtml] = useState(value);
  const [showPreview, setShowPreview] = useState(false);
  const text = useMemo(() => toText(html), [html]);
  const words = text ? text.split(/\s+/).length : 0;
  const hasKeyword = Boolean(keyword.trim()) && text.toLocaleLowerCase().includes(keyword.trim().toLocaleLowerCase());
  const hasSections = /<(h2|h3|ul|ol|li)\b/i.test(html);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
    setHtml(value);
  }, [value]);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    if (editorRef.current) { setHtml(editorRef.current.innerHTML); onChange?.(editorRef.current.innerHTML); }
  }

  function addLink() {
    const url = window.prompt("লিংকের URL দিন (https://...)");
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
      run("createLink", parsed.toString());
    } catch { /* Ignore invalid URLs. */ }
  }

  function insertOutline() {
    const safeName = (productName || "পণ্যের নাম").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const outline = `<p><strong>${safeName}</strong> সম্পর্কে সংক্ষেপে পরিচিতি লিখুন। পণ্যটি কী, কার জন্য এবং এর প্রধান বৈশিষ্ট্য কী—শুধু যাচাই করা তথ্য দিন।</p><h2>পণ্যের প্রধান বৈশিষ্ট্য</h2><ul><li>উপাদান / জাত / মডেল:</li><li>প্যাক সাইজ / পরিমাণ:</li><li>উৎপত্তিস্থল / প্রস্তুতকারক:</li></ul><h2>ব্যবহার ও উপকারিতা</h2><p>কীভাবে এবং কোন কাজে ব্যবহার করা যায় তা বাস্তব তথ্য দিয়ে লিখুন।</p><h2>সংরক্ষণ ও অতিরিক্ত তথ্য</h2><p>মেয়াদ, সংরক্ষণ, প্যাকেজিং, সতর্কতা বা প্রাসঙ্গিক নির্দেশনা উল্লেখ করুন।</p>`;
    if (editorRef.current) {
      editorRef.current.innerHTML = outline;
      setHtml(outline);
      onChange?.(outline);
    }
  }

  return <section className="md:col-span-2 xl:col-span-3">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div><label className="text-sm font-bold">Product description</label><p className="mt-1 text-xs font-normal text-[#637266]">Formatting, SEO guidance এবং live preview — একই editor-এ</p></div>
      <span className="text-xs font-semibold text-[#637266]">{words} words · {text.length}/20,000 characters</span>
    </div>
    <div className="mt-2 overflow-hidden rounded-xl border border-[#cfdccf] bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-100">
      <div className="flex flex-wrap gap-1 border-b bg-[#f7faf6] p-2">
        {tools.map(tool => <button key={tool.label} type="button" title={tool.title} onMouseDown={event => event.preventDefault()} onClick={() => run(tool.command, tool.value)} className="min-h-9 rounded-lg border border-[#e1e9df] bg-white px-3 text-xs font-bold text-[#244b32] hover:bg-emerald-50">{tool.label}</button>)}
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={addLink} className="min-h-9 rounded-lg border border-[#e1e9df] bg-white px-3 text-xs font-bold text-[#244b32] hover:bg-emerald-50">Link</button>
        <button type="button" onClick={insertOutline} className="ml-auto min-h-9 rounded-lg bg-[#e8f2e6] px-3 text-xs font-bold text-[#17452c] hover:bg-[#dcebd9]">SEO outline বসান</button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Product description editor" aria-multiline="true" onInput={event => { setHtml(event.currentTarget.innerHTML); onChange?.(event.currentTarget.innerHTML); }} className="prose prose-sm max-w-none min-h-48 px-4 py-3 text-sm leading-7 outline-none [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_h3]:font-bold [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-4 [&_blockquote]:pl-3" data-placeholder="পণ্যের পরিচিতি, বৈশিষ্ট্য, ব্যবহার, প্যাক সাইজ ও যাচাই করা তথ্য লিখুন..." />
    </div>
    <input type="hidden" name="description" value={html} />
    <div className="mt-3 grid gap-3 rounded-xl border border-[#e1e9df] bg-[#f8fbf7] p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <label className="text-xs font-bold text-[#385640]">Focus keyword<input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="যেমন: organic chia seeds" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal"/></label>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={hasKeyword ? "rounded-full bg-emerald-100 px-3 py-1.5 font-bold text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1.5 font-bold text-amber-800"}>{hasKeyword ? "✓ Keyword আছে" : "Keyword যোগ করুন"}</span>
        <span className={hasSections ? "rounded-full bg-emerald-100 px-3 py-1.5 font-bold text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1.5 font-bold text-amber-800"}>{hasSections ? "✓ Headings / list আছে" : "Heading বা list যোগ করুন"}</span>
        <span className={words >= 40 ? "rounded-full bg-emerald-100 px-3 py-1.5 font-bold text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1.5 font-bold text-amber-800"}>{words >= 40 ? "✓ বিস্তারিত লেখা" : "আরও উপকারী তথ্য দিন"}</span>
      </div>
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs leading-5 text-[#718073]">SEO টিপস: unique description লিখুন; প্রকৃত specification, size, origin ও ব্যবহার যোগ করুন। Keyword স্বাভাবিকভাবে ব্যবহার করুন—বারবার নয়।</p>
      <button type="button" onClick={() => setShowPreview(current => !current)} className="shrink-0 text-xs font-bold text-emerald-800 underline underline-offset-2">{showPreview ? "Preview বন্ধ করুন" : "পাবলিক পেজ Preview"}</button>
    </div>
    {showPreview && <div className="mt-3 rounded-xl border border-[#dfe8dc] bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#6a7c6c]">Search snippet preview</p>
      <p className="mt-2 text-base font-semibold text-[#1a0dab]">{productName || "Product name"} | AGRIVA</p>
      <p className="mt-1 text-xs text-emerald-800">agriva.com.bd/marketplace/product-slug</p>
      <p className="mt-1 text-sm leading-6 text-[#4b5563]">{text.slice(0, 155) || "পণ্যের বিবরণ লিখলে এখানে search snippet-এর preview দেখা যাবে।"}</p>
      <div className="mt-4 border-t pt-3">
        <p className="text-xs font-bold text-[#526454]">পণ্যের বিবরণ Preview</p>
        <div className="prose prose-sm mt-2 max-w-none break-words text-sm" dangerouslySetInnerHTML={{ __html: sanitizeProductDescription(html) }} />
      </div>
    </div>}
  </section>;
}
