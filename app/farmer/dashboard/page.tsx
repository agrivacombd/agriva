import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FarmerDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: products } = await supabase.from("products").select("id,name,price,stock,commission_percent,status").eq("farmer_id", user.id).order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-10 text-[#17351f]"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-bold">← Dashboard</Link><div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold text-[#b58b28]">FARMER PANEL</p><h1 className="mt-1 text-4xl font-black">My products</h1><p className="mt-2 text-[#647468]">Set the reseller commission for every product.</p></div><Link href="/farmer/products/new" className="rounded-2xl bg-[#17351f] px-5 py-3 font-bold text-white">+ Add product</Link></div><div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm"><div className="grid grid-cols-5 border-b bg-[#edf4eb] px-5 py-4 text-xs font-bold uppercase"><span>Product</span><span>Price</span><span>Stock</span><span>Commission</span><span>Status</span></div>{(products ?? []).map(p=><div key={p.id} className="grid grid-cols-5 border-b px-5 py-5 text-sm"><span className="font-bold">{p.name}</span><span>৳{p.price}</span><span>{p.stock}</span><span className="font-bold text-[#1f7a45]">{p.commission_percent}%</span><span>{p.status}</span></div>)}{!products?.length&&<p className="p-8 text-sm text-[#647468]">No products yet. Add your first product to start selling.</p>}</div></div></main>;
}
