import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const stats = [["🌾", "Active farms", "03"], ["🔎", "AI searches", "1,284"], ["📰", "Saved articles", "24"], ["🛒", "Marketplace", "12"]];

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.email?.split("@")[0] || "Farmer";

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><Link href="/" className="text-2xl font-black">AGRIVA<span className="text-[#b58b28]">.</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href="/dashboard" className="text-[#1f7a45]">Dashboard</Link>{profile?.role === "admin" && <Link href="/admin">Admin</Link>}<span className="rounded-full bg-[#17351f] px-4 py-2 text-white">{name}</span></nav></div></header>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b58b28]">AGRIVA intelligence</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Welcome, {name}.</h1>
        <p className="mt-3 max-w-2xl text-[#5e7063]">Ask AGRIVA, monitor your farms, discover useful knowledge, and turn everyday questions into actionable insights.</p>
        <div className="mt-8 rounded-3xl bg-[#17351f] p-6 text-white shadow-xl md:p-8"><p className="text-sm font-semibold text-[#b9d4bd]">AGRIVA AI</p><h2 className="mt-2 text-2xl font-bold">What would you like to know today?</h2><div className="mt-5 flex flex-col gap-3 sm:flex-row"><input className="min-h-14 flex-1 rounded-2xl border border-white/15 bg-white/10 px-5 outline-none placeholder:text-[#b9c9bc]" placeholder="Ask about crops, soil, weather, products..."/><Link href="/search" className="rounded-2xl bg-[#c8a64b] px-7 py-4 text-center font-bold text-[#17351f]">Ask AGRIVA →</Link></div></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([icon,label,value])=><div key={label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><span className="text-2xl">{icon}</span><p className="mt-5 text-sm text-[#66776a]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>)}</div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3"><section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2"><h2 className="text-xl font-bold">AI insights</h2><div className="mt-5 grid gap-3 md:grid-cols-3">{[["🌾","Farm intelligence","Review your crop notes and recent field conditions."],["🔎","Search intelligence","AGRIVA turns your questions into useful insights."],["🛒","Smart discovery","Find relevant agriculture products and knowledge."]].map(([t,h,b])=><div key={h} className="rounded-2xl bg-[#f6f8f3] p-4"><div className="text-2xl">{t}</div><h3 className="mt-3 font-bold">{h}</h3><p className="mt-1 text-sm leading-6 text-[#657467]">{b}</p></div>)}</div></section><section className="rounded-3xl bg-[#e7f0e6] p-6"><p className="font-bold text-[#1f7a45]">Quick actions</p><div className="mt-5 grid gap-3"><Link href="/search" className="rounded-2xl bg-white p-4 font-bold shadow-sm">🔎 AI Search</Link><Link href="/articles" className="rounded-2xl bg-white p-4 font-bold shadow-sm">📰 Articles</Link><Link href="/marketplace" className="rounded-2xl bg-white p-4 font-bold shadow-sm">🛒 Marketplace</Link></div></section></div>
      </section>
    </main>
  );
}
