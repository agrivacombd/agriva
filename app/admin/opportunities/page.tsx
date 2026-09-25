import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OpportunitiesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: opportunities } = await supabase.from("content_opportunities").select("*").order("search_count", { ascending: false }).limit(50);

  return <main className="min-h-screen bg-[#f6f8f3] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-6xl"><p className="font-bold text-[#b58b28]">ADMIN AI INTELLIGENCE</p><h1 className="mt-2 text-4xl font-black">Demand opportunities</h1><p className="mt-3 text-[#657467]">Search demand detected from AGRIVA users. Use these signals to plan articles, FAQs and products.</p><div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm"><div className="grid grid-cols-4 border-b bg-[#eef4ed] px-5 py-4 text-xs font-bold uppercase tracking-wide"><span>Keyword</span><span>Intent</span><span>Searches</span><span>Type</span></div>{(opportunities ?? []).map((item) => <div key={item.id} className="grid grid-cols-4 border-b px-5 py-5 text-sm"><span className="font-bold">{item.keyword}</span><span>{item.intent ?? "—"}</span><span className="font-black">{item.search_count}</span><span><span className="rounded-full bg-[#e7f0e6] px-3 py-1 text-xs font-bold">{item.opportunity_type}</span></span></div>)}{!opportunities?.length && <div className="p-8 text-sm text-[#657467]">No search opportunities yet. User searches will appear here automatically.</div>}</div></div></main>;
}
