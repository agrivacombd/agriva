import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPage as AdminPageLayout,
  AdminPageHeader,
  AdminPanel,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminTableFrame,
} from "@/components/admin/ui/AdminPrimitives";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkAdminPermission } from "@/lib/admin/permission-service";

type Payout = {
  id: string;
  reseller_id: string;
  amount: number | string;
  status: string;
  payment_method: string | null;
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
};

type Commission = {
  id: string;
  reseller_id: string;
  order_id: string;
  amount: number | string;
  paid_amount: number | string;
  status: string;
  created_at: string;
};

const taka = (value: number | string) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(Number(value) || 0);
const date = (value: string | null) => value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const statusLabel: Record<string, string> = {
  requested: "অনুমোদনের অপেক্ষায়",
  approved: "পেমেন্টের অপেক্ষায়",
  paid: "পরিশোধিত",
  pending: "অনুমোদনের অপেক্ষায়",
};

export default async function AdminFinancePage() {
  const access = await checkAdminPermission("payments.read");
  if (!access.allowed) {
    if (access.reason === "unauthenticated") redirect("/login");
    redirect("/dashboard?notice=forbidden");
  }

  const supabase = await createSupabaseServerClient();
  const [payoutResult, commissionResult] = await Promise.all([
    supabase.from("commission_payouts")
      .select("id,reseller_id,amount,status,payment_method,requested_at,approved_at,paid_at")
      .order("requested_at", { ascending: false }).limit(100),
    supabase.from("reseller_commissions")
      .select("id,reseller_id,order_id,amount,paid_amount,status,created_at")
      .order("created_at", { ascending: false }).limit(100),
  ]);

  const payouts = (payoutResult.data ?? []) as Payout[];
  const commissions = (commissionResult.data ?? []) as Commission[];
  const pendingCommissionTotal = commissions.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.amount), 0);
  const requestedPayoutTotal = payouts.filter((item) => item.status === "requested").reduce((sum, item) => sum + Number(item.amount), 0);
  const approvedPayoutTotal = payouts.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.amount), 0);
  const paidPayoutTotal = payouts.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount), 0);
  const hasError = Boolean(payoutResult.error || commissionResult.error);

  return <AdminPageLayout className="mx-auto w-full max-w-7xl p-4 sm:p-6">
    <AdminPageHeader
      eyebrow="Finance operations"
      title="কমিশন ও পেআউট"
      description="আর্থিক কার্যক্রমের queue, settlement status ও reconciliation overview"
    />
    {hasError ? <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Finance data সম্পূর্ণভাবে লোড হয়নি। কোনো financial action করবেন না; database access ও query error যাচাই করুন।</div> : null}

    <section aria-label="Finance summary" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label="Pending commissions · latest 100" value={hasError ? "—" : taka(pendingCommissionTotal)} hint={hasError ? "ডেটা অনুপলব্ধ" : `${commissions.filter((item) => item.status === "pending").length} pending entries`}/>
      <AdminMetricCard label="Payout approval queue" value={hasError ? "—" : taka(requestedPayoutTotal)} hint={hasError ? "ডেটা অনুপলব্ধ" : `${payouts.filter((item) => item.status === "requested").length} requests`}/>
      <AdminMetricCard label="Approved · awaiting payment" value={hasError ? "—" : taka(approvedPayoutTotal)} hint={hasError ? "ডেটা অনুপলব্ধ" : `${payouts.filter((item) => item.status === "approved").length} payouts`}/>
      <AdminMetricCard label="Paid payouts · latest 100" value={hasError ? "—" : taka(paidPayoutTotal)} hint={hasError ? "ডেটা অনুপলব্ধ" : `${payouts.filter((item) => item.status === "paid").length} completed payouts`}/>
    </section>

    <AdminPanel className="mt-6">
      <AdminSectionHeader
        title="Payout queue"
        description="সর্বশেষ ১০০টি payout request; status অনুযায়ী সাজানো"
        action={<AdminStatusBadge tone="neutral">Read-only · Finance</AdminStatusBadge>}
      />
      {payouts.length ? <AdminTableFrame>
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead><tr><th className="px-3 py-3">Reseller ID</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Method</th><th className="px-3 py-3">Requested</th><th className="px-3 py-3">Approved / paid</th></tr></thead>
          <tbody>{payouts.map((payout) => <tr key={payout.id} className="border-t border-[var(--admin-border)]">
            <td className="px-3 py-3 font-mono text-xs">{payout.reseller_id.slice(0, 8)}…</td><td className="px-3 py-3 font-bold tabular-nums">{taka(payout.amount)}</td>
            <td className="px-3 py-3"><AdminStatusBadge tone={payout.status === "paid" ? "success" : payout.status === "requested" ? "warning" : "neutral"}>{statusLabel[payout.status] ?? payout.status}</AdminStatusBadge></td>
            <td className="px-3 py-3">{payout.payment_method ?? "—"}</td><td className="px-3 py-3">{date(payout.requested_at)}</td><td className="px-3 py-3">{date(payout.paid_at ?? payout.approved_at)}</td>
          </tr>)}</tbody>
        </table>
      </AdminTableFrame> : !hasError ? <AdminEmptyState title="কোনো payout request নেই" description="নতুন payout request এলে এখানে দেখা যাবে।"/> : null}
    </AdminPanel>

    <AdminPanel className="mt-6">
      <AdminSectionHeader title="Commission ledger" description="সর্বশেষ ১০০টি commission record; paid amount ও outstanding amount দেখুন"/>
      {commissions.length ? <AdminTableFrame>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead><tr><th className="px-3 py-3">Reseller ID</th><th className="px-3 py-3">Order ID</th><th className="px-3 py-3">Commission</th><th className="px-3 py-3">Paid</th><th className="px-3 py-3">Outstanding</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th></tr></thead>
          <tbody>{commissions.map((item) => <tr key={item.id} className="border-t border-[var(--admin-border)]">
            <td className="px-3 py-3 font-mono text-xs">{item.reseller_id.slice(0, 8)}…</td><td className="px-3 py-3 font-mono text-xs">{item.order_id.slice(0, 8)}…</td>
            <td className="px-3 py-3 font-semibold tabular-nums">{taka(item.amount)}</td><td className="px-3 py-3 tabular-nums">{taka(item.paid_amount)}</td>
            <td className="px-3 py-3 font-semibold tabular-nums">{taka(Math.max(0, Number(item.amount) - Number(item.paid_amount)))}</td>
            <td className="px-3 py-3"><AdminStatusBadge tone={item.status === "paid" ? "success" : item.status === "pending" ? "warning" : "neutral"}>{statusLabel[item.status] ?? item.status}</AdminStatusBadge></td><td className="px-3 py-3">{date(item.created_at)}</td>
          </tr>)}</tbody>
        </table>
      </AdminTableFrame> : !hasError ? <AdminEmptyState title="কোনো commission record নেই" description="নতুন commission তৈরি হলে ledger-এ দেখা যাবে।"/> : null}
    </AdminPanel>

    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Financial safety:</strong> এই ধাপটি read-only। Payout approval, payment completion ও commission settlement-এর action আলাদা capability এবং audited database workflow দিয়ে চালু করতে হবে। রিপোর্টের summary সর্বশেষ ১০০টি record থেকে হিসাব করা—এটি পূর্ণ ledger balance বা bank reconciliation নয়।</div>
  </AdminPageLayout>;
}
