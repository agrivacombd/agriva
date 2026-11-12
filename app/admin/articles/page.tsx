import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminArticlesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: articles } = await supabase.from("content_drafts").select("id,title,primary_keyword,status,created_at").eq("content_type","article").order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-6xl"><p className="font-bold uppercase tracking-[.18em] text-[#b58b28]">Editorial workflow</p><h1 className="mt-2 text-4xl font-black">Article review queue</h1><p className="mt-3 text-[#647468]">AI-generated drafts stay private until an admin reviews and approves them.</p>{process.env.VERCEL_ENV === "preview" && <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6"><p className="text-xs font-bold uppercase tracking-wider text-amber-800">GitHub editorial drafts · Preview only</p><h2 className="mt-2 text-xl font-bold">মিষ্টিকুমড়া চাষ পদ্ধতি: বীজ বপন থেকে ফসল সংগ্রহ</h2><p className="mt-2 text-sm text-[#647468]">This draft is stored in GitHub, not Supabase. It will not appear in the database review queue below until a separate approved import.</p><Link href="/admin/editorial-preview/mishti-kumra-chash-poddhoti" className="mt-4 inline-block rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">Open unpublished preview</Link></section>}<div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">{(articles ?? []).map(a=><div key={a.id} className="flex flex-col gap-3 border-b p-6 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold">{a.title}</h2><p className="mt-1 text-sm text-[#647468]">Keyword: {a.primary_keyword}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{a.status}</span><Link href={`/admin/articles/${a.id}`} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">Review</Link></div></div>)}{!articles?.length&&<p className="p-8 text-sm text-[#647468]">No drafts yet.</p>}</div></div></main>;
}
