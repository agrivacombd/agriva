import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

export default async function AdminOrdersPage() {
  const auth = await authorizePermission("orders.support_read");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login");
    redirect("/dashboard");
  }
  const supabase = auth.supabase;
  const { data: orders, error: ordersError } = await supabase.from("marketplace_orders").select("id,total_amount,status,created_at,paid_at,shipped_at,delivered_at,reseller_id").order("created_at", { ascending: false }).limit(100);
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">Admin operations</p><h1 className="mt-2 text-4xl font-black">Orders</h1><p className="mt-3 text-[#647468]">Monitor payment, fulfillment and reseller attribution.</p>{ordersError && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">অর্ডারের তথ্য লোড করা যায়নি। Admin read policy ও database schema যাচাই করুন।</p>}<section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">{(orders ?? []).map(o=><div key={o.id} className="grid gap-3 border-b p-5 md:grid-cols-[1.3fr_.7fr_.8fr_1fr]"><div><p className="font-bold">#{o.id.slice(0,8)}</p><p className="mt-1 text-xs text-[#78867b]">{new Date(o.created_at).toLocaleString()}</p></div><p className="font-black">৳{Number(o.total_amount || 0).toLocaleString()}</p><span className="h-fit w-fit rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{o.status}</span><div className="text-xs text-[#657467]">{o.reseller_id ? "Reseller attributed" : "Direct order"}{o.paid_at ? " · Paid" : " · Payment pending"}</div></div>)}{!ordersError && !orders?.length&&<p className="p-8 text-sm text-[#657467]">No orders yet.</p>}</section></div></main>;
}
