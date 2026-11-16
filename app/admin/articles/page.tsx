import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {title:"Article Review | AGRIVA Admin",robots:{index:false,follow:false}};
type Entry={id:string;title:string;keyword:string;status:string;created_at:string;source:"seo"|"legacy";slug?:string|null};
export default async function AdminArticlesPage(){
  await requireAdminPage("content.read");
  const supabase=await createSupabaseServerClient();
  const [older,seo]=await Promise.all([
    supabase.from("article_drafts").select("id,title,keyword,status,created_at").order("created_at",{ascending:false}).limit(100),
    supabase.from("content_drafts").select("id,title,primary_keyword,status,created_at,slug").eq("content_type","article").order("created_at",{ascending:false}).limit(100),
  ]);
  const items:Entry[]=[
    ...(older.data||[]).map(a=>({...a,source:"legacy" as const})),
    ...(seo.data||[]).map(a=>({id:a.id,title:a.title,keyword:a.primary_keyword,status:a.status,created_at:a.created_at,slug:a.slug,source:"seo" as const})),
  ].sort((a,b)=>b.created_at.localeCompare(a.created_at));
  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a47b20]">AGRIVA Editorial</p>
    <h1 className="mt-2 text-2xl font-black sm:text-3xl">Article review queue</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#647468]">SEO Content Drafts ও পুরোনো Article Drafts—দুই workflow-র article এখানে পাওয়া যাবে। Approved এবং Published আলাদা; প্রকাশের আগে অনুমোদন ও যাচাই প্রয়োজন।</p>
    <nav aria-label="Content management sections" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {href:"/admin/content-studio",label:"Content Studio"},
        {href:"/admin/content-drafts",label:"SEO Content Drafts"},
        {href:"/admin/opportunities",label:"Keyword Opportunities"},
        {href:"/admin/seo",label:"SEO Dashboard"},
      ].map(link=><Link key={link.href} href={link.href} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold hover:border-green-700 sm:p-4">{link.label}</Link>)}
    </nav>
    {(older.error||seo.error)&&<p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">কিছু editorial record লোড হয়নি। Database permissions যাচাই করুন। এটি সম্পূর্ণ তালিকা নাও হতে পারে।</p>}
    <section className="mt-7 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-4 py-4 text-lg font-black sm:px-6">Articles ({items.length} latest records)</h2>
      {items.length?items.map(a=><article key={a.source+":"+a.id} className="flex min-w-0 flex-col gap-3 border-b border-slate-100 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-800">{a.source==="seo"?"SEO article":"Legacy draft"}</span><span className="text-xs font-semibold capitalize text-slate-600">{a.status}</span></div><h3 className="mt-2 break-words font-extrabold">{a.title}</h3><p className="mt-1 break-words text-xs text-[#647468]">Keyword: {a.keyword}</p></div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {a.source==="seo"&&a.status==="published"&&a.slug&&<Link href={"/blog/"+a.slug} className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800">View live</Link>}
          <Link href={a.source==="seo"?"/admin/content-drafts?draft="+a.id:"/admin/articles/"+a.id} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">{a.source==="seo"?"Open SEO editor":"Review"}</Link>
        </div>
      </article>):<p className="p-6 text-sm text-[#647468]">এখনো কোনো Article draft পাওয়া যায়নি।</p>}
    </section>
  </div></main>;
}
