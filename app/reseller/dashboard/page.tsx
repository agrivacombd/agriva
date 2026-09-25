import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResellerDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "reseller") redirect("/dashboard");
  const { data: reseller } = await supabase.from("reseller_profiles").select("reseller_code,wallet_balance,status").eq("user_id", user.id).maybeSingle();
  const { data: commissions } = await supabase.from("reseller_commissions").select("id,amount,status,created_at,order_id").eq("reseller_id", user.id).order("created_at", { ascending: false }).limit(50);
  const since = Date.now() - 15 * 86400000;
  const last15 = (commissions ?? []).filter(x => new Date(x.created_at).getTime() >= since).reduce((s,x) => s + Number(x.amount || 0), 0);
  const pending = (commissions ?? []).filter(x => x.status === "pending").reduce((s,x) => s + Number(x.amount || 0), 0);
  const available = (commissions ?? []).filter(x => x.status === "available").reduce((s,x) => s + Number(x.amount || 0), 0);
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-bold">← Dashboard</Link><p className="mt-6 text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Reseller</p><h1 className="mt-2 text-4xl font-black">Commission dashboard</h1><p className="mt-3 text-[#647468]">Referral attribution lasts 15 days. Commission becomes available only after the order workflow releases it.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[`৳${Number(reseller?.wallet_balance||0).toLocaleString()}`,"Wallet balance"],[`৳${last15.toLocaleString()}`,"Last 15 days"],[`৳${pending.toLocaleString()}`,"Pending"],[`৳${available.toLocaleString()}`,"Available"]].map(([v,l])=><div key={l} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-2xl font-black">{v}</p><p className="mt-2 text-sm text-[#657467]">{l}</p></div>)}</div><section className="mt-8 rounded-3xl bg-white shadow-sm"><div className="border-b p-6"><h2 className="text-xl font-black">Commission history</h2></div>{(commissions ?? []).map(c=><div key={c.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b p-5"><div><p className="font-bold">Order {c.order_id?.slice(0,8) ?? "—"}</p><p className="mt-1 text-xs text-[#78867b]">{new Date(c.created_at).toLocaleDateString()}</p></div><span className="font-black">৳{Number(c.amount).toLocaleString()}</span><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{c.status}</span></div>)}{!commissions?.length&&<p className="p-8 text-sm text-[#657467]">No commissions yet.</p>}</section></div></main>;
}
