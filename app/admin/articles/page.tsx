import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminArticlesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: articles } = await supabase.from("article_drafts").select("id,title,keyword,status,created_at").order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-6xl"><p className="font-bold uppercase tracking-[.18em] text-[#b58b28]">Editorial workflow</p><h1 className="mt-2 text-4xl font-black">Article review queue</h1><p className="mt-3 text-[#647468]">AI-generated drafts stay private until an admin reviews and approves them.</p><nav aria-label="Content management sections" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Link href="/admin/content-studio" className="rounded-xl border bg-white p-4 font-semibold hover:border-green-700">Content Studio</Link><Link href="/admin/content-drafts" className="rounded-xl border bg-white p-4 font-semibold hover:border-green-700">SEO Content Drafts</Link><Link href="/admin/opportunities" className="rounded-xl border bg-white p-4 font-semibold hover:border-green-700">Keyword Opportunities</Link><Link href="/admin/seo" className="rounded-xl border bg-white p-4 font-semibold hover:border-green-700">SEO Dashboard</Link></nav><div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">{(articles ?? []).map(a=><div key={a.id} className="flex flex-col gap-3 border-b p-6 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold">{a.title}</h2><p className="mt-1 text-sm text-[#647468]">Keyword: {a.keyword}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{a.status}</span><Link href={`/admin/articles/${a.id}`} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">Review</Link></div></div>)}{!articles?.length&&<p className="p-8 text-sm text-[#647468]">No drafts yet.</p>}</div></div></main>;
}
