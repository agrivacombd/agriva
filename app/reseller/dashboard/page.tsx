import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResellerDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: commissions } = await supabase.from("reseller_commissions").select("amount,status,created_at").eq("reseller_id", user.id).order("created_at", { ascending: false }).limit(50);
  const total = (commissions ?? []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const available = (commissions ?? []).filter(x => x.status === "available").reduce((s, x) => s + Number(x.amount || 0), 0);
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-10 text-[#17351f]"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-bold">← Dashboard</Link><p className="mt-6 font-bold text-[#b58b28]">RESELLER PANEL</p><h1 className="mt-1 text-4xl font-black">My commission</h1><p className="mt-2 text-[#647468]">Share your product links. Eligible sales attributed within 15 days appear here.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{[["Total earned",`৳${total.toFixed(2)}`],["Available",`৳${available.toFixed(2)}`],["Attribution window","15 days"]].map(([a,b])=><div key={a} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-[#647468]">{a}</p><p className="mt-2 text-3xl font-black">{b}</p></div>)}</div><section className="mt-8 rounded-3xl bg-white shadow-sm"><div className="border-b p-6"><h2 className="text-xl font-black">Commission history</h2></div>{(commissions ?? []).map((c,i)=><div key={i} className="grid grid-cols-3 border-b px-6 py-5 text-sm"><span>{new Date(c.created_at).toLocaleDateString()}</span><span className="font-black">৳{Number(c.amount).toFixed(2)}</span><span className="capitalize">{c.status}</span></div>)}{!commissions?.length&&<p className="p-8 text-sm text-[#647468]">No commissions yet.</p>}</section></div></main>;
}
