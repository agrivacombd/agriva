"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MARKETPLACE_CATEGORIES, slugifyProductName } from "@/lib/marketplace/taxonomy";

type FormState = {
  name: string; slug: string; category_slug: string; subcategory_slug: string;
  brand_name: string; sku: string; price: string; stock: string; commission: string;
  unit_label: string; origin_district: string; packaging_details: string;
  short_description: string; description: string; composition: string;
  usage_instructions: string; safety_information: string;
  image_urls: string; image_alt_text: string; seo_title: string;
  meta_description: string; search_keywords: string; faq_question: string; faq_answer: string;
};
const initial: FormState = {
  name:"", slug:"", category_slug:"", subcategory_slug:"", brand_name:"", sku:"",
  price:"", stock:"", commission:"0", unit_label:"", origin_district:"",
  packaging_details:"", short_description:"", description:"", composition:"",
  usage_instructions:"", safety_information:"", image_urls:"", image_alt_text:"",
  seo_title:"", meta_description:"", search_keywords:"", faq_question:"", faq_answer:"",
};
const input = "mt-1.5 w-full rounded-xl border border-[#dce5d8] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";
const label = "block text-sm font-bold text-[#24462d]";
const splitLines = (value: string) => value.split(/\n|,/).map(value => value.trim()).filter(Boolean);

export default function ProductSeoStudioPage() {
  const [form,setForm] = useState<FormState>(initial);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [saved,setSaved] = useState<{slug:string;id:string}|null>(null);
  const set = (key:keyof FormState,value:string) => setForm(current=>({...current,[key]:value}));
  const category = MARKETPLACE_CATEGORIES.find(item=>item.slug===form.category_slug);
  const generatedSlug = useMemo(()=>slugifyProductName(form.name)||"your-product", [form.name]);
  const slug = form.slug.trim() || generatedSlug;
  const images = splitLines(form.image_urls);
  const keywords = splitLines(form.search_keywords);
  const title = form.seo_title.trim() || (form.name ? `${form.name} | AGRIVA`.slice(0,70) : "আপনার SEO title");
  const description = form.meta_description.trim() || form.short_description.trim() || form.description.replace(/\s+/g," ").slice(0,155);
  const checks = [
    [Boolean(form.name.trim()),"পণ্যের নাম"],
    [Boolean(category),"সঠিক ক্যাটাগরি"],
    [form.description.trim().length>=80,"কমপক্ষে ৮০ অক্ষরের নিজস্ব বিবরণ"],
    [Number(form.price)>0,"সঠিক মূল্য"],
    [images.length>0,"কমপক্ষে একটি HTTPS ছবি"],
    [description.length>=70,"Meta description"],
    [Boolean(form.image_alt_text.trim()),"Image alt text"],
    [keywords.length>0,"Search keywords"],
    [Boolean(form.origin_district.trim()),"উৎপত্তির জেলা"],
  ] as const;
  const score = Math.round(checks.filter(item=>item[0]).length/checks.length*100);

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setSaved(null);
    try {
      const response = await fetch("/api/admin/product-seo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        ...form, slug, image_urls:images, search_keywords:keywords,
        seo_faqs: form.faq_question.trim() && form.faq_answer.trim()
          ? [{question:form.faq_question,answer:form.faq_answer}] : [],
      })});
      const result = await response.json();
      if(!response.ok) throw new Error(result.error||"পণ্য সংরক্ষণ করা যায়নি।");
      setSaved({id:result.product.id,slug:result.product.slug});
      setMessage(result.message);
      setForm(initial);
    } catch(error) {
      setMessage(error instanceof Error?error.message:"নেটওয়ার্ক সমস্যা হয়েছে।");
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-7 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><Link href="/admin" className="text-xs font-bold text-emerald-100">← Admin overview</Link><p className="mt-2 text-xs font-black uppercase tracking-[.18em] text-[#d9b85b]">AGRIVA · Product Intelligence</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Product SEO Studio</h1><p className="mt-2 text-sm text-emerald-100">পণ্যের তথ্য, SEO preview ও publish-readiness এক জায়গায় তৈরি করুন।</p></div>
        <Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Catalogue ↗</Link>
      </header>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-800">01 · Product identity</p><h2 className="mt-1 text-xl font-black">পণ্যের মূল তথ্য</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={label}>পণ্যের নাম *<input required maxLength={160} className={input} value={form.name} onChange={e=>{set("name",e.target.value);if(!form.slug)set("slug",slugifyProductName(e.target.value));}} placeholder="যেমন: রাজশাহীর ফজলি আম"/></label>
              <label className={label}>Brand<input className={input} maxLength={160} value={form.brand_name} onChange={e=>set("brand_name",e.target.value)} placeholder="যাচাইকৃত ব্র্যান্ড"/></label>
              <label className={label}>SKU / Product code<input className={input} maxLength={100} value={form.sku} onChange={e=>set("sku",e.target.value)} placeholder="ঐচ্ছিক unique code"/></label>
              <label className={label}>ক্যাটাগরি *<select required className={input} value={form.category_slug} onChange={e=>setForm(current=>({...current,category_slug:e.target.value,subcategory_slug:""}))}><option value="">ক্যাটাগরি নির্বাচন করুন</option>{MARKETPLACE_CATEGORIES.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
              <label className={label}>সাব-ক্যাটাগরি<select className={input} value={form.subcategory_slug} onChange={e=>set("subcategory_slug",e.target.value)}><option value="">ঐচ্ছিক</option>{category?.subcategories.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
              <label className={label}>উৎপত্তির জেলা<input className={input} value={form.origin_district} onChange={e=>set("origin_district",e.target.value)} placeholder="যেমন: রাজশাহী"/></label>
              <label className={label}>মূল্য (৳) *<input required type="number" min="0.01" step="0.01" className={input} value={form.price} onChange={e=>set("price",e.target.value)}/></label>
              <label className={label}>স্টক *<input required type="number" min="0" step="0.01" className={input} value={form.stock} onChange={e=>set("stock",e.target.value)}/></label>
              <label className={label}>বিক্রয় একক<input className={input} value={form.unit_label} onChange={e=>set("unit_label",e.target.value)} placeholder="১ কেজি / ৫০০ গ্রাম / ১টি"/></label>
              <label className={label}>রিসেলার কমিশন (%)<input type="number" min="0" max="100" step="0.01" className={input} value={form.commission} onChange={e=>set("commission",e.target.value)}/></label>
              <label className={label+" sm:col-span-2"}>সংক্ষিপ্ত বিবরণ<textarea rows={2} maxLength={320} className={input} value={form.short_description} onChange={e=>set("short_description",e.target.value)} placeholder="পণ্যের সবচেয়ে গুরুত্বপূর্ণ সত্য তথ্য ১–২ বাক্যে লিখুন।"/></label>
              <label className={label+" sm:col-span-2"}>বিস্তারিত পণ্যের বিবরণ *<textarea required minLength={30} maxLength={10000} rows={6} className={input} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="পণ্যের বৈশিষ্ট্য, পরিমাণ, মান, ব্যবহার, সীমাবদ্ধতা ও যাচাইকৃত উৎস লিখুন।"/></label>
            </div>
          </section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-800">02 · Product details</p><h2 className="mt-1 text-xl font-black">পণ্যের অতিরিক্ত তথ্য</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={label}>উপাদান / Composition<textarea rows={3} className={input} value={form.composition} onChange={e=>set("composition",e.target.value)} placeholder="লেবেল বা নির্ভরযোগ্য তথ্য অনুযায়ী"/></label>
              <label className={label}>Packaging details<textarea rows={3} className={input} value={form.packaging_details} onChange={e=>set("packaging_details",e.target.value)} placeholder="প্যাকেট, ওজন, সংরক্ষণ ইত্যাদি"/></label>
              <label className={label}>ব্যবহারবিধি<textarea rows={4} className={input} value={form.usage_instructions} onChange={e=>set("usage_instructions",e.target.value)} placeholder="প্রকৃত ও অনুমোদিত নির্দেশনা দিন"/></label>
              <label className={label}>সতর্কতা ও নিরাপত্তা তথ্য<textarea rows={4} className={input} value={form.safety_information} onChange={e=>set("safety_information",e.target.value)} placeholder="প্রযোজ্য সতর্কতা, সংরক্ষণ ও লেবেল নির্দেশনা"/></label>
            </div>
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">সার, বীজ বা crop-protection পণ্যের মাত্রা, নিবন্ধন, স্বাস্থ্য/ফলন-সংক্রান্ত দাবি অনুমান করে লিখবেন না। কেবল প্রস্তুতকারক/সরকারি লেবেল-সমর্থিত তথ্য ব্যবহার করুন।</p>
          </section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-800">03 · Media & search</p><h2 className="mt-1 text-xl font-black">ছবি ও SEO সেটআপ</h2>
            <label className={label+" mt-5"}>Public HTTPS image URLs<textarea required rows={3} className={input} value={form.image_urls} onChange={e=>set("image_urls",e.target.value)} placeholder="প্রতি লাইনে একটি HTTPS image URL; প্রথমটি প্রধান ছবি"/></label>
            {images.length>0&&<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.slice(0,4).map((src,index)=><div key={src+index} className="overflow-hidden rounded-xl border bg-slate-50"><img src={src} alt={form.image_alt_text||"পণ্যের ছবির preview"} className="h-28 w-full object-contain" loading="lazy"/><p className="truncate px-2 py-1 text-xs">{index===0?"প্রধান ছবি":`ছবি ${index+1}`}</p></div>)}</div>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={label}>Image alt text<input maxLength={180} className={input} value={form.image_alt_text} onChange={e=>set("image_alt_text",e.target.value)} placeholder="ছবিতে বাস্তবে কী দেখা যাচ্ছে"/></label>
              <label className={label}>SEO title<input maxLength={70} className={input} value={form.seo_title} onChange={e=>set("seo_title",e.target.value)} placeholder="পণ্যের নাম ও মূল বৈশিষ্ট্য"/><span className="mt-1 block text-xs font-normal text-slate-500">{title.length}/70 characters</span></label>
              <label className={label+" sm:col-span-2"}>Meta description<textarea maxLength={180} rows={3} className={input} value={form.meta_description} onChange={e=>set("meta_description",e.target.value)} placeholder="প্রকৃত বৈশিষ্ট্য, পরিমাণ ও কেনার তথ্য দিয়ে লিখুন"/></label>
              <label className={label+" sm:col-span-2"}>Search keywords<textarea rows={2} className={input} value={form.search_keywords} onChange={e=>set("search_keywords",e.target.value)} placeholder="প্রতি লাইনে একটি বাংলা/ইংরেজি search phrase"/></label>
              <label className={label+" sm:col-span-2"}>URL slug<input className={input} value={form.slug} onChange={e=>set("slug",e.target.value)} placeholder={generatedSlug}/><span className="mt-1 block text-xs font-normal text-slate-500">/marketplace/{slug} — publish-এর পর slug স্থিতিশীল রাখুন।</span></label>
            </div>
          </section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-800">04 · Helpful FAQ</p><h2 className="mt-1 text-xl font-black">ক্রেতার সাধারণ প্রশ্ন</h2>
            <div className="mt-4 grid gap-4"><label className={label}>প্রশ্ন<input maxLength={180} className={input} value={form.faq_question} onChange={e=>set("faq_question",e.target.value)} placeholder="যেমন: এই পণ্যটি কোন প্যাক সাইজে পাওয়া যায়?"/></label><label className={label}>উত্তর<textarea rows={3} maxLength={800} className={input} value={form.faq_answer} onChange={e=>set("faq_answer",e.target.value)} placeholder="শুধু যাচাইকৃত product information দিয়ে উত্তর দিন।"/></label></div>
          </section>
          <button disabled={busy} className="w-full rounded-xl bg-[#173f29] px-5 py-4 font-black text-white disabled:opacity-50">{busy?"সংরক্ষণ হচ্ছে...":"SEO review-এর জন্য Draft সংরক্ষণ করুন"}</button>
          {message&&<p role="status" className="rounded-xl border border-[#dce5d8] bg-white p-4 text-sm font-semibold">{message}</p>}
          {saved&&<p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><b>Saved:</b> {saved.slug} · Draft · <Link className="font-bold underline" href="/admin/products">Catalogue দেখুন</Link></p>}
        </form>
        <aside className="space-y-4">
          <section className="sticky top-4 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-800">Live analysis</p><h2 className="mt-2 text-lg font-black">SEO readiness</h2>
            <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black">{score}%</span><span className="pb-1 text-xs text-slate-500">{checks.filter(item=>item[0]).length}/{checks.length} checks</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{width:score+"%"}}/></div>
            <ul className="mt-4 space-y-2">{checks.map(([ok,name])=><li key={name} className="flex gap-2 text-xs"><span className={ok?"text-emerald-700":"text-amber-700"}>{ok?"✓":"○"}</span>{name}</li>)}</ul>
            <p className="mt-5 text-xs font-bold text-slate-500">Google search preview (illustrative)</p>
            <div className="mt-2 rounded-xl border p-3"><p className="truncate text-sm font-semibold text-blue-800">{title}</p><p className="mt-1 break-all text-[11px] text-emerald-800">agriva.com.bd/marketplace/{slug}</p><p className="mt-1 text-xs leading-5 text-slate-600">{description||"Meta description preview এখানে দেখাবে।"}</p></div>
            <p className="mt-4 text-xs leading-5 text-slate-500">এটি একটি অভ্যন্তরীণ checklist, Google ranking বা indexing-এর নিশ্চয়তা নয়। Search keyword তথ্য/সম্পাদনার সহায়ক; keyword stuffing করবেন না।</p>
          </section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><h3 className="font-black">Publish policy</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-slate-600"><li>নতুন product সবসময় Draft হিসেবে সংরক্ষিত হয়।</li><li>SEO review এবং moderation আলাদা ধাপ।</li><li>শুধু বাস্তব তথ্য, নিজস্ব ছবি ও যাচাইকৃত দাবি ব্যবহার করুন।</li><li>Slug প্রকাশের পরে বদলালে redirect পরিকল্পনা প্রয়োজন।</li><li>Fake review/rating তৈরি করা হয় না।</li></ul></section>
        </aside>
      </div>
    </div>
  </main>;
}
