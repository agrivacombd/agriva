import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";
import { checkAdminPermission, type AdminCapability as DelegatedAdminCapability } from "@/lib/admin/permission-service";
import LearningCorrectionInbox from "@/components/admin/LearningCorrectionInbox";

async function requireAdmin(capability: AdminCapability = "dashboard.read") {
  const { supabase, user } = await requireAdminPage(capability);
  return { supabase, user };
}

async function requireFinanceAdmin(capability: Extract<DelegatedAdminCapability, "commissions.approve" | "payouts.approve" | "payouts.complete">) {
  const permission = await checkAdminPermission(capability);
  if (!permission.allowed) {
    if (permission.reason === "unauthenticated") redirect("/login");
    redirect("/dashboard?notice=forbidden");
  }
  const { supabase } = await requireAdminPage("dashboard.read");
  return supabase;
}

async function updateOrderStatus(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!orderId || !["processing", "shipped", "delivered", "completed", "cancelled", "refunded"].includes(status)) {
    redirect("/admin?notice=invalid_order");
  }
  const { supabase } = await requireAdmin("orders.transition");
  const { error } = await supabase.rpc("set_marketplace_order_status", { p_order_id: orderId, p_status: status });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=order_error" : "/admin?notice=order_updated");
}

async function approveCommission(formData: FormData) {
  "use server";
  const commissionId = String(formData.get("commissionId") ?? "");
  if (!commissionId) redirect("/admin?notice=invalid_commission");
  const supabase = await requireFinanceAdmin("commissions.approve");
  const { error } = await supabase.rpc("approve_reseller_commission", { p_commission_id: commissionId });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=commission_error" : "/admin?notice=commission_approved");
}

async function approvePayout(formData: FormData) {
  "use server";
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) redirect("/admin?notice=invalid_payout");
  const supabase = await requireFinanceAdmin("payouts.approve");
  const { error } = await supabase.rpc("approve_commission_payout", { p_payout_id: payoutId });
  revalidatePath("/admin");
  redirect(error ? "/admin?notice=payout_error" : "/admin?notice=payout_approved");
}

async function completePayout(formData: FormData) {
  "use server";
  const payoutId = String(formData.get("payoutId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  if (!payoutId || !reference) redirect("/admin?notice=invalid_payout");
  const supabase = await requireFinanceAdmin("payouts.complete");
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

const quickActions = [
  ["/admin/products", "পণ্য ব্যবস্থাপনা"],
  ["/admin/green-exchange", "Green Exchange মডারেশন"],
  ["/admin/harvest", "ফসলের পোস্ট"],
  ["/admin/transport", "পরিবহন পার্টনার যাচাই"],
  ["/admin/users", "ব্যবহারকারী"],
  ["/admin/categories", "ক্যাটাগরি"],
  ["/admin/settings", "সাইট সেটিংস"],
  ["/admin/reports", "রিপোর্ট ও CSV"],
  ["/admin/audit", "Audit log"],
  ["/admin/access-control", "Admin access"],
  ["/admin/finance", "Finance operations"],
  ["/admin/opportunities", "AI demand"],
  ["/orders", "অর্ডার পেজ"],
];

const orderStatuses = ["processing", "shipped", "delivered", "completed", "cancelled", "refunded"];

export default async function AdminPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const { supabase, user } = await requireAdmin();
  const [commissionApproval, payoutApproval, payoutCompletion] = await Promise.all([
    checkAdminPermission("commissions.approve"),
    checkAdminPermission("payouts.approve"),
    checkAdminPermission("payouts.complete"),
  ]);
  const canApproveCommission = commissionApproval.allowed;
  const canApprovePayout = payoutApproval.allowed;
  const canCompletePayout = payoutCompletion.allowed;

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
    ["মোট ব্যবহারকারী", profilesCount.error ? "—" : profilesCount.count ?? 0, "USERS"],
    ["কৃষক", farmersCount.error ? "—" : farmersCount.count ?? 0, "FARMERS"],
    ["রিসেলার", resellersCount.error ? "—" : resellersCount.count ?? 0, "RESELLERS"],
    ["পণ্য", productsCount.error ? "—" : productsCount.count ?? 0, "PRODUCTS"],
    ["মোট অর্ডার", ordersCount.error ? "—" : ordersCount.count ?? 0, "ORDERS"],
    ["রিভিউ প্রয়োজন", orderTotals.error ? "—" : pendingOrders, "ACTION"],
    ["কমিশন রেকর্ড", commissionsCount.error ? "—" : commissionsCount.count ?? 0, "COMMISSIONS"],
    ["পেআউট রেকর্ড", payoutsCount.error ? "—" : payoutsCount.count ?? 0, "PAYOUTS"],
  ];
  const hasDashboardQueryError = [
    profilesCount, farmersCount, resellersCount, productsCount, ordersCount,
    commissionsCount, payoutsCount, orderTotals, recentOrders, recentCommissions,
    recentPayouts, opportunities,
  ].some((result) => Boolean(result.error));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a47b20]">Platform overview</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#173b2d] sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#637266]">ব্যবহারকারী, পণ্য, অর্ডার, রিসেলার কমিশন ও পেআউট—এক জায়গা থেকে পর্যবেক্ষণ করুন।</p>
        </div>
        <div className="min-w-0 rounded-xl border border-[#dce7d8] bg-white px-4 py-3 text-sm shadow-sm sm:max-w-[280px]">
          <span className="text-xs text-[#758277]">Signed in as</span>
          <p className="mt-1 truncate font-bold text-[#173b2d]">{user.email ?? user.id}</p>
        </div>
      </div>

      {searchParams?.notice && <div role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${searchParams.notice.endsWith("_error") || searchParams.notice.startsWith("invalid") ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{noticeText[searchParams.notice] ?? "অপারেশন সম্পন্ন হয়েছে।"}</div>}
      {hasDashboardQueryError && <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">কিছু dashboard data লোড করা যায়নি। যেসব metric-এ “—” দেখাচ্ছে সেগুলোকে শূন্য ধরে নেবেন না। Database permissions বা query error যাচাই করে আবার চেষ্টা করুন।</div>}

      <section aria-label="Platform metrics" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-8">
        {cards.map(([label, value, tag]) => (
          <article key={String(label)} className="min-w-0 rounded-2xl border border-[#e1e9de] bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold leading-5 text-[#657467] sm:text-sm">{label}</p>
              <span className="hidden shrink-0 rounded-lg bg-[#eaf3e8] px-2 py-1 text-[9px] font-black tracking-wide text-[#267044] sm:inline-flex">{tag}</span>
            </div>
            <p className="mt-3 break-words text-2xl font-black tabular-nums text-[#173b2d] sm:mt-4 sm:text-3xl">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]">
        <article className="min-w-0 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-bold tracking-wide text-[#6b786d]">ORDER VALUE SNAPSHOT</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-2xl font-black text-[#173b2d] sm:text-3xl">{orderTotals.error ? "ডেটা পাওয়া যায়নি" : money(revenue)}</p>
              <p className="mt-1 text-sm text-[#68786b]">Non-cancelled order value (all time)</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm sm:px-4">
              <span className="text-lg font-black text-amber-800">{orderTotals.error ? "—" : pendingOrders}</span>
              <span className="text-amber-900">অর্ডার প্রসেসিং প্রয়োজন</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#879187]">এটি অর্ডারের মোট মূল্য; এটি নিট আয় বা নিশ্চিতভাবে আদায় করা টাকা নয়।</p>
        </article>
        <article className="min-w-0 rounded-2xl border border-[#dce8d7] bg-[#eaf2e7] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black tracking-wide text-[#356748]">QUICK ACTIONS</p>
            <span className="text-xs text-[#66806a]">দ্রুত কাজ</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {quickActions.map(([href, label]) => <Link key={href} href={href} className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-[#cbdcc7] bg-white px-3 py-2.5 text-sm font-semibold text-[#244b34] transition hover:border-[#36764a] hover:bg-[#f8fbf6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36764a]"><span>{label}</span><span aria-hidden="true" className="text-[#6d8a70]">↗</span></Link>)}
          </div>
        </article>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#e7ede4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="text-lg font-black text-[#173b2d] sm:text-xl">সাম্প্রতিক অর্ডার</h2><p className="mt-1 text-xs leading-5 text-[#748074] sm:text-sm">স্ট্যাটাস আপডেট করলে stock ও কমিশনের নিয়ম ডেটাবেস RPC-তে প্রয়োগ হবে।</p></div>
          <span className="w-fit rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold text-[#356748]">{recentOrders.data?.length ?? 0} recent</span>
        </div>
        {recentOrders.error ? <p role="alert" className="p-5 text-sm text-red-800">অর্ডার লোড করা যায়নি। Database permission বা query error যাচাই করুন।</p> : !recentOrders.data?.length ? <p className="p-8 text-sm text-[#6b786d]">এখনো কোনো অর্ডার পাওয়া যায়নি।</p> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[#f7faf5] text-[11px] uppercase tracking-wide text-[#6d7b6e]"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Product / buyer</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status / update</th></tr></thead>
                <tbody>{recentOrders.data.map(order => <tr key={order.id} className="border-t border-[#edf1ea] align-top">
                  <td className="px-5 py-4"><p className="font-bold">#{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-[#7b887d]">{new Date(order.created_at).toLocaleDateString("en-GB")}</p></td>
                  <td className="px-5 py-4"><p className="font-semibold">{(order.product as {name?:string}|null)?.name ?? "Product"}</p><p className="mt-1 text-xs text-[#7b887d]">Qty: {order.quantity} · {(order.shipping_address as {fullName?:string}|null)?.fullName ?? "Buyer"}</p></td>
                  <td className="px-5 py-4 font-black">{money(order.total_amount)}</td>
                  <td className="px-5 py-4"><p className="font-semibold uppercase">{order.payment_method}</p><p className="mt-1 text-xs text-[#7b887d]">{order.payment_status}</p></td>
                  <td className="px-5 py-4"><p className="mb-2 inline-flex rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold">{order.status}</p><form action={updateOrderStatus} className="flex items-center gap-2"><input type="hidden" name="orderId" value={order.id}/><select name="status" defaultValue={order.status} aria-label={`Update order ${order.id.slice(0,8)} status`} className="min-h-9 rounded-lg border border-[#d9e3d5] bg-white px-2 py-2 text-xs"><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select><button className="min-h-9 rounded-lg bg-[#17452c] px-3 py-2 text-xs font-bold text-white hover:bg-[#22613d]">Save</button></form></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-[#edf1ea] md:hidden">
              {recentOrders.data.map(order => <article key={order.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold text-[#173b2d]">Order #{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-[#7b887d]">{new Date(order.created_at).toLocaleDateString("en-GB")}</p></div><span className="shrink-0 rounded-full bg-[#edf4e9] px-2.5 py-1 text-[11px] font-bold text-[#356748]">{order.status}</span></div>
                <div className="grid grid-cols-2 gap-3 text-sm"><div className="min-w-0"><p className="text-[11px] text-[#879187]">Product / buyer</p><p className="mt-1 break-words font-semibold">{(order.product as {name?:string}|null)?.name ?? "Product"}</p><p className="mt-0.5 text-xs text-[#7b887d]">Qty: {order.quantity} · {(order.shipping_address as {fullName?:string}|null)?.fullName ?? "Buyer"}</p></div><div><p className="text-[11px] text-[#879187]">Order amount</p><p className="mt-1 font-black">{money(order.total_amount)}</p><p className="mt-0.5 text-xs uppercase text-[#7b887d]">{order.payment_method} · {order.payment_status}</p></div></div>
                <form action={updateOrderStatus} className="flex flex-col gap-2 xs:flex-row"><input type="hidden" name="orderId" value={order.id}/><label className="sr-only" htmlFor={`order-status-${order.id}`}>Update order status</label><select id={`order-status-${order.id}`} name="status" defaultValue={order.status} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d9e3d5] bg-white px-3 text-sm">{orderStatuses.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase()+status.slice(1)}</option>)}</select><button className="min-h-11 rounded-xl bg-[#17452c] px-4 text-sm font-bold text-white hover:bg-[#22613d]">Update status</button></form>
              </article>)}
            </div>
          </>
        )}
      </section>

      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
          <div className="border-b border-[#e7ede4] px-4 py-4 sm:px-5"><h2 className="text-lg font-black text-[#173b2d] sm:text-xl">রিসেলার কমিশন</h2><p className="mt-1 text-xs text-[#748074] sm:text-sm">Pending commission approve করুন</p></div>
          <div className="divide-y divide-[#edf1ea]">{(recentCommissions.data ?? []).map(c => <div key={c.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><p className="font-bold">{money(c.amount)} <span className="ml-2 inline-flex rounded-full bg-[#f3f5f1] px-2 py-1 text-xs font-medium">{c.status}</span></p><p className="mt-1 break-words text-xs text-[#7b887d]">Order #{c.order_id.slice(0,8)} · Reseller #{c.reseller_id.slice(0,8)}</p></div>{c.status === "pending" && canApproveCommission && <form action={approveCommission}><input type="hidden" name="commissionId" value={c.id}/><button className="min-h-10 w-full rounded-xl bg-[#17452c] px-4 py-2 text-xs font-bold text-white sm:w-auto">Approve commission</button></form>}</div>)}{recentCommissions.error ? <p role="alert" className="p-5 text-sm text-red-800">কমিশন রেকর্ড লোড করা যায়নি।</p> : !recentCommissions.data?.length && <p className="p-6 text-sm text-[#6b786d]">কমিশন রেকর্ড নেই।</p>}</div>
          {pendingCommissions.length > 0 && <p className="border-t border-[#edf1ea] px-4 py-3 text-xs text-[#748074]">{pendingCommissions.length} pending in latest records</p>}
        </article>

        <article className="min-w-0 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
          <div className="border-b border-[#e7ede4] px-4 py-4 sm:px-5"><h2 className="text-lg font-black text-[#173b2d] sm:text-xl">রিসেলার পেআউট</h2><p className="mt-1 text-xs text-[#748074] sm:text-sm">Approve এবং পেমেন্ট রেফারেন্সসহ paid mark করুন</p></div>
          <div className="divide-y divide-[#edf1ea]">{(recentPayouts.data ?? []).map(p => <div key={p.id} className="space-y-3 px-4 py-4 sm:px-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-bold">{money(p.amount)} <span className="ml-2 inline-flex rounded-full bg-[#f3f5f1] px-2 py-1 text-xs font-medium">{p.status}</span></p><p className="mt-1 break-words text-xs text-[#7b887d]">Reseller #{p.reseller_id.slice(0,8)} · {p.payment_method ?? "Method not set"}</p></div>{p.status === "requested" && canApprovePayout && <form action={approvePayout}><input type="hidden" name="payoutId" value={p.id}/><button className="min-h-10 w-full rounded-xl border border-[#d9e3d5] px-4 py-2 text-xs font-bold sm:w-auto">Approve payout</button></form>}</div>{p.status === "approved" && canCompletePayout && <form action={completePayout} className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="payoutId" value={p.id}/><input name="reference" defaultValue={p.payment_reference ?? ""} required aria-label="Payment transaction reference" placeholder="Payment transaction/reference" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d9e3d5] px-3 py-2 text-sm"/><button className="min-h-11 rounded-xl bg-[#17452c] px-4 py-2 text-xs font-bold text-white">Mark paid</button></form>}</div>)}{recentPayouts.error ? <p role="alert" className="p-5 text-sm text-red-800">পেআউট রেকর্ড লোড করা যায়নি।</p> : !recentPayouts.data?.length && <p className="p-6 text-sm text-[#6b786d]">পেআউট অনুরোধ নেই।</p>}</div>
          {pendingPayouts.length > 0 && <p className="border-t border-[#edf1ea] px-4 py-3 text-xs text-[#748074]">{pendingPayouts.length} pending in latest records</p>}
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-[#173b2d] sm:text-xl">AI Search Opportunities</h2><p className="mt-1 text-xs text-[#748074] sm:text-sm">জনপ্রিয় search demand থেকে product ও content আইডিয়া</p></div><Link href="/admin/opportunities" className="inline-flex min-h-10 w-fit items-center rounded-xl border border-[#d9e3d5] px-4 py-2 text-sm font-bold">সব দেখুন ↗</Link></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{(opportunities.data ?? []).map(item=><article key={item.id} className="min-w-0 rounded-xl bg-[#f7faf5] p-4"><p className="break-words font-bold">{item.keyword}</p><p className="mt-2 text-xs text-[#748074]">{item.search_count} searches · {item.opportunity_type}</p><p className="mt-1 text-xs font-semibold text-[#39724a]">{item.status}</p></article>)}{opportunities.error ? <p role="alert" className="text-sm text-red-800">Search opportunity data লোড করা যায়নি।</p> : !opportunities.data?.length && <p className="text-sm text-[#748074]">এখনো search signal নেই।</p>}</div>
      </section>

      <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="text-lg font-black text-[#173b2d]">AGRIVA Jobs moderation</h2><p className="mt-1 text-xs text-[#748074] sm:text-sm">কৃষি চাকরির পোস্ট যাচাই ও প্রকাশের জন্য</p></div><Link href="/admin/jobs" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#17452c] px-4 py-2 text-sm font-bold text-white">চাকরি যাচাই করুন ↗</Link></section>
      <div className="mt-5"><LearningCorrectionInbox /></div>
      <footer className="py-8 text-center text-xs text-[#879187]">AGRIVA Admin · Protected by server-side role checks and Supabase RPC authorization.</footer>
    </main>
  );
}
