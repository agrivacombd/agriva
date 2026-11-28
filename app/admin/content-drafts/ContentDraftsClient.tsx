"use client";
import { AdminPage as AdminPageLayout } from "@/components/admin/ui/AdminPrimitives";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {createBrowserClient} from "@supabase/ssr";
import MarkdownArticleEditor from "./MarkdownArticleEditor";
import ContentRemovalActions from "./ContentRemovalActions";
import EditorialImageUpload from "./EditorialImageUpload";
import {getEditorialChecks} from "@/lib/content/article-quality";

type Revision={id:string;changed_at:string;changed_by:string|null;status_before:string;status_after:string;snapshot:Record<string,unknown>};
type Draft={id:string;opportunity_id:string;content_type:string;title:string;slug:string;meta_title:string|null;meta_description:string|null;primary_keyword:string;secondary_keywords:string[];search_intent:string;outline:unknown[];faq:unknown[];internal_link_suggestions:unknown[];competitor_analysis:unknown[];body_markdown:string|null;status:string;reviewed_at:string|null;created_at:string;deleted_at:string|null;deleted_from_status:string|null;hero_image_url:string|null;hero_image_alt:string|null};
type Action="save"|"review"|"approved"|"rejected"|"published"|"draft";
const statuses=["all","draft","review","approved","published","rejected","trash"] as const;
function client(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key?createBrowserClient(url,key):null;
}
export default function ContentDraftsClient(){
  const [drafts,setDrafts]=useState<Draft[]>([]);
  const [selected,setSelected]=useState<Draft|null>(null);
  const [revisions,setRevisions]=useState<Revision[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(""),[notice,setNotice]=useState("");
  const [search,setSearch]=useState(""),[filter,setFilter]=useState("all"),[typeFilter,setTypeFilter]=useState("all");
  const [opportunity,setOpportunity]=useState("");
  const didReadParams=useRef(false);
  async function load(){
    const s=client();
    if(!s){setError("Supabase environment variables are missing.");setLoading(false);return;}
    const {data,error:queryError}=await s.from("content_drafts").select("*").order("created_at",{ascending:false}).limit(300);
    if(queryError)setError(queryError.message);
    else{
      const rows=(data||[]) as Draft[];
      setDrafts(rows);
      if(!didReadParams.current){
        didReadParams.current=true;
        const params=new URLSearchParams(window.location.search),id=params.get("draft"),opportunityId=params.get("opportunity");
        if(opportunityId)setOpportunity(opportunityId);
        if(id){
          const found=rows.find(row=>row.id===id);
          if(found)setSelected(found);else setError("Linked draft not found or not accessible.");
        }
      }
    }
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);
  const selectedId = selected?.id;
  useEffect(()=>{
    let stopped=false;
    async function history(){
      if(!selectedId){setRevisions([]);return;}
      const s=client();
      if(!s)return;
      const {data,error:historyError}=await s.from("content_draft_revisions")
        .select("id,changed_at,changed_by,status_before,status_after,snapshot")
        .eq("draft_id",selectedId).order("changed_at",{ascending:false}).limit(30);
      if(stopped)return;
      if(historyError){setError(historyError.message);setRevisions([]);}else setRevisions((data||[]) as Revision[]);
    }
    void history();return()=>{stopped=true;};
  },[selectedId]);

  const shown=useMemo(()=>drafts.filter(d=>
    (filter==="trash"?Boolean(d.deleted_at):!d.deleted_at&&(filter==="all"||d.status===filter))&&(typeFilter==="all"||d.content_type===typeFilter)&&
    (!search.trim()||[d.title,d.primary_keyword,d.slug,d.search_intent].some(v=>v.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())))
  ),[drafts,filter,typeFilter,search]);
  const counts=useMemo(()=>Object.fromEntries(statuses.map(s=>[s,s==="all"?drafts.filter(d=>!d.deleted_at).length:drafts.filter(d=>s==="trash"?Boolean(d.deleted_at):!d.deleted_at&&d.status===s).length])),[drafts]);

  async function createDraft(){
    setError("");setNotice("");
    if(!/^[0-9a-f-]{36}$/i.test(opportunity.trim())){setError("একটি সঠিক Opportunity UUID দিন।");return;}
    setBusy(true);
    try{
      const response=await fetch("/api/admin/content-drafts/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({opportunityId:opportunity.trim()})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok){setError(payload.error||"Complete draft generation failed.");return;}
      setNotice("পূর্ণাঙ্গ SEO Draft তৈরি হয়েছে। তথ্য ও সূত্র যাচাই করে Review-তে পাঠান।");
      setOpportunity("");setFilter("all");setTypeFilter("all");setSearch("");
      await load();
      if(payload.draft?.id)setSelected(payload.draft as Draft);
    }catch{setError("Draft generation network request failed. কোনো অসম্পূর্ণ draft সেভ হয়নি।");}
    finally{setBusy(false);}
  }

  async function transition(action:Action){
    if(!selected||busy)return;
    if(selected.deleted_at){setError("Trash-এর পোস্ট আগে Restore করুন।");return;}
    const title=selected.title.trim(),slug=selected.slug.trim(),body=selected.body_markdown?.trim()||"";
    if(!title||title.length>160||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>180){setError("Valid title ও lowercase hyphenated slug প্রয়োজন।");return;}
    if(selected.content_type==="article"&&["review","approved","published"].includes(action)){
      const problems=getEditorialChecks({title,metaTitle:selected.meta_title,metaDescription:selected.meta_description,keyword:selected.primary_keyword,body}).filter(c=>!c.passed);
      if(problems.length){setError("SEO সম্পূর্ণ নয়: "+problems.map(x=>x.label).join(" · "));return;}
    }
    if(action==="published"){
      if(selected.content_type!=="article"){setError("Product/Tool SEO brief সরাসরি Blog article হিসেবে প্রকাশ করা যায় না।");return;}
      if(!window.confirm("আপনি কি যাচাই করা Approved article এখন AGRIVA Blog-এ প্রকাশ করতে চান?"))return;
    }
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/admin/content-drafts/workflow",{method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:selected.id,action,title,slug,body_markdown:body,meta_title:selected.meta_title,meta_description:selected.meta_description})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||"Workflow update failed.");
      const noticeText:Record<Action,string>={
        save:"Draft saved. Edited Approved items must pass review again.",
        review:"Article পাঠানো হয়েছে Review stage-এ।",
        approved:"Approved! এখন এটি Article Queue ও SEO Dashboard-এ পাবেন। Publish করতে আলাদা অনুমোদিত action প্রয়োজন।",
        rejected:"Article rejected; সংশোধন করে আবার Draft থেকে শুরু করুন।",
        published:"Article প্রকাশিত হয়েছে। এখন AGRIVA Blog-এ দেখা যাবে।",
        draft:"Draft-এ ফেরত নেওয়া হয়েছে।",
      };
      setNotice(noticeText[action]);
      if(action==="save"){
        const nextStatus=selected.status==="approved"?"review":
          selected.status==="review"||selected.status==="rejected"?"draft":selected.status;
        setSelected(prev=>prev?{...prev,status:nextStatus}:prev);
      }else if(action==="review"&&selected.status==="published"){
        setSelected(prev=>prev?{...prev,status:"review",reviewed_at:null}:prev);
        setNotice("Article এখন Review অবস্থায়; শিরোনাম, লেখা ও ছবি সম্পাদনা করে Save Draft করুন। এরপর আবার Approve এবং Publish করুন।");
      }else setSelected(null);
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not update draft.");}
    finally{setBusy(false);}
  }

  return <AdminPageLayout className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wide text-[#a77d2f]">AGRIVA Editorial</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">SEO Content Drafts</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Create → Edit → Review → Approve → Publish. Only approved Articles become visible in the Blog after publication.</p></div>
      <nav className="flex flex-wrap gap-2" aria-label="Editorial tools">
        <Link href="/admin/seo" className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900">SEO Dashboard</Link>
        <Link href="/admin/articles" className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900">Article Queue</Link>
        <Link href="/admin/content-studio" className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900">Content Studio</Link>
      </nav>
    </div>
    {error&&<p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<div role="status" className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"><span>{notice}</span><Link href="/admin/articles" className="font-extrabold underline">View Article Queue</Link></div>}
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-black">Create from Search Opportunity</h2><p className="mt-1 text-xs text-slate-600">Opportunity ID <Link href="/admin/opportunities" className="font-semibold text-emerald-800 underline">Opportunities page</Link> থেকে নিতে পারবেন।</p>
      <form onSubmit={e=>{e.preventDefault();void createDraft();}} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={opportunity} onChange={e=>setOpportunity(e.target.value)} aria-label="Opportunity UUID" placeholder="Opportunity UUID" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm" required/>
        <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-[#17351f] px-5 text-sm font-bold text-white disabled:opacity-50">Generate Draft</button>
      </form>
    </section>
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5" aria-label="Draft filters">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <input type="search" aria-label="Search drafts" placeholder="Title, keyword বা slug দিয়ে খুঁজুন…" value={search} onChange={e=>setSearch(e.target.value)} className="min-h-11 min-w-0 rounded-xl border border-slate-200 px-4 text-sm"/>
        <select value={typeFilter} aria-label="Filter content type" onChange={e=>setTypeFilter(e.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">All content types</option><option value="article">Article</option><option value="product">Product brief</option><option value="tool">Tool</option></select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{statuses.map(s=><button key={s} type="button" aria-pressed={filter===s} onClick={()=>setFilter(s)} className={"min-h-9 rounded-full border px-3 py-1.5 text-xs font-bold capitalize "+(filter===s?"border-emerald-800 bg-emerald-800 text-white":"border-slate-200 bg-white text-slate-700")}>{s} ({counts[s]||0})</button>)}</div>
      <p className="mt-3 text-xs text-slate-500">{shown.length}টি latest record দেখা যাচ্ছে (সর্বোচ্চ ৩০০টি লোড করা হয়েছে)।</p>
    </section>
    {loading?<p className="mt-6 text-sm text-slate-600">Drafts loading…</p>:<section className="mt-5 grid gap-3 md:grid-cols-2">
      {shown.map(d=><button type="button" key={d.id} onClick={()=>{setError("");setSelected(d);}} className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-sm hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:p-5">
        <div className="flex flex-wrap justify-between gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-800">{d.content_type}</span><span className="text-xs font-extrabold capitalize text-slate-700">{d.deleted_at?"Trash":d.status}</span></div>
        <h2 className="mt-3 break-words text-lg font-black leading-snug">{d.title}</h2>
        <p className="mt-2 text-xs leading-5 text-slate-600">Keyword: {d.primary_keyword} · Intent: {d.search_intent}</p>
        <p className="mt-1 break-all text-[11px] text-slate-500">/{d.slug}</p>
      </button>)}
      {!shown.length&&<div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">এই filter-এ কোনো Draft পাওয়া যায়নি।</div>}
    </section>}
    {selected&&<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 px-2 py-4 sm:px-6 sm:py-6" role="dialog" aria-modal="true" aria-label="SEO draft editor">
      <div className="mx-auto max-w-6xl min-w-0 rounded-2xl bg-white p-4 shadow-2xl sm:p-7">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-[#a77d2f]">Editorial Review · {selected.content_type} · {selected.status}</p><h2 className="mt-2 break-words text-xl font-black leading-snug sm:text-2xl">{selected.title}</h2></div>
          <button type="button" onClick={()=>setSelected(null)} aria-label="Close draft editor" className="min-h-10 rounded-xl border border-slate-200 px-4 font-black">Close ×</button>
        </div>
        {selected.deleted_at&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">Trash-এ থাকা পোস্ট পরিবর্তন করা যাবে না। Restore করলে Draft হিসেবে আবার Edit করা যাবে।</p>}
        {selected.status==="published"&&!selected.deleted_at&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-extrabold">এই Article এখন Published, তাই Edit locked আছে।</p><p className="mt-1">ছবি বা লেখা পরিবর্তন করতে Unpublish & Edit চাপুন। এতে নিবন্ধ সাময়িকভাবে public Blog থেকে সরবে; আবার Review → Approve → Publish করতে হবে।</p><button type="button" disabled={busy} onClick={()=>void transition("review")} className="mt-3 min-h-11 rounded-xl bg-amber-800 px-4 font-bold text-white disabled:opacity-50">Unpublish & Edit</button></div>}
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <label className="text-sm font-bold">Article title<input value={selected.title} disabled={selected.status==="published"||Boolean(selected.deleted_at)} maxLength={160} onChange={e=>setSelected({...selected,title:e.target.value})} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal disabled:bg-slate-50"/></label>
          <label className="text-sm font-bold">URL slug<input value={selected.slug} disabled={selected.status==="published"||Boolean(selected.deleted_at)} maxLength={180} onChange={e=>setSelected({...selected,slug:e.target.value})} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal disabled:bg-slate-50"/></label>
          <label className="text-sm font-bold">Meta title<input value={selected.meta_title||""} disabled={selected.status==="published"||Boolean(selected.deleted_at)} maxLength={160} onChange={e=>setSelected({...selected,meta_title:e.target.value})} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal disabled:bg-slate-50"/></label>
          <label className="text-sm font-bold">Meta description<textarea value={selected.meta_description||""} disabled={selected.status==="published"||Boolean(selected.deleted_at)} maxLength={320} onChange={e=>setSelected({...selected,meta_description:e.target.value})} rows={2} className="mt-1 block w-full rounded-xl border border-slate-200 p-3 font-normal disabled:bg-slate-50"/></label>
          <Info label="Primary keyword" value={selected.primary_keyword}/><Info label="Search intent" value={selected.search_intent}/>
        </div>
        {selected.content_type==="article"&&<EditorialImageUpload key={selected.id} articleId={selected.id} status={selected.deleted_at?"trash":selected.status}
          initialUrl={selected.hero_image_url||null} initialAlt={selected.hero_image_alt||null}
          onUploaded={(url,alt,status,body)=>{setSelected(prev=>prev?{...prev,hero_image_url:url,hero_image_alt:alt,status,body_markdown:body}:prev);setNotice("একবার আপলোডেই Hero Image, Article-এর ভেতরের ছবি এবং Social Image তৈরি হয়েছে।");void load();}}/>}
        <MarkdownArticleEditor articleId={selected.id} value={selected.body_markdown||""} onChange={value=>setSelected(prev=>prev?{...prev,body_markdown:value}:prev)} primaryKeyword={selected.primary_keyword} title={selected.title} slug={selected.slug} metaTitle={selected.meta_title||""} metaDescription={selected.meta_description||""} disabled={selected.status==="published"||Boolean(selected.deleted_at)}/>
        <details className="mt-5 rounded-2xl border border-emerald-100 bg-[#f8faf7] p-4"><summary className="cursor-pointer font-extrabold">SEO outline, FAQ ও Internal Link Suggestions</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">{([["Outline",selected.outline],["FAQ",selected.faq],["Internal links",selected.internal_link_suggestions],["Competitor notes",selected.competitor_analysis]] as const).map(([label,data])=><div key={label} className="min-w-0 rounded-xl bg-white p-3"><h3 className="text-sm font-bold">{label}</h3><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">{JSON.stringify(data,null,2)}</pre></div>)}</div>
        </details>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">Publish করার আগে তথ্যসূত্র, কৃষি পরামর্শের সত্যতা, originality, ছবি ব্যবহারের অনুমতি, SEO metadata ও links যাচাই করুন। <strong>Approval ≠ Publication.</strong></div>
        <details className="mt-5 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-extrabold">Revision history ({revisions.length})</summary><div className="mt-3 space-y-2">{revisions.map(r=><article key={r.id} className="rounded-xl bg-slate-50 p-3 text-xs"><p className="font-bold">{r.status_before} → {r.status_after} · {new Date(r.changed_at).toLocaleString()}</p><p className="mt-1 break-words">{String(r.snapshot.title||"")}</p><details className="mt-1"><summary className="cursor-pointer font-bold">View snapshot</summary><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(r.snapshot,null,2)}</pre></details></article>)}{!revisions.length&&<p className="text-xs text-slate-500">No revision history found.</p>}</div></details>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {!selected.deleted_at&&<>
          {selected.status!=="published"&&<button disabled={busy} type="button" onClick={()=>void transition("save")} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold disabled:opacity-50">Save Draft</button>}
          {selected.status==="draft"&&<button disabled={busy} type="button" onClick={()=>void transition("review")} className="min-h-11 rounded-xl bg-[#17351f] px-4 text-sm font-bold text-white disabled:opacity-50">Send to Review</button>}
          {selected.status==="review"&&<><button disabled={busy} type="button" onClick={()=>void transition("approved")} className="min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white disabled:opacity-50">Approve</button><button disabled={busy} type="button" onClick={()=>void transition("rejected")} className="min-h-11 rounded-xl border px-4 text-sm font-bold disabled:opacity-50">Reject</button></>}
          {selected.status==="approved"&&<><button disabled={busy} type="button" onClick={()=>void transition("review")} className="min-h-11 rounded-xl border px-4 text-sm font-bold disabled:opacity-50">Return to Review</button>{selected.content_type==="article"?<button disabled={busy} type="button" onClick={()=>void transition("published")} className="min-h-11 rounded-xl bg-amber-700 px-4 text-sm font-bold text-white disabled:opacity-50">Publish to Blog</button>:<p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Product/Tool briefs are not public blog articles; use their separate listing workflow.</p>}</>}
          {selected.status==="rejected"&&<button disabled={busy} type="button" onClick={()=>void transition("draft")} className="min-h-11 rounded-xl border px-4 text-sm font-bold disabled:opacity-50">Reopen Draft</button>}
          {selected.status==="published"&&<><p className="text-xs text-slate-600">Published content is locked. Return to review before editing.</p><button disabled={busy} type="button" onClick={()=>void transition("review")} className="min-h-11 rounded-xl border px-4 text-sm font-bold disabled:opacity-50">Unpublish & Review</button>{selected.content_type==="article"&&<Link href={"/blog/"+selected.slug} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white">View Live Article</Link>}</>}
          </>}
          <ContentRemovalActions id={selected.id} slug={selected.slug} title={selected.title}
            trashed={Boolean(selected.deleted_at)}
            onDone={()=>{setSelected(null);void load();}}/>
        </div>
        {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      </div>
    </div>}
  </section></AdminPageLayout>;
}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div>}
