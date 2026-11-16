"use client";
import { useMemo, useRef, useState } from "react";
import {ArticleMarkdown,parseArticleMarkdown} from "@/lib/content/article-markdown";
type Props={value:string;onChange:(value:string)=>void;primaryKeyword:string;title:string;metaTitle:string;metaDescription:string;disabled?:boolean};
type Tool="h2"|"h3"|"bold"|"italic"|"list"|"number"|"link"|"faq"|"sources";
const tools:{key:Tool;label:string}[]=[{key:"h2",label:"H2"},{key:"h3",label:"H3"},{key:"bold",label:"Bold"},{key:"italic",label:"Italic"},{key:"list",label:"• List"},{key:"number",label:"1. List"},{key:"link",label:"Link"},{key:"faq",label:"FAQ"},{key:"sources",label:"Sources"}];
export default function MarkdownArticleEditor({value,onChange,primaryKeyword,title,metaTitle,metaDescription,disabled=false}:Props){
  const field=useRef<HTMLTextAreaElement>(null);
  const [mode,setMode]=useState<"both"|"edit"|"preview">("both");
  const blocks=useMemo(()=>parseArticleMarkdown(value),[value]);
  const words=value.trim()?value.trim().split(/\s+/u).length:0;
  const keyword=primaryKeyword.trim().toLocaleLowerCase();
  const checks=[
    {label:"কমপক্ষে ৩টি H2 section",ok:blocks.filter(x=>x.kind==="h2").length>=3},
    {label:"প্রথম অনুচ্ছেদে Focus keyword",ok:!keyword||(blocks.find(x=>x.kind==="p")?.lines[0]||"").toLocaleLowerCase().includes(keyword)},
    {label:"পূর্ণাঙ্গ লেখা (৩৫০+ শব্দ)",ok:words>=350},
    {label:"AGRIVA internal link",ok:/\]\((\/(?:blog|plant-market|marketplace|learn|tools)|https:\/\/(?:www\.)?agriva\.com\.bd\/)/i.test(value)},
    {label:"FAQ section",ok:blocks.some(x=>x.kind==="h2"&&/FAQ|প্রশ্ন|জিজ্ঞাসা/i.test(x.lines[0]))},
    {label:"তথ্যসূত্র section",ok:blocks.some(x=>x.kind==="h2"&&/তথ্যসূত্র|সূত্র|sources|references/i.test(x.lines[0]))},
    {label:"Meta title ২৫–৬৫ অক্ষর",ok:metaTitle.trim().length>=25&&metaTitle.trim().length<=65},
    {label:"Meta description ১০০–১৮০ অক্ষর",ok:metaDescription.trim().length>=100&&metaDescription.trim().length<=180},
    {label:"Article title",ok:!!title.trim()&&title.trim().length<=160}
  ];
  function format(which:Tool){
    if(disabled)return;
    const el=field.current,start=el?.selectionStart??value.length,end=el?.selectionEnd??value.length;
    const sample=value.slice(start,end)||({h2:"নতুন শিরোনাম",h3:"উপশিরোনাম",bold:"গুরুত্বপূর্ণ লেখা",italic:"বৈজ্ঞানিক নাম",list:"তালিকার বিষয়",number:"একটি ধাপ",link:"লিংকের নাম",faq:"",sources:""}[which]);
    const inserted=which==="h2"?"\n\n## "+sample+"\n\n":which==="h3"?"\n\n### "+sample+"\n\n":which==="bold"?"**"+sample+"**":which==="italic"?"*"+sample+"*":which==="list"?"\n- "+sample:which==="number"?"\n1. "+sample:which==="link"?"["+sample+"](https://example.com)":which==="faq"?"\n\n## সাধারণ প্রশ্ন (FAQ)\n\n### প্রশ্ন লিখুন\n\nযাচাই করা উত্তর লিখুন।\n":"\n\n## তথ্যসূত্র\n\n- [সূত্রের নাম](https://example.com)\n";
    const next=(value.slice(0,start)+inserted+value.slice(end)).slice(0,50000);
    onChange(next);requestAnimationFrame(()=>{if(el){const cursor=Math.min(start+inserted.length,next.length);el.focus();el.setSelectionRange(cursor,cursor);}});
  }
  function cleanEscapes(){
    if(disabled||!value.includes("\\"))return;
    if(window.confirm("Markdown-এর অপ্রয়োজনীয় escape চিহ্ন সরাবেন? Preview যাচাই করুন।"))onChange(value.replace(/\\([#*\[\]().-])/g,"$1"));
  }
  return <section className="mt-6 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="font-extrabold">Article body (Markdown)</h3><p className="mt-1 text-xs text-slate-600">Heading, bold, list, link, FAQ, তথ্যসূত্র ও live preview</p></div>
      <p className="text-xs font-semibold text-slate-500">{words.toLocaleString("bn-BD")} শব্দ · {value.length}/50000 অক্ষর</p>
    </div>
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1.5 border-b bg-slate-50 p-2">{tools.map(x=><button key={x.key} type="button" disabled={disabled} title={x.label} onMouseDown={e=>e.preventDefault()} onClick={()=>format(x.key)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-emerald-950 disabled:opacity-50">{x.label}</button>)}<button type="button" disabled={disabled} onClick={cleanEscapes} className="min-h-9 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-bold text-amber-950 disabled:opacity-50">Fix pasted escapes</button></div>
      <div className="flex flex-wrap gap-2 border-b px-3 py-2" role="group" aria-label="Editor view">
        {(["both","edit","preview"] as const).map(x=><button key={x} type="button" aria-pressed={mode===x} onClick={()=>setMode(x)} className={"min-h-9 rounded-lg px-3 text-xs font-bold "+(mode===x?"bg-emerald-800 text-white":"bg-slate-100 text-emerald-900")}>{x==="both"?"Edit + Preview":x==="edit"?"Edit":"Preview"}</button>)}
      </div>
      <div className={mode==="both"?"grid min-w-0 lg:grid-cols-2":""}>
        {mode!=="preview"&&<div className="min-w-0 border-b lg:border-b-0 lg:border-r"><label htmlFor="content-markdown-body" className="block border-b px-4 py-2 text-xs font-bold text-slate-600">Markdown source</label><textarea ref={field} id="content-markdown-body" value={value} disabled={disabled} maxLength={50000} onChange={e=>onChange(e.target.value)} rows={17} className="block min-h-[400px] w-full resize-y border-0 p-4 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400 disabled:bg-slate-50" placeholder="## শিরোনাম দিয়ে লেখা সাজান…"/></div>}
        {mode!=="edit"&&<div className="min-w-0"><p className="border-b px-4 py-2 text-xs font-bold text-slate-600">Live Preview · Blog format</p><div className="min-h-[400px] max-h-[620px] overflow-auto p-4 sm:p-6">{value.trim()?<ArticleMarkdown body={value}/>:<p className="text-sm text-slate-500">Preview এখানে দেখা যাবে।</p>}</div></div>}
      </div>
    </div>
    <section className="mt-4 rounded-2xl border border-emerald-100 bg-[#f8faf7] p-4">
      <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-extrabold">SEO Content Checklist</h4><span className="text-xs font-bold text-emerald-800">{checks.filter(x=>x.ok).length}/{checks.length}</span></div>
      <p className="mt-1 text-xs text-slate-600">এটি লেখা সাজানোর নির্দেশক; তথ্যের সত্যতা বা SEO ranking-এর নিশ্চয়তা নয়।</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{checks.map(x=><li key={x.label} className="flex items-start gap-2 text-xs leading-5"><span className={x.ok?"text-emerald-700":"text-amber-700"} aria-hidden="true">{x.ok?"✓":"!"}</span>{x.label}</li>)}</ul>
    </section>
  </section>;
}
