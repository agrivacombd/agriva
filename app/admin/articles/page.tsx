import { AdminPage as AdminPageLayout } from "@/components/admin/ui/AdminPrimitives";
import Link from "next/link";
import {requireAdminPage} from "@/lib/admin/authz";
import ContentRemovalActions from "@/app/admin/content-drafts/ContentRemovalActions";

export const metadata={title:"Manage Articles | AGRIVA Admin",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";

const statuses=["all","draft","review","approved","published","rejected","trash"] as const;
type Status=(typeof statuses)[number];
type QueryParams={q?:string;status?:string;page?:string};
const labels:Record<Status,string>={
  all:"সব নিবন্ধ",draft:"Draft",review:"Review",approved:"Approved",
  published:"Published",rejected:"Needs revision",trash:"Trash",
};
const dateLabel=(value:string|null)=>value&&Number.isFinite(Date.parse(value))
  ?new Date(value).toLocaleDateString("en-GB",{timeZone:"Asia/Dhaka",day:"2-digit",month:"short",year:"numeric"})
  :"—";
const seoComplete=(row:{meta_title:string|null;meta_description:string|null})=>
  (row.meta_title||"").trim().length>=25&&(row.meta_title||"").trim().length<=65&&
  (row.meta_description||"").trim().length>=100&&(row.meta_description||"").trim().length<=180;

export default async function AdminArticlesPage({searchParams}:{searchParams?:Promise<QueryParams>}){
  const {supabase}=await requireAdminPage("content.read");
  const params=await searchParams;
  const status:Status=statuses.includes(params?.status as Status)?params!.status as Status:"all";
  const search=String(params?.q||"").trim().slice(0,100);
  const parsedPage=Number.parseInt(String(params?.page||"1"),10);
  const page=Number.isFinite(parsedPage)?Math.min(10000,Math.max(1,parsedPage)):1;
  const pageSize=20;
  const base=()=>supabase.from("content_drafts").select("id",{count:"exact",head:true}).eq("content_type","article");
  const counts=await Promise.all(statuses.map(async key=>{
    let query=base();
    if(key==="trash")query=query.not("deleted_at","is",null);
    else{
      query=query.is("deleted_at",null);
      if(key!=="all")query=query.eq("status",key);
    }
    const {count,error}=await query;
    return {key,count:count??0,error};
  }));
  const countMap=Object.fromEntries(counts.map(c=>[c.key,c.count])) as Record<Status,number>;
  let rowsQuery=supabase.from("content_drafts")
    .select("id,title,primary_keyword,status,created_at,updated_at,slug,meta_title,meta_description,deleted_at",{count:"exact"})
    .eq("content_type","article");
  if(status==="trash")rowsQuery=rowsQuery.not("deleted_at","is",null);
  else{
    rowsQuery=rowsQuery.is("deleted_at",null);
    if(status!=="all")rowsQuery=rowsQuery.eq("status",status);
  }
  // Remove PostgREST filter punctuation so user input cannot alter the OR expression.
  const safeSearch=search.replace(/[(),.%*\\]/g," ").replace(/\s+/g," ").trim();
  if(safeSearch)rowsQuery=rowsQuery.or(
    `title.ilike.%${safeSearch}%,primary_keyword.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`
  );
  const {data:articles,count:filteredCount,error}=await rowsQuery
    .order("updated_at",{ascending:false})
    .range((page-1)*pageSize,page*pageSize-1);
  const total=filteredCount??0;
  const link=(changes:Partial<{q:string;status:string;page:number}>)=>{
    const next=new URLSearchParams({q:search,status,page:String(page)});
    Object.entries(changes).forEach(([key,value])=>next.set(key,String(value)));
    return `/admin/articles?${next.toString()}`;
  };
  const navigation=[
    {href:"/admin/content-drafts",label:"SEO Editor",hint:"লেখা ও সম্পাদনা"},
    {href:"/admin/content-studio",label:"Content Studio",hint:"নতুন কনটেন্ট"},
    {href:"/admin/opportunities",label:"Keyword Ideas",hint:"বিষয় খুঁজুন"},
    {href:"/admin/seo",label:"SEO Dashboard",hint:"SEO পর্যবেক্ষণ"},
  ];
  return <AdminPageLayout className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1600px] px-4 py-5 text-[#17351f] sm:px-6 sm:py-7 xl:px-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Editorial catalogue</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">নিবন্ধ ব্যবস্থাপনা</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">Product Management-এর মতো এক জায়গায় সব Article খুঁজুন, Edit করুন এবং প্রকাশনার অবস্থা দেখুন। Draft → Review → Approved → Published নিয়ম অপরিবর্তিত।</p>
      </div>
      <Link href="/admin/content-drafts" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#17452c] px-5 text-sm font-extrabold text-white hover:bg-emerald-800">+ New / Edit Article</Link>
    </header>
    <nav aria-label="Editorial tools" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {navigation.map(item=><Link key={item.href} href={item.href} className="rounded-xl border border-[#dfe8dc] bg-white p-3 hover:border-emerald-500">
        <span className="block text-sm font-extrabold">{item.label}</span><span className="mt-1 block text-xs text-[#637266]">{item.hint}</span>
      </Link>)}
    </nav>
    <section aria-label="Article status overview" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {(["all","draft","review","approved","published","trash"] as Status[]).map(key=><Link key={key} href={link({status:key,page:1})}
        aria-current={status===key?"page":undefined}
        className={`rounded-2xl border p-4 transition hover:border-emerald-500 ${status===key?"border-emerald-500 bg-emerald-50":"border-[#dfe8dc] bg-white"}`}>
        <span className="block text-xs font-semibold text-[#637266]">{labels[key]}</span>
        <span className="mt-2 block text-2xl font-black tabular-nums">{countMap[key]}</span>
      </Link>)}
    </section>
    <form method="get" action="/admin/articles" className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:flex-row">
      <input type="search" name="q" maxLength={100} defaultValue={search} placeholder="Title, keyword বা slug দিয়ে খুঁজুন..." aria-label="Search articles" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d9e3d5] px-3 text-sm"/>
      <select name="status" defaultValue={status} aria-label="Article status" className="min-h-11 rounded-xl border border-[#d9e3d5] bg-white px-3 text-sm">
        {statuses.map(key=><option key={key} value={key}>{labels[key]}</option>)}
      </select>
      <button type="submit" className="min-h-11 rounded-xl bg-[#17452c] px-5 text-sm font-bold text-white">Search / Filter</button>
      <Link href="/admin/articles" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold">Reset</Link>
    </form>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#637266]">
      <span>{total}টি ফলাফল · Page {page} · প্রতি পেজে {pageSize}টি</span>
      <span>Published পোস্টের শিরোনাম নতুন ট্যাবে খুলবে</span>
    </div>
    {(error||counts.some(c=>c.error))&&<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">নিবন্ধ তালিকা বা সংখ্যা লোড করা যায়নি। Admin access ও database সংযোগ পরীক্ষা করুন।</p>}
    {!error&&<section aria-label="Article catalogue" className="mt-4 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#f2f7ef] text-[#47604d]"><tr>
            <th scope="col" className="p-4">নিবন্ধ</th><th scope="col" className="p-4">Keyword</th>
            <th scope="col" className="p-4">Status</th><th scope="col" className="p-4">SEO</th>
            <th scope="col" className="p-4">Updated</th><th scope="col" className="p-4">Actions</th>
          </tr></thead>
          <tbody>{(articles||[]).map(article=>{
            const trashed=Boolean(article.deleted_at);
            const live=!trashed&&article.status==="published"&&Boolean(article.slug);
            const href=live?`/blog/${encodeURIComponent(article.slug)}`:`/admin/content-drafts?draft=${encodeURIComponent(article.id)}`;
            return <tr key={article.id} className="border-t border-[#e7eee4] align-top hover:bg-[#fafcf8]">
              <td className="max-w-[360px] p-4"><Link href={href} target={live?"_blank":undefined} rel={live?"noopener noreferrer":undefined} className="font-extrabold leading-6 hover:underline">{article.title||"শিরোনামবিহীন নিবন্ধ"}</Link>
                <p className="mt-1 break-all text-xs text-slate-500">/blog/{article.slug||"—"}</p></td>
              <td className="max-w-[180px] break-words p-4 text-xs">{article.primary_keyword||"—"}</td>
              <td className="p-4"><span className="inline-block rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{trashed?"Trash":article.status}</span></td>
              <td className="p-4 text-xs font-bold"><span className={seoComplete(article)?"text-emerald-800":"text-amber-800"}>{seoComplete(article)?"Meta OK":"Review SEO"}</span></td>
              <td className="whitespace-nowrap p-4 text-xs text-slate-600">{dateLabel(article.updated_at||article.created_at)}</td>
              <td className="p-4"><div className="flex min-w-[180px] flex-wrap gap-2">
                {!trashed&&<Link href={`/admin/content-drafts?draft=${encodeURIComponent(article.id)}`} className="inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-bold">Edit</Link>}
                {live&&<Link href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-bold">View ↗</Link>}
                <ContentRemovalActions compact id={article.id} slug={article.slug||""} title={article.title||""} trashed={trashed}/>
              </div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="divide-y divide-[#e7eee4] lg:hidden">{(articles||[]).map(article=>{
        const trashed=Boolean(article.deleted_at);
        const live=!trashed&&article.status==="published"&&Boolean(article.slug);
        const href=live?`/blog/${encodeURIComponent(article.slug)}`:`/admin/content-drafts?draft=${encodeURIComponent(article.id)}`;
        return <article key={article.id} className="p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#edf4e9] px-2 py-1 font-bold">{trashed?"Trash":article.status}</span><span className={seoComplete(article)?"text-emerald-800":"text-amber-800"}>{seoComplete(article)?"SEO Meta OK":"SEO Review"}</span></div>
          <Link href={href} target={live?"_blank":undefined} rel={live?"noopener noreferrer":undefined} className="mt-2 block text-base font-black leading-7 hover:underline">{article.title||"শিরোনামবিহীন নিবন্ধ"}</Link>
          <p className="mt-1 break-words text-xs text-slate-600">Keyword: {article.primary_keyword||"—"}</p>
          <p className="mt-1 text-xs text-slate-500">Updated: {dateLabel(article.updated_at||article.created_at)}</p>
          <div className="mt-3 flex flex-wrap gap-2">{!trashed&&<Link href={`/admin/content-drafts?draft=${encodeURIComponent(article.id)}`} className="inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-bold">Edit</Link>}
            {live&&<Link href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-bold">View ↗</Link>}
            <ContentRemovalActions compact id={article.id} slug={article.slug||""} title={article.title||""} trashed={trashed}/></div>
        </article>;
      })}</div>
      {!articles?.length&&<div className="p-8 text-center text-sm text-slate-600">এই Search/Filter-এ কোনো Article পাওয়া যায়নি। <Link className="font-bold underline" href="/admin/articles">সব নিবন্ধ দেখুন</Link></div>}
    </section>}
    <nav aria-label="Article pagination" className="mt-4 flex items-center justify-between gap-3">
      {page>1?<Link href={link({page:page-1})} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">← Previous</Link>:<span className="rounded-xl border px-4 py-2 text-sm opacity-40">← Previous</span>}
      <span className="text-sm text-[#637266]">Page {page} / {Math.max(1,Math.ceil(total/pageSize))}</span>
      {page*pageSize<total?<Link href={link({page:page+1})} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Next →</Link>:<span className="rounded-xl border px-4 py-2 text-sm opacity-40">Next →</span>}
    </nav>
    <p className="mt-5 text-xs leading-6 text-slate-600">Trash থেকে Restore করা যায়; Permanently Delete ফিরিয়ে আনা যায় না। SEO Meta OK শুধু title/description-এর দৈর্ঘ্য যাচাই করে—উৎস ও তথ্য সম্পাদকীয়ভাবে যাচাই করতে হবে।</p>
  </AdminPageLayout>;
}
