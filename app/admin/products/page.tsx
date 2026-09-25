import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: products } = await supabase.from("products").select("id,name,price,stock,commission_percent,moderation_status,created_at").order("created_at", { ascending: false }).limit(50);

  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-6xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">Admin moderation</p><h1 className="mt-2 text-4xl font-black">Farmer products</h1><p className="mt-3 text-[#647468]">Review farmer listings before they become visible in the marketplace.</p><div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">{(products ?? []).map(p=><div key={p.id} className="grid gap-4 border-b p-5 md:grid-cols-[1.6fr_.6fr_.6fr_.8fr]"><div><p className="font-bold">{p.name}</p><p className="mt-1 text-xs text-[#78867b]">Stock {p.stock} · Commission {p.commission_percent}%</p></div><span className="font-bold">৳{Number(p.price).toLocaleString()}</span><span className="text-sm">{p.moderation_status}</span><div className="flex gap-2"><button className="rounded-xl bg-[#17351f] px-3 py-2 text-xs font-bold text-white">Review</button><button className="rounded-xl border px-3 py-2 text-xs font-bold">Details</button></div></div>)}{!products?.length&&<p className="p-8 text-sm text-[#647468]">No farmer products submitted yet.</p>}</div></div></main>;
}
