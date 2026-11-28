import { AdminPage as AdminPageLayout, AdminErrorState } from "@/components/admin/ui/AdminPrimitives";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata={title:"SEO Dashboard | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function SeoDashboardPage(){
  const {supabase}=await requireAdminPage("content.read");
  const [drafts,opportunities,landings]=await Promise.all([
    supabase.from("content_drafts").select("id,title,slug,status,content_type,primary_keyword,created_at").order("created_at",{ascending:false}).limit(150),
    supabase.from("content_opportunities").select("id,keyword,status").order("search_count",{ascending:false}).limit(150),
    supabase.from("seo_landing_pages").select("id,status").limit(150),
  ]);
  const articleDrafts=(drafts.data||[]).filter(d=>d.content_type==="article");
  const approved=articleDrafts.filter(d=>d.status==="approved");
  const published=articleDrafts.filter(d=>d.status==="published");
  const cards=[
    {name:"Search Opportunities",value:opportunities.error?"—":String(opportunities.data?.length||0),note:"Latest 150"},
    {name:"SEO Article Drafts",value:drafts.error?"—":String(articleDrafts.length),note:"Latest 150"},
    {name:"Approved · Awaiting publish",value:drafts.error?"—":String(approved.length),note:"Still not public"},
    {name:"Published articles",value:drafts.error?"—":String(published.length),note:"Public /blog articles"},
    {name:"SEO Landing Pages",value:landings.error?"—":String(landings.data?.length||0),note:"Latest 150"},
  ];
  const links=[
    {href:"/admin/opportunities",name:"1 · Search Opportunities",note:"Select validated user demand and search intent"},
    {href:"/admin/content-drafts",name:"2 · SEO Content Drafts",note:"Write, format, review, approve and publish Markdown articles"},
    {href:"/admin/articles",name:"3 · Article Review Queue",note:"View SEO and legacy articles in one place"},
    {href:"/admin/content-studio",name:"4 · Content Studio",note:"Research, brief creation and approved-article shortcuts"},
    {href:"/admin/seo-pages",name:"SEO Landing Pages",note:"Separate landing-page workflow (not blog articles)"},
    {href:"/blog",name:"Public Blog",note:"Read only published articles"},
  ];
  return <AdminPageLayout className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">AGRIVA / SEO OPERATIONS</p>
    <h1 className="mt-2 text-2xl font-black sm:text-3xl">SEO Dashboard</h1>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#647468]">Opportunity → Draft → Review → Approved → Published → Live Blog. Approval is not publication; only explicit publish makes an article public.</p>
    {(drafts.error||opportunities.error||landings.error)&&<div className="mt-5"><AdminErrorState title="কিছু SEO metric পাওয়া যায়নি" description="“—” মানে unavailable, zero নয়। Database access ও schema যাচাই করুন।"/></div>}
    <section aria-label="SEO status overview" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map(card=><div key={card.name} className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-4"><p className="text-xs font-bold text-slate-600">{card.name}</p><p className="mt-2 text-2xl font-black text-emerald-900">{card.value}</p><p className="mt-1 text-[11px] text-slate-500">{card.note}</p></div>)}
    </section>
    <section className="mt-8"><h2 className="text-lg font-black">Connected editorial tools</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(link=><Link key={link.href} href={link.href} className="flex min-w-0 flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><span className="font-extrabold text-emerald-950">{link.name}</span><span className="mt-2 text-xs leading-6 text-slate-600">{link.note}</span><span className="mt-auto pt-4 text-xs font-bold text-emerald-700">Open →</span></Link>)}
    </div></section>
    <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-black">Approved articles · Next action</h2><p className="mt-1 text-xs text-slate-600">Only the SEO article editor can publish. Verify headings, factual sources, links and SEO metadata first.</p>
      {approved.length?<div className="mt-4 space-y-2">{approved.slice(0,12).map(article=><Link key={article.id} href={"/admin/content-drafts?draft="+article.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-[#f8faf7] p-3 text-sm font-bold text-[#17351f] hover:border-emerald-300"><span className="min-w-0 break-words">{article.title}</span><span className="text-xs text-emerald-800">Review / Publish →</span></Link>)}</div>:<p className="mt-4 text-sm text-slate-500">কোনো Approved article পাওয়া যায়নি।</p>}
    </section>
  </div></AdminPageLayout>;
}
