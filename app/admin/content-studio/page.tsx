import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import BriefGenerator from "./BriefGenerator";
import AgricultureTrends from "./AgricultureTrends";

export const metadata = { title: "Content Studio | AGRIVA Admin", robots: { index: false, follow: false } };

const sections = [
  { href: "/admin/articles", title: "Article Review", description: "Review unpublished article drafts and manage approvals.", icon: "01" },
  { href: "/admin/content-drafts", title: "SEO Content Drafts", description: "Manage the existing SEO draft workflow.", icon: "02" },
  { href: "/admin/seo", title: "SEO Dashboard", description: "Inspect search optimization and site health.", icon: "03" },
  { href: "/admin/opportunities", title: "Content Opportunities", description: "Find and prioritize editorial opportunities.", icon: "04" },
  { href: "/admin/search-intelligence/opportunities", title: "Search Intelligence", description: "Explore search-driven content opportunities.", icon: "05" },
  { href: "/admin/ai-content", title: "Content Intelligence", description: "Explore the existing prototype; its local drafts are not persisted.", icon: "06" },
];

export default async function ContentStudioPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=%2Fadmin%2Fcontent-studio");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");

  const [articlesResult, draftsResult] = await Promise.all([
    supabase.from("article_drafts").select("id,status", { count: "exact", head: false }).limit(500),
    supabase.from("content_drafts").select("id,status", { count: "exact", head: false }).limit(500),
  ]);
  const articleRows = articlesResult.error ? null : (articlesResult.data ?? []);
  const draftRows = draftsResult.error ? null : (draftsResult.data ?? []);
  const pending = articleRows?.filter((item) => ["pending", "pending_review", "review", "in_review"].includes(String(item.status ?? "").toLowerCase())).length;
  const metrics = [
    { label: "Article drafts", value: articlesResult.error ? "—" : String(articlesResult.count ?? articleRows?.length ?? 0), note: "Article review queue" },
    { label: "SEO drafts", value: draftsResult.error ? "—" : String(draftsResult.count ?? draftRows?.length ?? 0), note: "Content draft records" },
    { label: "Pending review", value: pending === undefined ? "—" : String(pending), note: "Recognized review statuses" },
    { label: "Publishing", value: "Manual", note: "Admin approval required" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#a47a20]">AGRIVA / Editorial Operations</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Content Management Studio</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#647468]">A single workspace for editorial planning, SEO, drafting and review. Content remains unpublished until approved through the existing workflow.</p></div>
          <Link href="/admin/articles" className="rounded-xl bg-[#17351f] px-5 py-3 text-sm font-bold text-white hover:bg-[#28583a]">Open review queue →</Link>
        </div>
        <section aria-label="Editorial overview" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((item) => <div key={item.label} className="rounded-2xl border border-[#e4e9df] bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-[#647468]">{item.label}</p><p className="mt-3 text-3xl font-black">{item.value}</p><p className="mt-2 text-xs text-[#647468]">{item.note}</p></div>)}</section>
        {(articlesResult.error || draftsResult.error) && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Some statistics are unavailable. Check database permissions or schema; no values have been estimated.</p>}
        <div className="mt-9 grid gap-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <section className="rounded-3xl border border-[#e4e9df] bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#a47a20]">Editorial planning</p><h2 className="mt-2 text-2xl font-black">Create a content brief</h2></div><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-semibold text-[#315d3c]">Template-based · Not AI</span></div><p className="mt-3 text-sm leading-6 text-[#647468]">Generate a starting outline from a keyword. Review and verify agricultural facts before writing or publishing. This tool does not automatically save or publish content.</p><BriefGenerator /></section>
          <section className="rounded-3xl bg-[#17351f] p-6 text-white shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#b9d6bb]">Editorial workflow</p><h2 className="mt-2 text-2xl font-black">From idea to publication</h2><ol className="mt-6 space-y-5">{[{title:"Research & prioritize",body:"Validate search intent and source reliability."},{title:"Prepare a draft",body:"Create original, evidence-based Bengali agricultural content."},{title:"Review & verify",body:"Check crop recommendations, SEO, images and claims."},{title:"Approve & publish",body:"Use the existing admin-controlled publishing workflow."}].map((step,index)=><li key={step.title} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">{index+1}</span><div><h3 className="font-bold">{step.title}</h3><p className="mt-1 text-sm leading-5 text-[#c8d8ce]">{step.body}</p></div></li>)}</ol><p className="mt-6 rounded-xl border border-white/20 p-3 text-xs leading-5 text-[#c8d8ce]">Automated scheduling and end-to-end article generation are not enabled in this dashboard.</p></section>
        </div>
        <AgricultureTrends />
        <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#a47a20]">Workspace</p><h2 className="mt-2 text-2xl font-black">Content management tools</h2></div><p className="text-sm text-[#647468]">Existing admin modules · Access controlled</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sections.map((section)=><Link key={section.href} href={section.href} className="group rounded-2xl border border-[#e4e9df] bg-white p-6 shadow-sm transition hover:border-[#8ca98f] hover:shadow-md"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ed] text-sm font-black text-[#315d3c]">{section.icon}</span><span aria-hidden="true" className="text-xl text-[#79947d] transition group-hover:translate-x-1">↗</span></div><h3 className="mt-5 text-lg font-bold">{section.title}</h3><p className="mt-2 text-sm leading-6 text-[#647468]">{section.description}</p></Link>)}</div></section>
      </div>
    </main>
  );
}
