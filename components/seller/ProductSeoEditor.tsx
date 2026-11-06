"use client";

type SeoValues = {
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  related_keywords: string;
  brand: string;
  origin: string;
  highlights: string;
  usage_instructions: string;
  image_alt: string;
};
type Props = {
  value: SeoValues;
  onChange: (key: keyof SeoValues, value: string) => void;
  productName: string;
  description: string;
  previewPath: string;
};
const input = "mt-2 w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10";
export default function ProductSeoEditor({value,onChange,productName,description,previewPath}:Props) {
  const title = value.seo_title.trim() || productName.trim() || "আপনার পণ্যের নাম";
  const meta = value.seo_description.trim() || description.trim() || "পণ্যের উপকারিতা, বৈশিষ্ট্য ও বিস্তারিত তথ্য লিখুন।";
  const keywords = value.related_keywords.split(",").map(x=>x.trim()).filter(Boolean);
  const highlights = value.highlights.split("\n").map(x=>x.trim()).filter(Boolean);
  const titleLength = value.seo_title.length;
  const descriptionLength = value.seo_description.length;
  const checks = [
    {label:"SEO title ৩০–৬০ অক্ষর",ok:titleLength>=30&&titleLength<=60},
    {label:"Meta description ১২০–১৬০ অক্ষর",ok:descriptionLength>=120&&descriptionLength<=160},
    {label:"Focus keyword যোগ করা হয়েছে",ok:value.focus_keyword.trim().length>=2},
    {label:"কমপক্ষে ৩টি বৈশিষ্ট্য",ok:highlights.length>=3},
    {label:"ব্র্যান্ড বা উৎপত্তিস্থল উল্লেখ",ok:!!(value.brand.trim()||value.origin.trim())},
    {label:"ছবির Alt text",ok:value.image_alt.trim().length>=5},
  ];
  const score = checks.filter(x=>x.ok).length;
  return <section className="space-y-5 rounded-2xl border border-emerald-900/10 bg-[#f8fbf6] p-5 sm:p-6">
    <div><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-800">SEO product editor</p><h3 className="mt-1 text-xl font-black text-[#17351f]">পণ্যের বিস্তারিত ও Google preview</h3><p className="mt-2 text-sm leading-6 text-slate-600">বাস্তব ও যাচাইযোগ্য তথ্য লিখুন। SEO তথ্য search preview-তে সাহায্য করবে; ranking নিশ্চিত করে না।</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold">SEO title <span className="font-normal text-slate-500">({titleLength}/60)</span><input maxLength={70} value={value.seo_title} onChange={e=>onChange("seo_title",e.target.value)} className={input} placeholder="পণ্যের নাম + প্রধান বৈশিষ্ট্য + AGRIVA"/></label>
      <label className="block text-sm font-bold">Focus keyword<input maxLength={100} value={value.focus_keyword} onChange={e=>onChange("focus_keyword",e.target.value)} className={input} placeholder="যেমন: Thai guava plant"/></label>
      <label className="block text-sm font-bold sm:col-span-2">Meta description <span className="font-normal text-slate-500">({descriptionLength}/160)</span><textarea rows={3} maxLength={200} value={value.seo_description} onChange={e=>onChange("seo_description",e.target.value)} className={input} placeholder="১২০–১৬০ অক্ষরে পণ্যের সত্যিকারের উপকারিতা, ধরন ও ব্যবহার লিখুন।"/></label>
      <label className="block text-sm font-bold sm:col-span-2">Related keywords <span className="font-normal text-slate-500">(কমা দিয়ে আলাদা করুন)</span><input maxLength={500} value={value.related_keywords} onChange={e=>onChange("related_keywords",e.target.value)} className={input} placeholder="guava sapling, fruit plant, grafted plant"/></label>
      <label className="block text-sm font-bold">ব্র্যান্ড / উৎপাদক<input maxLength={120} value={value.brand} onChange={e=>onChange("brand",e.target.value)} className={input} placeholder="প্রযোজ্য হলে লিখুন"/></label>
      <label className="block text-sm font-bold">উৎপত্তিস্থল<input maxLength={120} value={value.origin} onChange={e=>onChange("origin",e.target.value)} className={input} placeholder="যেমন: রাজশাহী, বাংলাদেশ"/></label>
      <label className="block text-sm font-bold sm:col-span-2">পণ্যের বৈশিষ্ট্য <span className="font-normal text-slate-500">(প্রতি লাইনে একটি, ৫টি পর্যন্ত)</span><textarea rows={4} maxLength={1000} value={value.highlights} onChange={e=>onChange("highlights",e.target.value)} className={input} placeholder={"উন্নত মানের বীজ/চারা\nউপযুক্ত মাটি ও আবহাওয়া\nপ্যাকেজিং ও পরিমাণ"}/></label>
      <label className="block text-sm font-bold sm:col-span-2">ব্যবহার / যত্ন / প্রয়োগ নির্দেশনা<textarea rows={4} maxLength={2000} value={value.usage_instructions} onChange={e=>onChange("usage_instructions",e.target.value)} className={input} placeholder="ব্যবহারবিধি, রোপণ, সংরক্ষণ বা যত্নের নির্দেশনা দিন।"/></label>
      <label className="block text-sm font-bold sm:col-span-2">প্রধান ছবির Alt text<input maxLength={180} value={value.image_alt} onChange={e=>onChange("image_alt",e.target.value)} className={input} placeholder="ছবিতে কী দেখা যাচ্ছে তা সংক্ষেপে লিখুন"/></label>
    </div>
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="rounded-xl border bg-white p-4">
        <p className="text-xs font-bold text-slate-500">GOOGLE SEARCH PREVIEW · আনুমানিক</p>
        <p className="mt-2 truncate text-lg font-semibold text-[#1a0dab]">{title}</p>
        <p className="mt-1 truncate text-xs text-emerald-800">agriva.com.bd{previewPath}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{meta.slice(0,160)}</p>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between"><p className="text-sm font-bold">SEO completeness</p><p className="text-sm font-black text-emerald-800">{score}/{checks.length}</p></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{width:(score/checks.length*100)+"%"}}/></div>
        <ul className="mt-3 space-y-2">{checks.map(item=><li key={item.label} className="flex gap-2 text-xs"><span className={item.ok?"text-emerald-700":"text-slate-400"}>{item.ok?"✓":"○"}</span><span className={item.ok?"text-emerald-900":"text-slate-600"}>{item.label}</span></li>)}</ul>
        <p className="mt-3 text-xs leading-5 text-slate-500">{keywords.length}টি related keyword · {highlights.length}টি বৈশিষ্ট্য</p>
      </div>
    </div>
  </section>;
}
