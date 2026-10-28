import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LearningCorrectionInbox from "@/components/admin/LearningCorrectionInbox";
import BrandLogo from "@/components/BrandLogo";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}

async function updateOrderStatus(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!orderId || !["processing", "shipped", "delivered", "completed", "cancelled", "refunded"].includes(status)) {
    redirect("/admin?notice=invalid_order");
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("set_marketplace_order_status", { p_order_id: orderId, p_status: status });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=order_error" : "/admin?notice=order_updated");
}

async function approveCommission(formData: FormData) {
  "use server";
  const commissionId = String(formData.get("commissionId") ?? "");
  if (!commissionId) redirect("/admin?notice=invalid_commission");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("approve_reseller_commission", { p_commission_id: commissionId });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=commission_error" : "/admin?notice=commission_approved");
}

async function approvePayout(formData: FormData) {
  "use server";
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) redirect("/admin?notice=invalid_payout");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("approve_commission_payout", { p_payout_id: payoutId });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=payout_error" : "/admin?notice=payout_approved");
}

async function completePayout(formData: FormData) {
  "use server";
  const payoutId = String(formData.get("payoutId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  if (!payoutId || !reference) redirect("/admin?notice=invalid_payout");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("complete_commission_payout", {
    p_payout_id: payoutId,
    p_payment_reference: reference,
  });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=payout_complete_error" : "/admin?notice=payout_paid");
}

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(Number(value ?? 0));

const noticeText: Record<string, string> = {
  order_updated: "অর্ডারের স্ট্যাটাস আপডেট হয়েছে।",
  order_error: "অর্ডার আপডেট হয়নি। স্ট্যাটাস ও database migration যাচাই করুন।",
  commission_approved: "কমিশন অনুমোদিত হয়েছে।",
  commission_error: "কমিশন অনুমোদন করা যায়নি।",
  payout_approved: "পেআউট অনুমোদিত হয়েছে।",
  payout_error: "পেআউট অনুমোদন করা যায়নি।",
  payout_paid: "পেআউট পরিশোধ হিসেবে চিহ্নিত হয়েছে।",
  payout_complete_error: "পেআউট সম্পন্ন হয়নি। ব্যালেন্স ও পেমেন্ট রেফারেন্স যাচাই করুন।",
  invalid_order: "অর্ডারের তথ্য সঠিক নয়।",
  invalid_commission: "কমিশনের তথ্য সঠিক নয়।",
  invalid_payout: "পেআউটের তথ্য সঠিক নয়।",
};

export default async function AdminPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const { supabase, user } = await requireAdmin();

  const [
    profilesCount, farmersCount, resellersCount, productsCount, ordersCount,
    commissionsCount, payoutsCount, orderTotals, recentOrders, recentCommissions,
    recentPayouts, opportunities,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "farmer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reseller"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("marketplace_orders").select("id", { count: "exact", head: true }),
    supabase.from("reseller_commissions").select("id", { count: "exact", head: true }),
    supabase.from("commission_payouts").select("id", { count: "exact", head: true }),
    supabase.from("marketplace_orders").select("total_amount,status,payment_status"),
    supabase.from("marketplace_orders").select("id,created_at,status,payment_status,payment_method,total_amount,quantity,shipping_address,product:products(name),buyer:profiles!marketplace_orders_buyer_id_fkey(full_name)").order("created_at", { ascending: false }).limit(12),
    supabase.from("reseller_commissions").select("id,reseller_id,order_id,amount,status,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("commission_payouts").select("id,reseller_id,amount,status,payment_method,requested_at,payment_reference").order("requested_at", { ascending: false }).limit(8),
    supabase.from("content_opportunities").select("id,keyword,search_count,opportunity_type,status").order("search_count", { ascending: false }).limit(5),
  ]);

  const orders = orderTotals.data ?? [];
  const revenue = orders.filter(o => !["cancelled", "refunded"].includes(o.status)).reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
  const pendingOrders = orders.filter(o => ["pending", "processing"].includes(o.status)).length;
  const pendingCommissions = (recentCommissions.data ?? []).filter(c => c.status === "pending");
  const pendingPayouts = (recentPayouts.data ?? []).filter(p => ["requested", "approved"].includes(p.status));
  const cards = [
    ["মোট ব্যবহারকারী", profilesCount.error ? "—" : profilesCount.count ?? 0, "users"],
    ["কৃষক", farmersCount.error ? "—" : farmersCount.count ?? 0, "sprout"],
    ["রিসেলার", resellersCount.error ? "—" : resellersCount.count ?? 0, "share-2"],
    ["পণ্য", productsCount.error ? "—" : productsCount.count ?? 0, "package"],
    ["মোট অর্ডার", ordersCount.error ? "—" : ordersCount.count ?? 0, "shopping-bag"],
    ["রিভিউ প্রয়োজন", orderTotals.error ? "—" : pendingOrders, "clipboard-list"],
    ["কমিশন রেকর্ড", commissionsCount.error ? "—" : commissionsCount.count ?? 0, "wallet"],
    ["পেআউট রেকর্ড", payoutsCount.error ? "—" : payoutsCount.count ?? 0, "banknote"],
  ];
  const hasDashboardQueryError = [
    profilesCount, farmersCount, resellersCount, productsCount, ordersCount,
    commissionsCount, payoutsCount, orderTotals, recentOrders, recentCommissions,
    recentPayouts, opportunities,
  ].some((result) => Boolean(result.error));

  return (
    <main className="min-h-screen bg-[#f4f7f1] text-[#17351f]">
      <aside className="border-b border-[#dfe8dc] bg-[#123b27] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <div><BrandLogo href="/" imageClassName="h-10 w-40 rounded-lg bg-white p-1" /><p className="mt-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-100">Super Admin Console</p></div>
          <div className="flex items-center gap-3 text-sm"><span className="rounded-full border border-white/20 px-3 py-1.5">Admin verified</span><Link href="/dashboard" className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20">User dashboard ↗</Link></div>
        </div>
      </aside>

      <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#a47b20]">Platform overview</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Super Admin Panel</h1><p className="mt-2 text-sm text-[#637266]">ব্যবহারকারী, পণ্য, অর্ডার, রিসেলার কমিশন ও পেআউট—এক জায়গা থেকে পর্যবেক্ষণ করুন।</p></div>
          <div className="rounded-2xl border border-[#dce7d8] bg-white px-4 py-3 text-sm"><span className="text-[#758277]">Signed in as</span><p className="mt-1 max-w-[260px] truncate font-bold">{user.email ?? user.id}</p></div>
        </div>

        {searchParams?.notice && <div role="status" className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${searchParams.notice.endsWith("_error") || searchParams.notice.startsWith("invalid") ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{noticeText[searchParams.notice] ?? "অপারেশন সম্পন্ন হয়েছে।"}</div>}
        {hasDashboardQueryError && <div role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">কিছু dashboard data লোড করা যায়নি। যেসব metric-এ “—” দেখাচ্ছে সেগুলোকে শূন্য ধরে নেবেন না। Database permissions বা query error যাচাই করে আবার চেষ্টা করুন।</div>}

        <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {cards.map(([label, value, icon]) => <div key={String(label)} className="min-w-0 rounded-2xl border border-[#e1e9de] bg-white p-3 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold leading-5 text-[#657467] sm:text-sm">{label}</p><span className="shrink-0 rounded-xl bg-[#eaf3e8] px-2 py-1.5 text-[10px] font-black text-[#267044] sm:text-xs">{icon}</span></div><p className="mt-3 break-words text-2xl font-black tabular-nums sm:mt-4 sm:text-3xl">{value}</p></div>)}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
          <div className="min-w-0 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:p-6">
            <p className="text-sm font-bold text-[#6b786d]">ORDER VALUE SNAPSHOT</p><div className="mt-3 flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><p className="break-words text-2xl font-black sm:text-3xl">{orderTotals.error ? "ডেটা পাওয়া যায়নি" : money(revenue)}</p><p className="mt-1 text-sm text-[#68786b]">Non-cancelled order value (all time)</p></div><div className="rounded-xl bg-amber-50 px-3 py-3 text-sm sm:px-4"><span className="font-black text-amber-800">{orderTotals.error ? "—" : pendingOrders}</span><span className="ml-2 text-amber-900">অর্ডার প্রসেসিং প্রয়োজন</span></div></div><p className="mt-4 text-xs leading-5 text-[#879187]">এটি অর্ডারের মোট মূল্য; এটি নিট আয় বা নিশ্চিতভাবে আদায় করা টাকা নয়।</p>
          </div>
          <div className="rounded-2xl bg-[#e5efe2] p-6"><p className="text-sm font-bold text-[#356748]">QUICK ACTIONS</p><div className="mt-4 grid grid-cols-2 gap-3">{[["/admin/products","পণ্য ব্যবস্থাপনা"],["/admin/green-exchange","Green Exchange মডারেশন"],["/admin/harvest","ফসলের পোস্ট যাচাই"],["/admin/transport","পরিবহন পার্টনার যাচাই"],["/admin/users","ব্যবহারকারী"],["/admin/categories","ক্যাটাগরি"],["/admin/settings","সাইট সেটিংস"],["/admin/reports","রিপোর্ট ও CSV"],["/admin/audit","Audit log"],["/admin/opportunities","AI demand"],["/orders","অর্ডার পেজ"]].map(([href,label])=><Link key={href} href={href} className="rounded-xl border border-[#cbdcc7] bg-white px-3 py-3 text-sm font-bold transition hover:border-[#36764a] hover:bg-[#f8fbf6]">{label} ↗</Link>)}</div></div>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7ede4] px-5 py-4"><div><h2 className="text-xl font-black">সাম্প্রতিক অর্ডার</h2><p className="mt-1 text-sm text-[#748074]">স্ট্যাটাস আপডেট করলে stock ও কমিশনের নিয়ম ডেটাবেস RPC-তে প্রয়োগ হবে।</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{recentOrders.data?.length ?? 0} recent</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs uppercase tracking-wide text-[#6d7b6e]"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Product / buyer</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status / update</th></tr></thead><tbody>{(recentOrders.data ?? []).map(order => <tr key={order.id} className="border-t border-[#edf1ea] align-top"><td className="px-5 py-4"><p className="font-bold">#{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-[#7b887d]">{new Date(order.created_at).toLocaleDateString("en-GB")}</p></td><td className="px-5 py-4"><p className="font-semibold">{(order.product as {name?:string}|null)?.name ?? "Product"}</p><p className="mt-1 text-xs text-[#7b887d]">Qty: {order.quantity} · {(order.shipping_address as {fullName?:string}|null)?.fullName ?? "Buyer"}</p></td><td className="px-5 py-4 font-black">{money(order.total_amount)}</td><td className="px-5 py-4"><p className="font-semibold uppercase">{order.payment_method}</p><p className="mt-1 text-xs text-[#7b887d]">{order.payment_status}</p></td><td className="px-5 py-4"><p className="mb-2 inline-flex rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold">{order.status}</p><form action={updateOrderStatus} className="flex items-center gap-2"><input type="hidden" name="orderId" value={order.id}/><select name="status" defaultValue={order.status} className="rounded-lg border border-[#d9e3d5] bg-white px-2 py-2 text-xs"><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select><button className="rounded-lg bg-[#17452c] px-3 py-2 text-xs font-bold text-white hover:bg-[#22613d]">Save</button></form></td></tr>)}</tbody></table>{recentOrders.error ? <p role="alert" className="p-5 text-sm text-red-800">অর্ডার লোড করা যায়নি। Database permission বা query error যাচাই করুন।</p> : !recentOrders.data?.length && <p className="p-8 text-sm text-[#6b786d]">এখনো কোনো অর্ডার পাওয়া যায়নি।</p>}</div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white">
            <div className="border-b border-[#e7ede4] px-5 py-4"><h2 className="text-xl font-black">রিসেলার কমিশন</h2><p className="mt-1 text-sm text-[#748074]">Pending commission approve করুন</p></div>
            <div className="divide-y divide-[#edf1ea]">{(recentCommissions.data ?? []).map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-bold">{money(c.amount)} <span className="ml-2 rounded-full bg-[#f3f5f1] px-2 py-1 text-xs">{c.status}</span></p><p className="mt-1 text-xs text-[#7b887d]">Order #{c.order_id.slice(0,8)} · Reseller #{c.reseller_id.slice(0,8)}</p></div>{c.status === "pending" && <form action={approveCommission}><input type="hidden" name="commissionId" value={c.id}/><button className="rounded-xl bg-[#17452c] px-3 py-2 text-xs font-bold text-white">Approve</button></form>}</div>)}{recentCommissions.error ? <p role="alert" className="p-5 text-sm text-red-800">কমিশন রেকর্ড লোড করা যায়নি।</p> : !recentCommissions.data?.length && <p className="p-6 text-sm text-[#6b786d]">কমিশন রেকর্ড নেই।</p>}</div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white">
            <div className="border-b border-[#e7ede4] px-5 py-4"><h2 className="text-xl font-black">রিসেলার পেআউট</h2><p className="mt-1 text-sm text-[#748074]">Approve এবং পেমেন্ট রেফারেন্সসহ paid mark করুন</p></div>
            <div className="divide-y divide-[#edf1ea]">{(recentPayouts.data ?? []).map(p => <div key={p.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{money(p.amount)} <span className="ml-2 rounded-full bg-[#f3f5f1] px-2 py-1 text-xs">{p.status}</span></p><p className="mt-1 text-xs text-[#7b887d]">Reseller #{p.reseller_id.slice(0,8)} · {p.payment_method ?? "Method not set"}</p></div>{p.status === "requested" && <form action={approvePayout}><input type="hidden" name="payoutId" value={p.id}/><button className="rounded-xl border border-[#d9e3d5] px-3 py-2 text-xs font-bold">Approve</button></form>}</div>{["requested","approved"].includes(p.status) && <form action={completePayout} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="payoutId" value={p.id}/><input name="reference" defaultValue={p.payment_reference ?? ""} required placeholder="Payment transaction/reference" className="min-w-[200px] flex-1 rounded-xl border border-[#d9e3d5] px-3 py-2 text-xs"/><button className="rounded-xl bg-[#17452c] px-3 py-2 text-xs font-bold text-white">Mark paid</button></form>}</div>)}{recentPayouts.error ? <p role="alert" className="p-5 text-sm text-red-800">পেআউট রেকর্ড লোড করা যায়নি।</p> : !recentPayouts.data?.length && <p className="p-6 text-sm text-[#6b786d]">পেআউট অনুরোধ নেই।</p>}</div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#dfe8dc] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">AI Search Opportunities</h2><p className="mt-1 text-sm text-[#748074]">জনপ্রিয় search demand থেকে product ও content আইডিয়া</p></div><Link href="/admin/opportunities" className="rounded-xl border border-[#d9e3d5] px-4 py-2 text-sm font-bold">সব দেখুন ↗</Link></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{(opportunities.data ?? []).map(item=><div key={item.id} className="rounded-xl bg-[#f7faf5] p-4"><p className="font-bold">{item.keyword}</p><p className="mt-2 text-xs text-[#748074]">{item.search_count} searches · {item.opportunity_type}</p><p className="mt-1 text-xs font-semibold text-[#39724a]">{item.status}</p></div>)}{opportunities.error ? <p role="alert" className="text-sm text-red-800">Search opportunity data লোড করা যায়নি।</p> : !opportunities.data?.length && <p className="text-sm text-[#748074]">এখনো search signal নেই।</p>}</div></section>
        <section className="mt-5 rounded-2xl border border-[#dfe8dc] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">AGRIVA Jobs moderation</h2><p className="mt-1 text-sm text-[#748074]">কৃষি চাকরির পোস্ট যাচাই ও প্রকাশের জন্য</p></div><Link href="/admin/jobs" className="rounded-xl bg-[#17452c] px-4 py-2 text-sm font-bold text-white">চাকরি যাচাই করুন ↗</Link></div></section>
        <LearningCorrectionInbox />
        <footer className="py-8 text-center text-xs text-[#879187]">AGRIVA Super Admin · Protected by server-side role checks and Supabase RPC authorization.</footer>
      </div>
    </main>
  );
}
