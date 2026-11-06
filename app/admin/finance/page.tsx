import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkAdminPermission } from "@/lib/admin/permission-service";

type Payout = {
  id: string;
  reseller_id: string;
  amount: number | string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
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
      .select("id,reseller_id,amount,status,payment_method,payment_reference,requested_at,approved_at,paid_at")
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

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Finance operations</p><h1 className="mt-2 text-2xl font-black">কমিশন ও পেআউট</h1><p className="mt-1 text-sm text-emerald-100">আর্থিক কার্যক্রমের queue, settlement status ও reconciliation overview</p></div>
        <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">← Admin dashboard</Link>
      </header>

      {hasError ? <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Finance data সম্পূর্ণভাবে লোড হয়নি। কোনো financial action করবেন না; database access ও query error যাচাই করুন।</div> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Pending commissions · latest 100</p><p className="mt-2 text-2xl font-black">{taka(pendingCommissionTotal)}</p><p className="mt-1 text-xs text-[#879187]">{commissions.filter((item) => item.status === "pending").length} pending entries</p></article>
        <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Payout approval queue</p><p className="mt-2 text-2xl font-black">{taka(requestedPayoutTotal)}</p><p className="mt-1 text-xs text-[#879187]">{payouts.filter((item) => item.status === "requested").length} requests</p></article>
        <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Approved · awaiting payment</p><p className="mt-2 text-2xl font-black">{taka(approvedPayoutTotal)}</p><p className="mt-1 text-xs text-[#879187]">{payouts.filter((item) => item.status === "approved").length} payouts</p></article>
        <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Paid payouts · latest 100</p><p className="mt-2 text-2xl font-black">{taka(paidPayoutTotal)}</p><p className="mt-1 text-xs text-[#879187]">{payouts.filter((item) => item.status === "paid").length} completed payouts</p></article>
      </section>

      <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-black">Payout queue</h2><p className="mt-1 text-sm text-[#718072]">সর্বশেষ ১০০টি payout request; status অনুযায়ী সাজানো</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">Read-only · Finance</span></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs text-[#6d7b6e]"><tr><th className="px-3 py-3">Reseller ID</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Method</th><th className="px-3 py-3">Requested</th><th className="px-3 py-3">Approved / paid</th></tr></thead><tbody>{payouts.map((payout) => <tr key={payout.id} className="border-t border-[#edf1ea]"><td className="px-3 py-3 font-mono text-xs">{payout.reseller_id.slice(0, 8)}…</td><td className="px-3 py-3 font-bold">{taka(payout.amount)}</td><td className="px-3 py-3"><span className="rounded-lg bg-[#f3f7f1] px-2 py-1 text-xs font-semibold">{statusLabel[payout.status] ?? payout.status}</span></td><td className="px-3 py-3">{payout.payment_method ?? "—"}</td><td className="px-3 py-3">{date(payout.requested_at)}</td><td className="px-3 py-3">{date(payout.paid_at ?? payout.approved_at)}</td></tr>)}</tbody></table>{!hasError && payouts.length === 0 ? <p className="p-5 text-sm text-[#718072]">এখনো কোনো payout request নেই।</p> : null}</div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5">
        <h2 className="text-xl font-black">Commission ledger</h2><p className="mt-1 text-sm text-[#718072]">সর্বশেষ ১০০টি commission record; paid amount ও outstanding amount দেখুন</p>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs text-[#6d7b6e]"><tr><th className="px-3 py-3">Reseller ID</th><th className="px-3 py-3">Order ID</th><th className="px-3 py-3">Commission</th><th className="px-3 py-3">Paid</th><th className="px-3 py-3">Outstanding</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th></tr></thead><tbody>{commissions.map((item) => <tr key={item.id} className="border-t border-[#edf1ea]"><td className="px-3 py-3 font-mono text-xs">{item.reseller_id.slice(0, 8)}…</td><td className="px-3 py-3 font-mono text-xs">{item.order_id.slice(0, 8)}…</td><td className="px-3 py-3 font-semibold">{taka(item.amount)}</td><td className="px-3 py-3">{taka(item.paid_amount)}</td><td className="px-3 py-3 font-semibold">{taka(Math.max(0, Number(item.amount) - Number(item.paid_amount)))}</td><td className="px-3 py-3">{statusLabel[item.status] ?? item.status}</td><td className="px-3 py-3">{date(item.created_at)}</td></tr>)}</tbody></table>{!hasError && commissions.length === 0 ? <p className="p-5 text-sm text-[#718072]">এখনো কোনো commission record নেই।</p> : null}</div>
      </section>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Financial safety:</strong> এই ধাপটি read-only। Payout approval, payment completion ও commission settlement-এর action আলাদা capability এবং audited database workflow দিয়ে চালু করতে হবে। রিপোর্টের summary সর্বশেষ ১০০টি record থেকে হিসাব করা—এটি পূর্ণ ledger balance বা bank reconciliation নয়।</div>
    </div>
  </main>;
}
