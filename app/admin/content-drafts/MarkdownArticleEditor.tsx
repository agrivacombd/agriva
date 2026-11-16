"use client";
import { useMemo, useRef, useState } from "react";
import {ArticleMarkdown} from "@/lib/content/article-markdown";
import {getEditorialChecks, normalizeEditorialMarkdown} from "@/lib/content/article-quality";
type Props={value:string;onChange:(value:string)=>void;primaryKeyword:string;title:string;slug?:string;metaTitle:string;metaDescription:string;disabled?:boolean};
type Tool="h2"|"h3"|"bold"|"italic"|"list"|"number"|"link"|"table"|"image"|"quote"|"faq"|"sources";
const tools:{key:Tool;label:string}[]=[{key:"h2",label:"H2"},{key:"h3",label:"H3"},{key:"bold",label:"Bold"},{key:"italic",label:"Italic"},{key:"list",label:"• List"},{key:"number",label:"1. List"},{key:"link",label:"Link"},{key:"table",label:"Table"},{key:"image",label:"Image"},{key:"quote",label:"Quote"},{key:"faq",label:"FAQ"},{key:"sources",label:"Sources"}];
export default function MarkdownArticleEditor({value,onChange,primaryKeyword,title,slug="",metaTitle,metaDescription,disabled=false}:Props){
  const field=useRef<HTMLTextAreaElement>(null);
  const [mode,setMode]=useState<"both"|"edit"|"preview">("both");
  const words=value.trim()?value.trim().split(/\s+/u).length:0;
  const checks=useMemo(()=>getEditorialChecks({title,metaTitle,metaDescription,keyword:primaryKeyword,body:value}),[title,metaTitle,metaDescription,primaryKeyword,value]);
  function format(which:Tool){
    if(disabled)return;
    const el=field.current,start=el?.selectionStart??value.length,end=el?.selectionEnd??value.length;
    const selectedText=value.slice(start,end).trim();
    let inserted="";
    if(which==="link"){
      const address=window.prompt("সম্পূর্ণ HTTPS অথবা AGRIVA internal URL দিন (যেমন /learn):","");
      if(!address)return;
      const trimmed=address.trim();
      if(!/^https:\/\/[^\s]+$/i.test(trimmed)&&!/^\/(?!\/)[^\s]+$/.test(trimmed)){
        window.alert("শুধু যাচাই করা HTTPS বা / দিয়ে শুরু হওয়া internal link ব্যবহার করুন।");return;
      }
      const label=selectedText||window.prompt("পাঠকের জন্য লিংকের অর্থবহ নাম দিন:","")?.trim();
      if(!label)return;
      inserted="["+label.replace(/[\[\]]/g,"")+"]("+trimmed+")";
    }else if(which==="image"){
      const imageSrc=window.prompt("ছবির HTTPS বা AGRIVA /storage/... URL দিন:","");
      if(!imageSrc)return;
      const src=imageSrc.trim();
      if(!/^https:\/\/[^\s()]+$/i.test(src)&&!/^\/(?!\/)[^\s()\\]+$/.test(src)){
        window.alert("ছবির জন্য HTTPS অথবা / দিয়ে শুরু হওয়া নিরাপদ URL প্রয়োজন।");return;
      }
      const alt=window.prompt("ছবিতে আসলে কী দেখা যাচ্ছে? ২ অক্ষরের বেশি বর্ণনামূলক Alt Text দিন:",selectedText||"");
      if(!alt||alt.trim().length<3||alt.includes("]")){window.alert("ছবির স্পষ্ট Alt Text দিন।");return;}
      inserted="\n\n!["+alt.trim()+"]("+src+")\n\n";
    }else if(which==="table"){
      const headersInput=window.prompt("টেবিলের কলাম নামগুলো | দিয়ে আলাদা করুন (২–৬টি):","");
      if(!headersInput)return;
      const columns=headersInput.split("|").map(x=>x.trim()).filter(Boolean);
      if(columns.length<2||columns.length>6||columns.some(x=>x.includes("\n"))){
        window.alert("সঠিকভাবে ২–৬টি কলামের নাম লিখুন।");return;
      }
      const valuesInput=window.prompt("প্রথম সারির তথ্য একই ক্রমে | দিয়ে আলাদা করুন:","");
      if(!valuesInput)return;
      const values=valuesInput.split("|").map(x=>x.trim());
      if(values.length!==columns.length||values.some(x=>!x||x.includes("\n"))){
        window.alert("প্রথম সারির তথ্য কলামের সংখ্যার সঙ্গে মিলতে হবে।");return;
      }
      inserted="\n\n| "+columns.join(" | ")+" |\n| "+columns.map(()=>"---").join(" | ")+" |\n| "+values.join(" | ")+" |\n\n";
    }else{
      const sample=selectedText||({
        h2:"বিভাগের বিষয়",h3:"উপবিভাগের বিষয়",bold:"গুরুত্বপূর্ণ তথ্য",
        italic:"বৈজ্ঞানিক নাম",list:"তালিকার বিষয়",number:"একটি ধাপ",
        link:"",table:"",image:"",quote:"",faq:"",sources:"",
      }[which]);
      inserted=which==="h2"?"\n\n## "+sample+"\n\n":
        which==="h3"?"\n\n### "+sample+"\n\n":
        which==="bold"?"**"+sample+"**":
        which==="italic"?"*"+sample+"*":
        which==="list"?"\n- "+sample:
        which==="number"?"\n1. "+sample:
        which==="quote"?"\n\n> "+sample+"\n\n":
        which==="faq"?"\n\n## সাধারণ প্রশ্ন (FAQ)\n\n":
        "\n\n## তথ্যসূত্র\n\n";
    }
    const next=(value.slice(0,start)+inserted+value.slice(end)).slice(0,50000);
    onChange(next);
    requestAnimationFrame(()=>{
      if(!el)return;
      const cursor=Math.min(start+inserted.length,next.length);
      el.focus();el.setSelectionRange(cursor,cursor);
    });
  }
  function cleanEscapes(){
    if(disabled||!value.includes("\\"))return;
    if(window.confirm("Markdown-এর অপ্রয়োজনীয় escape চিহ্ন সরাবেন? Preview যাচাই করুন।"))onChange(normalizeEditorialMarkdown(value));
  }
  return <section className="mt-6 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="font-extrabold">Article body (Markdown)</h3><p className="mt-1 text-xs text-slate-600">Heading, table, image, link, quote, FAQ, তথ্যসূত্র ও live preview</p></div>
      <p className="text-xs font-semibold text-slate-500">{words.toLocaleString("bn-BD")} শব্দ · {value.length}/50000 অক্ষর</p>
    </div>
    <section aria-label="Search result preview" className="mt-4 min-w-0 rounded-xl border border-sky-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Google-style SEO Snippet Preview</h4><span className="text-[11px] text-slate-500">Preview only · Ranking-এর নিশ্চয়তা নয়</span></div>
      <p className="mt-3 truncate text-xs text-emerald-800">agriva.com.bd › blog › {slug||"article-slug"}</p>
      <p className="mt-1 break-words text-lg font-semibold leading-6 text-blue-700">{metaTitle.trim()||title||"SEO title"}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{metaDescription.trim()||"Meta description লিখলে এখানে দেখা যাবে।"}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">SEO Title: {metaTitle.length}/65 · Description: {metaDescription.length}/180</p>
    </section>
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1.5 border-b bg-slate-50 p-2">{tools.map(x=><button key={x.key} type="button" disabled={disabled} title={x.label} onMouseDown={e=>e.preventDefault()} onClick={()=>format(x.key)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-emerald-950 disabled:opacity-50">{x.label}</button>)}<button type="button" disabled={disabled} onClick={cleanEscapes} className="min-h-9 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-bold text-amber-950 disabled:opacity-50">Fix pasted escapes</button></div>
      <p className="border-b bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">Table: কলাম ও প্রথম সারির তথ্য দিয়ে তৈরি করুন, পরে Markdown-এ আরও সারি যোগ করুন। Image: অনুমতিপ্রাপ্ত HTTPS ছবি ও অর্থবহ Alt Text দিন।</p>
      <div className="flex flex-wrap gap-2 border-b px-3 py-2" role="group" aria-label="Editor view">
        {(["both","edit","preview"] as const).map(x=><button key={x} type="button" aria-pressed={mode===x} onClick={()=>setMode(x)} className={"min-h-9 rounded-lg px-3 text-xs font-bold "+(mode===x?"bg-emerald-800 text-white":"bg-slate-100 text-emerald-900")}>{x==="both"?"Edit + Preview":x==="edit"?"Edit":"Preview"}</button>)}
      </div>
      <div className={mode==="both"?"grid min-w-0 lg:grid-cols-2":""}>
        {mode!=="preview"&&<div className="min-w-0 border-b lg:border-b-0 lg:border-r"><label htmlFor="content-markdown-body" className="block border-b px-4 py-2 text-xs font-bold text-slate-600">Markdown source</label><textarea ref={field} id="content-markdown-body" value={value} disabled={disabled} maxLength={50000} onChange={e=>onChange(e.target.value)} rows={17} className="block min-h-[400px] w-full resize-y border-0 p-4 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400 disabled:bg-slate-50" placeholder="## শিরোনাম দিয়ে লেখা সাজান…"/></div>}
        {mode!=="edit"&&<div className="min-w-0"><p className="border-b px-4 py-2 text-xs font-bold text-slate-600">Live Preview · Blog format</p><div className="min-h-[400px] max-h-[620px] overflow-auto p-4 sm:p-6">{value.trim()?<ArticleMarkdown body={value}/>:<p className="text-sm text-slate-500">Preview এখানে দেখা যাবে।</p>}</div></div>}
      </div>
    </div>
    <section className="mt-4 rounded-2xl border border-emerald-100 bg-[#f8faf7] p-4">
      <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-extrabold">SEO Content Checklist</h4><span className="text-xs font-bold text-emerald-800">{checks.filter(x=>x.passed).length}/{checks.length}</span></div>
      <p className="mt-1 text-xs text-slate-600">ড্রাফট প্রকাশের আগে গঠনগত যাচাই। তথ্যসূত্রের সত্যতা ও originality সম্পাদককে আলাদাভাবে নিশ্চিত করতে হবে।</p>
      <p role="status" aria-live="polite" className={"mt-2 text-xs font-bold "+(checks.every(x=>x.passed)?"text-emerald-800":"text-amber-800")}>{checks.every(x=>x.passed)?"কাঠামোগত SEO প্রস্তুতি সম্পন্ন। তথ্য ও উৎস যাচাই করে Review-তে পাঠান।":"অসম্পূর্ণ SEO অংশগুলো নিচে দেখানো হয়েছে; Save Draft করা যাবে, তবে Review/Publish আগে ঠিক করতে হবে।"}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{checks.map(x=><li key={x.label} className="flex items-start gap-2 text-xs leading-5"><span className={x.passed?"text-emerald-700":"text-amber-700"} aria-hidden="true">{x.passed?"✓":"!"}</span><span>{x.label}{!x.passed&&<span className="mt-1 block text-[11px] font-normal text-amber-800">{x.guidance}</span>}</span></li>)}</ul>
    </section>
  </section>;
}
