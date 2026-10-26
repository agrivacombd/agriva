"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MARKETPLACE_CATEGORIES, slugifyProductName } from "@/lib/marketplace/taxonomy";

const inputClass = "mt-1.5 w-full rounded-xl border border-[#dce5d8] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";
const labelClass = "block text-sm font-bold text-[#24462d]";
const categories = MARKETPLACE_CATEGORIES;
const lines = (value: string) => value.split(/\n|,/).map(x => x.trim()).filter(Boolean);
export default function ProductStudioPage() {
  const [form, setForm] = useState({
    name:"", slug:"", brandName:"", sku:"", categorySlug:"", subcategorySlug:"", productType:"",
    price:"", stock:"", commission:"0", unitLabel:"", description:"", composition:"",
    usageInstructions:"", safetyInformation:"", originDistrict:"", packagingDetails:"",
    cropSuitability:"", imageUrls:"", seoTitle:"", metaDescription:"", searchKeywords:"", hashtags:"", status:"draft",
  });
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [saved,setSaved]=useState<{id:string;slug:string;status:string}|null>(null);
  const set=(key:string,value:string)=>setForm(prev=>({...prev,[key]:value}));
  const category=categories.find(x=>x.slug===form.categorySlug);
  const generatedSlug=useMemo(()=>slugifyProductName(form.name)||"your-product-name", [form.name]);
  const seoTitle=form.seoTitle.trim()|| (form.name ? `${form.name} | AGRIVA` : "আপনার পণ্যের SEO title");
  const meta=form.metaDescription.trim() || form.description.replace(/\s+/g," ").slice(0,155);
  const imgs=lines(form.imageUrls);
  const score=useMemo(()=>{
    const checks=[
      [Boolean(form.name.trim()),"পণ্যের নাম"],
      [Boolean(form.categorySlug),"সঠিক ক্যাটাগরি"],
      [form.description.trim().length>=80,"কমপক্ষে ৮০ অক্ষরের মৌলিক বিবরণ"],
      [Boolean(form.price && Number(form.price)>0),"সঠিক মূল্য"],
      [imgs.length>0,"কমপক্ষে একটি ছবি"],
      [Boolean(meta && meta.length>=70),"Meta description"],
      [Boolean(form.sku.trim()),"SKU"],
      [Boolean(form.usageInstructions.trim()),"ব্যবহারবিধি"],
    ] as const;
    return {checks,points:checks.filter(x=>x[0]).length,total:checks.length};
  },[form,imgs.length,meta]);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true); setMessage(""); setSaved(null);
    try{
      const res=await fetch("/api/admin/product-studio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        ...form, slug:form.slug||generatedSlug, price:form.price, stock:form.stock, commission:form.commission,
        cropSuitability:lines(form.cropSuitability), imageUrls:imgs, searchKeywords:lines(form.searchKeywords), hashtags:lines(form.hashtags),
      })});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||"পণ্য সংরক্ষণ করা যায়নি");
      setSaved(data.product); setMessage(data.message||"পণ্য সংরক্ষিত হয়েছে");
    }catch(err){setMessage(err instanceof Error?err.message:"পণ্য সংরক্ষণ করা যায়নি");}
    finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-7 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-sm font-bold text-emerald-100">← Admin overview</Link><p className="mt-2 text-xs font-bold uppercase tracking-[.18em] text-[#d9b85b]">AGRIVA · Product Intelligence</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">কৃষিপণ্য আপলোড স্টুডিও</h1><p className="mt-2 text-sm text-emerald-100">Product details, SEO, agriculture-specific specs, and publish-readiness in one workflow.</p></div><Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Existing catalogue ↗</Link></header>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-wider text-emerald-800">01 · Product identity</p><h2 className="mt-1 text-xl font-black">পণ্যের মূল তথ্য</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Product name / পণ্যের নাম *<input className={inputClass} required maxLength={160} value={form.name} onChange={e=>{set("name",e.target.value);if(!form.slug)set("slug",slugifyProductName(e.target.value));}} placeholder="যেমন: ব্রি ধান ২৮ প্রত্যয়িত বীজ ৫ কেজি"/></label>
            <label className={labelClass}>Brand / ব্র্যান্ড<input className={inputClass} maxLength={160} value={form.brandName} onChange={e=>set("brandName",e.target.value)} placeholder="প্রকৃত ব্র্যান্ডের নাম"/></label>
            <label className={labelClass}>SKU / Product code<input className={inputClass} value={form.sku} onChange={e=>set("sku",e.target.value)} placeholder="যেমন: SEED-BR28-5KG"/></label>
            <label className={labelClass}>Product type *<select required className={inputClass} value={form.categorySlug} onChange={e=>setForm(p=>({...p,categorySlug:e.target.value,subcategorySlug:""}))}><option value="">ক্যাটাগরি নির্বাচন করুন</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
            <label className={labelClass}>Subcategory<select className={inputClass} value={form.subcategorySlug} onChange={e=>set("subcategorySlug",e.target.value)}><option value="">সাব-ক্যাটাগরি (ঐচ্ছিক)</option>{category?.subcategories.map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}</select></label>
            <label className={labelClass}>Specific product / variety<input className={inputClass} value={form.productType} onChange={e=>set("productType",e.target.value)} placeholder="জাত, মডেল বা পণ্যের ধরন"/></label>
            <label className={labelClass}>Price (৳) *<input className={inputClass} type="number" min="0.01" step="0.01" required value={form.price} onChange={e=>set("price",e.target.value)}/></label>
            <label className={labelClass}>Available stock *<input className={inputClass} type="number" min="0" step="0.01" required value={form.stock} onChange={e=>set("stock",e.target.value)}/></label>
            <label className={labelClass}>Unit / package size<input className={inputClass} value={form.unitLabel} onChange={e=>set("unitLabel",e.target.value)} placeholder="যেমন: ১ কেজি, ৫০০ মি.লি., ১টি"/></label>
            <label className={labelClass}>Reseller commission (%)<input className={inputClass} type="number" min="0" max="100" step="0.01" value={form.commission} onChange={e=>set("commission",e.target.value)}/></label>
            <label className={labelClass}>Origin district<input className={inputClass} value={form.originDistrict} onChange={e=>set("originDistrict",e.target.value)} placeholder="উৎপত্তি/উৎপাদনের জেলা"/></label>
            <label className={labelClass}>Packaging details<input className={inputClass} value={form.packagingDetails} onChange={e=>set("packagingDetails",e.target.value)} placeholder="প্যাকেট, ওজন, সিলের তথ্য"/></label>
          </div><label className={labelClass+" mt-4"}>Description / বিস্তারিত পণ্যের বিবরণ *<textarea required minLength={30} maxLength={10000} rows={6} className={inputClass} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="প্রকৃত বৈশিষ্ট্য, মান, পরিমাণ, ব্যবহার, সীমাবদ্ধতা ও কৃষকের উপকারিতা লিখুন। যাচাই না করা দাবি লিখবেন না।"/></label></section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-wider text-emerald-800">02 · Agricultural information</p><h2 className="mt-1 text-xl font-black">কৃষি-নির্দিষ্ট তথ্য</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Crop suitability / কোন ফসলে উপযোগী<textarea rows={3} className={inputClass} value={form.cropSuitability} onChange={e=>set("cropSuitability",e.target.value)} placeholder="প্রতি লাইনে একটি ফসল"/></label>
            <label className={labelClass}>Composition / উপাদান<textarea rows={3} className={inputClass} value={form.composition} onChange={e=>set("composition",e.target.value)} placeholder="লেবেল/প্রস্তুতকারকের তথ্য অনুযায়ী"/></label>
            <label className={labelClass}>Usage instructions / ব্যবহারবিধি<textarea rows={4} className={inputClass} value={form.usageInstructions} onChange={e=>set("usageInstructions",e.target.value)} placeholder="লেবেলে অনুমোদিত মাত্রা, সময়, প্রয়োগ পদ্ধতি"/></label>
            <label className={labelClass}>Safety, registration & warnings<textarea rows={4} className={inputClass} value={form.safetyInformation} onChange={e=>set("safetyInformation",e.target.value)} placeholder="প্রযোজ্য নিবন্ধন নম্বর, সতর্কতা, PPE, সংরক্ষণ ও লেবেল নির্দেশনা"/></label>
          </div><p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">সার, বীজ ও crop-protection পণ্যের ক্ষেত্রে প্রস্তুতকারক/লেবেল অনুযায়ী তথ্য দিন। কীটনাশক বা রাসায়নিকের নিবন্ধন, মাত্রা কিংবা নিরাপত্তা-দাবি অনুমান করে পূরণ করবেন না।</p></section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-wider text-emerald-800">03 · Media & discoverability</p><h2 className="mt-1 text-xl font-black">ছবি ও SEO সেটআপ</h2><label className={labelClass+" mt-5"}>Product image URLs *<textarea required rows={3} className={inputClass} value={form.imageUrls} onChange={e=>set("imageUrls",e.target.value)} placeholder="প্রতি লাইনে একটি public HTTPS image URL; প্রথম URL হবে main image"/></label>{imgs.length>0&&<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{imgs.slice(0,4).map((src,i)=><div key={src+i} className="overflow-hidden rounded-xl border bg-slate-50"><img src={src} alt={form.name?form.name+" product image "+(i+1):"Product image preview"} className="h-28 w-full object-contain" loading="lazy"/><p className="truncate px-2 py-1 text-xs">{i===0?"Main image":`Image ${i+1}`}</p></div>)}</div>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className={labelClass}>SEO title<input className={inputClass} maxLength={70} value={form.seoTitle} onChange={e=>set("seoTitle",e.target.value)} placeholder="Primary keyword + product feature | AGRIVA"/><span className="mt-1 block text-xs font-normal text-slate-500">{seoTitle.length}/70 characters</span></label><label className={labelClass}>Meta description<textarea className={inputClass} rows={3} maxLength={180} value={form.metaDescription} onChange={e=>set("metaDescription",e.target.value)} placeholder="পণ্যের মূল সুবিধা, পরিমাণ ও কেনার তথ্য; বাস্তব তথ্যের ভিত্তিতে"/></label>
            <label className={labelClass}>Search keywords<textarea className={inputClass} rows={3} value={form.searchKeywords} onChange={e=>set("searchKeywords",e.target.value)} placeholder="প্রতি লাইনে একটি keyword বা বাংলা/ইংরেজি variant"/></label><label className={labelClass}>Hashtags<textarea className={inputClass} rows={3} value={form.hashtags} onChange={e=>set("hashtags",e.target.value)} placeholder="#কৃষিপণ্য, #ধানেরবীজ (সোশ্যাল প্রচারের জন্য; Google ranking factor নয়)"/></label>
            <label className={labelClass+" sm:col-span-2"}>URL slug<input className={inputClass} value={form.slug} onChange={e=>set("slug",e.target.value)} placeholder={generatedSlug}/><span className="mt-1 block text-xs font-normal text-slate-500">Stable URL: /marketplace/{form.slug||generatedSlug}. প্রকাশের পর slug বদলালে redirect/canonical সামলাতে হবে।</span></label>
          </div>
          </section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-wider text-emerald-800">04 · Workflow</p><h2 className="mt-1 text-xl font-black">Review ও সংরক্ষণ</h2><label className={labelClass+" mt-4"}>Save state<select className={inputClass} value={form.status} onChange={e=>set("status",e.target.value)}><option value="draft">Save as draft (recommended)</option><option value="active">Request activation after SEO checks</option></select></label><p className="mt-3 text-xs leading-5 text-slate-500">Active বাছলেও product সরাসরি publish হবে না—প্রয়োজনীয় SEO field অসম্পূর্ণ থাকলে draft থাকবে এবং সব ক্ষেত্রেই moderation pending থাকবে।</p>
            <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#173f29] px-5 py-4 font-black text-white disabled:opacity-50">{busy?"Saving product…":"Save product & run readiness checks"}</button>{message&&<p role="status" className="mt-4 rounded-xl border border-[#dce5d8] bg-[#f7faf5] p-4 text-sm font-semibold">{message}</p>}{saved&&<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><b>Saved:</b> {saved.slug} · {saved.status} · SEO {saved.seo_review_status}<p className="mt-2"><Link className="font-bold underline" href="/admin/products">Open product catalogue</Link>{saved.status==="active"&&<span> · </span>}{saved.status==="active"&&<Link className="font-bold underline" href={`/marketplace/${saved.slug}`}>Preview product</Link>}</p></div>}
          </section>
        </form>
        <aside className="space-y-4">
          <section className="sticky top-4 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-emerald-800">Live preview</p><h2 className="mt-2 text-lg font-black">SEO readiness</h2><div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black">{Math.round(score.points/score.total*100)}%</span><span className="pb-1 text-xs text-slate-500">{score.points}/{score.total} checks</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{width:`${score.points/score.total*100}%`}}/></div><ul className="mt-4 space-y-2">{score.checks.map(([ok,label])=><li key={label} className="flex gap-2 text-xs"><span className={ok?"text-emerald-700":"text-amber-700"}>{ok?"✓":"○"}</span><span>{label}</span></li>)}</ul><p className="mt-5 text-xs font-bold text-slate-500">Search preview</p><div className="mt-2 rounded-xl border p-3"><p className="truncate text-sm font-semibold text-blue-800">{seoTitle}</p><p className="mt-1 break-all text-[11px] text-emerald-800">agriva.com.bd/marketplace/{form.slug||generatedSlug}</p><p className="mt-1 text-xs leading-5 text-slate-600">{meta||"Meta description এখানে preview হবে।"}</p></div><p className="mt-4 text-xs leading-5 text-slate-500">এই score অভ্যন্তরীণ checklist—Google ranking বা indexing-এর নিশ্চয়তা নয়। Hashtags social discovery-এর জন্য, ranking-এর শর্টকাট নয়।</p></section>
          <section className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><h3 className="font-black">SEO best practice</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-slate-600"><li>একটি পণ্যের জন্য unique title, description ও slug।</li><li>নিজস্ব, পরিষ্কার ছবি; label/packaging-এর সত্যিকারের ছবি।</li><li>Price, stock ও availability সর্বত্র একই রাখা।</li><li>অতিরঞ্জিত medical/yield guarantee বা keyword stuffing নয়।</li><li>শুধু বাস্তব review/rating প্রকাশ করা।</li><li>Product structured data এবং sitemap production template-এ যাচাই করতে হবে।</li></ul></section>
        </aside>
      </div>
    </div>
  </main>;
}
