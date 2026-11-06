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
  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-[1500px]"><header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white sm:p-8"><div className="relative"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · GROWTH, SEO & ANALYTICS</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Article review queue</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">AI-generated drafts private থাকে; review ও approval ছাড়া publish হয় না।</p></div></header><div className="mt-6 overflow-hidden rounded-2xl border border-[#e0e9dd] bg-white shadow-sm">{(articles ?? []).map(a=><div key={a.id} className="flex flex-col gap-3 border-b p-6 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold">{a.title}</h2><p className="mt-1 text-sm text-[#647468]">Keyword: {a.keyword}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{a.status}</span><Link href={`/admin/articles/${a.id}`} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">Review</Link></div></div>)}{!articles?.length&&<p className="p-8 text-sm text-[#647468]">No drafts yet.</p>}</div></div></main>;
}
