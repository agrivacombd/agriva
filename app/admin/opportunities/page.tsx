import { AdminPage as AdminPageLayout, AdminErrorState, AdminEmptyState } from "@/components/admin/ui/AdminPrimitives";
import Link from "next/link";
import {requireAdminPage} from "@/lib/admin/authz";
export const metadata={title:"Content Opportunities | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function OpportunitiesPage(){
  const {supabase}=await requireAdminPage("content.read");
  const {data: opportunities,error: opportunitiesError}=await supabase.from("content_opportunities").select("id,keyword,intent,search_count,opportunity_type,status").order("search_count",{ascending:false}).limit(100);
  return <AdminPageLayout className="min-h-screen bg-[#f6f8f3] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">AGRIVA · Search Intelligence</p>
    <h1 className="mt-2 text-2xl font-black sm:text-3xl">Content Opportunities</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">বৈধ search opportunities থেকে SEO Draft তৈরি করুন। Draft তৈরি হলে Editor → Review → Approval → Publication ধাপগুলো ব্যবহার করুন।</p>
    <div className="mt-4 flex flex-wrap gap-2"><Link href="/admin/seo" className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold">SEO Dashboard</Link><Link href="/admin/content-drafts" className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">SEO Drafts</Link></div>
    {opportunitiesError&&<div className="mt-5"><AdminErrorState title="Search opportunities লোড হয়নি" description="অনুমতি ও database schema যাচাই করুন।"/></div>}
    <section className="mt-6 grid gap-3 md:grid-cols-2">
      {(opportunities||[]).map(item=><article key={item.id} className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-extrabold uppercase text-emerald-800">{item.opportunity_type}</span><span className="text-xs font-semibold capitalize text-slate-500">{item.status}</span></div>
        <h2 className="mt-2 break-words text-lg font-extrabold">{item.keyword}</h2>
        <p className="mt-2 text-xs leading-6 text-slate-600">Searches: {item.search_count} · Intent: {item.intent??"—"}</p>
        {["open","approved"].includes(item.status)?<Link href={"/admin/content-drafts?opportunity="+item.id} className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#173b2d] px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Create SEO Draft →</Link>:<Link href="/admin/content-drafts" className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800">View existing Drafts →</Link>}
      </article>)}
      {!opportunitiesError && !opportunities?.length&&<AdminEmptyState title="এখনো কোনো Search Opportunity নেই" description="নতুন search demand পাওয়া গেলে এখানে দেখা যাবে।"/>}
    </section>
  </div></AdminPageLayout>;
}