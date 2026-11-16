import Link from "next/link";
import {requireAdminPage} from "@/lib/admin/authz";
import ArticleQueueClient from "./ArticleQueueClient";

export const metadata={title:"Article Review Queue | AGRIVA Admin",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";

export default async function AdminArticlesPage(){
  const {supabase}=await requireAdminPage("content.read");
  // Production editorial source of truth. The retired article_drafts table is absent.
  const {data,error}=await supabase.from("content_drafts")
    .select("id,title,primary_keyword,status,created_at,updated_at,slug,meta_title,meta_description")
    .eq("content_type","article").order("updated_at",{ascending:false}).limit(150);
  const items=(data||[]).map(row=>({
    id:row.id,
    title:row.title||"শিরোনামবিহীন নিবন্ধ",
    keyword:row.primary_keyword||"",
    status:String(row.status||"draft"),
    slug:row.slug||"",
    created_at:row.created_at,
    updated_at:row.updated_at||row.created_at,
    meta_title:row.meta_title||"",
    meta_description:row.meta_description||"",
  }));
  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-7 text-[#17351f] sm:px-6 sm:py-11">
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#a47b20]">AGRIVA EDITORIAL</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Article Review Queue</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            SEO Draft → Review → Approved → Published। Approved মানেই Published নয়; প্রকাশের জন্য পৃথক অনুমোদিত action প্রয়োজন।
          </p>
        </header>
        <Link href="/admin/content-drafts"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
          SEO Editor খুলুন <span aria-hidden="true" className="ml-2">↗</span>
        </Link>
      </div>
      <nav aria-label="Content management sections" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {href:"/admin/content-studio",label:"Content Studio",hint:"পরিকল্পনা"},
          {href:"/admin/content-drafts",label:"SEO Content Drafts",hint:"লেখা ও সম্পাদনা"},
          {href:"/admin/opportunities",label:"Keyword Opportunities",hint:"নতুন বিষয় খুঁজুন"},
          {href:"/admin/seo",label:"SEO Dashboard",hint:"SEO পর্যবেক্ষণ"},
        ].map(link=><Link key={link.href} href={link.href}
          className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
          <span className="block text-sm font-extrabold text-emerald-950">{link.label}</span>
          <span className="mt-1 block text-xs text-slate-500">{link.hint}</span>
        </Link>)}
      </nav>
      {error&&<div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
        বর্তমান SEO Article তালিকা লোড করা যায়নি। Admin authorization বা database সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।
        <Link href="/admin/articles" className="ml-2 font-extrabold underline">Refresh</Link>
      </div>}
      {!error&&<ArticleQueueClient items={items}/>}
    </div>
  </main>;
}
