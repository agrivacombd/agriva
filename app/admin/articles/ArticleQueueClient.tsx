"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {Search,CheckCircle2,AlertCircle} from "lucide-react";

export type ArticleQueueEntry={
  id:string;title:string;keyword:string;status:string;slug:string;
  created_at:string;updated_at:string;meta_title:string;meta_description:string;
};
const statusLabels:Record<string,string>={
  draft:"Draft",review:"Review pending",approved:"Approved · Not published",
  published:"Published",rejected:"Needs revision",
};
const statusHints:Record<string,string>={
  draft:"সম্পাদনা সম্পন্ন হলে Review-তে পাঠান।",
  review:"তথ্য ও উৎস যাচাই করে Approve করুন।",
  approved:"অনুমোদিত; আলাদা Publish না করলে Blog-এ দেখা যাবে না।",
  published:"প্রকাশিত Blog পেজ ও metadata পরীক্ষা করুন।",
  rejected:"সংশোধন করে নতুন করে Review-তে পাঠান।",
};
const statuses=["all","draft","review","approved","published","rejected"] as const;
const normalize=(s:string)=>s.toLocaleLowerCase().normalize("NFKC").trim();
const validMeta=(entry:ArticleQueueEntry)=>
  entry.meta_title.trim().length>=25&&entry.meta_title.trim().length<=65&&
  entry.meta_description.trim().length>=100&&entry.meta_description.trim().length<=180;

export default function ArticleQueueClient({items}:{items:ArticleQueueEntry[]}){
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState<string>("all");
  const [onlyIssues,setOnlyIssues]=useState(false);
  const counts=useMemo(()=>Object.fromEntries(statuses.map(key=>[
    key,key==="all"?items.length:items.filter(item=>item.status===key).length,
  ])),[items]);
  const pending=items.find(item=>item.status==="review")||items.find(item=>item.status==="draft");
  const filtered=useMemo(()=>{
    const needle=normalize(query);
    return items.filter(item=>(status==="all"||item.status===status)&&
      (!onlyIssues||!validMeta(item))&&
      (!needle||[item.title,item.keyword,item.slug,item.meta_title].some(s=>normalize(s).includes(needle))));
  },[items,query,status,onlyIssues]);
  return <div className="mt-6">
    <section aria-label="Editorial status overview" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {key:"all",label:"মোট নিবন্ধ"},
        {key:"draft",label:"Draft"},
        {key:"review",label:"Review প্রয়োজন"},
        {key:"approved",label:"Approved"},
      ].map(item=><button type="button" key={item.key} onClick={()=>{setStatus(item.key);setOnlyIssues(false)}}
        aria-pressed={status===item.key} className={"min-w-0 rounded-2xl border p-4 text-left shadow-sm transition hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 "+
          (status===item.key?"border-emerald-500 bg-emerald-50":"border-emerald-100 bg-white")}>
        <span className="block text-xs font-semibold text-slate-600">{item.label}</span>
        <span className="mt-2 block text-2xl font-black tabular-nums text-emerald-950">{counts[item.key]||0}</span>
        <span className="mt-1 block text-[11px] font-bold text-emerald-700">দেখুন ↗</span>
      </button>)}
    </section>
    {pending&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4">
      <p className="min-w-0 flex-1 text-xs leading-6 text-emerald-950"><strong>{pending.status==="review"?"Review অপেক্ষায়":"সাম্প্রতিক Draft"}: </strong>{pending.title}</p>
      <Link href={"/admin/content-drafts?draft="+encodeURIComponent(pending.id)}
        className="inline-flex min-h-10 items-center rounded-xl border border-emerald-200 px-4 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50">Open Editor ↗</Link>
    </div>}
    <section aria-label="Article filters" className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-black">নিবন্ধ খুঁজুন</h2><span className="text-xs text-slate-500">{filtered.length}/{items.length}টি</span></div>
      <label className="relative mt-3 block">
        <span className="sr-only">Title, keyword বা slug দিয়ে খুঁজুন</span>
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 text-slate-500"/>
        <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, keyword বা slug লিখুন..."
          className="min-h-11 w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-700"/>
      </label>
      <div role="group" aria-label="Article status filter" className="mt-3 flex flex-wrap gap-2">
        {statuses.map(key=><button type="button" key={key} aria-pressed={status===key} onClick={()=>setStatus(key)}
          className={"min-h-10 rounded-full border px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 "+
            (status===key?"border-emerald-800 bg-emerald-800 text-white":"border-slate-200 bg-white text-slate-700 hover:border-emerald-500")}>
          {key==="all"?"সব":statusLabels[key]||key} ({counts[key]||0})
        </button>)}
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-600">
        <input type="checkbox" checked={onlyIssues} onChange={e=>setOnlyIssues(e.target.checked)} className="size-4 accent-emerald-800"/>
        শুধু SEO meta অসম্পূর্ণ ({items.filter(item=>!validMeta(item)).length})
      </label>
      <p className="mt-3 text-xs text-slate-500">সাম্প্রতিক সম্পাদিত নিবন্ধ আগে। সর্বশেষ ১৫০টি নিবন্ধের তালিকা; পূর্ণ যাচাই Editor-এ।</p>
    </section>
    <section aria-label="Article review queue" className="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-4 py-4 text-lg font-black sm:px-6">Articles ({filtered.length})</h2>
      {filtered.map(item=><article key={item.id} className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-4 last:border-0 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">SEO ARTICLE</span>
            <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold "+
              (item.status==="approved"?"bg-sky-50 text-sky-900":item.status==="review"?"bg-amber-50 text-amber-900":"bg-slate-100 text-slate-700")}>
              {statusLabels[item.status]||item.status}
            </span>
            <span className={"inline-flex items-center gap-1 text-[11px] font-bold "+(validMeta(item)?"text-emerald-800":"text-amber-800")}>
              {validMeta(item)?<CheckCircle2 size={13}/>:<AlertCircle size={13}/>}
              {validMeta(item)?"SEO meta পূর্ণ":"SEO meta যাচাই"}
            </span>
          </div>
          <h3 className="mt-2 break-words text-base font-black leading-7">
            <Link href={"/admin/content-drafts?draft="+encodeURIComponent(item.id)} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{item.title}</Link>
          </h3>
          <p className="mt-1 break-words text-xs text-slate-600">Keyword: <strong>{item.keyword||"—"}</strong></p>
          <p className="mt-1 break-all text-[11px] text-slate-500">/blog/{item.slug}</p>
          <p className="mt-2 text-xs leading-6 text-slate-600">{statusHints[item.status]||"Editor-এ status যাচাই করুন।"}</p>
          <p className="mt-1 text-[11px] text-slate-500">সর্বশেষ সম্পাদনা: {Number.isFinite(Date.parse(item.updated_at))?
            new Date(item.updated_at).toLocaleString("bn-BD",{timeZone:"Asia/Dhaka",dateStyle:"medium",timeStyle:"short"}):"—"}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {item.status==="published"&&item.slug&&<Link href={"/blog/"+encodeURIComponent(item.slug)} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-xl border border-emerald-200 px-4 text-xs font-bold text-emerald-900 hover:bg-emerald-50">Live</Link>}
          <Link href={"/admin/content-drafts?draft="+encodeURIComponent(item.id)}
            className="inline-flex min-h-10 items-center rounded-xl bg-emerald-900 px-4 text-xs font-bold text-white hover:bg-emerald-800">Open SEO Editor</Link>
        </div>
      </article>)}
      {!filtered.length&&<div className="p-6 text-center text-sm text-slate-600">
        <p>{items.length?"এই Search বা Filter-এ কোনো নিবন্ধ নেই।":"এখনো কোনো SEO নিবন্ধ নেই।"}</p>
        <button type="button" onClick={()=>{setQuery("");setStatus("all");setOnlyIssues(false);}}
          className="mt-3 min-h-10 rounded-lg border border-emerald-200 px-4 text-xs font-bold text-emerald-900">সব দেখান</button>
      </div>}
    </section>
    <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">
      SEO metadata পূর্ণ মানেই তথ্য যাচাই সম্পূর্ণ নয়। Publish করতে পৃথক অনুমোদিত workflow ও সম্পাদকীয় যাচাই প্রয়োজন।
    </p>
  </div>;
}
