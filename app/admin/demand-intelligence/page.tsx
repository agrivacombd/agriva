import { AdminPage as AdminPageLayout } from "@/components/admin/ui/AdminPrimitives";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata = {
  title: "Demand & RFQ Intelligence | AGRIVA Admin",
  robots: { index: false, follow: false },
};

type RequestRow = {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  district: string;
  upazila: string | null;
  status: string;
  visibility: string;
  created_at: string;
  quote_deadline: string | null;
};
type QuoteRow = { id: string; request_id: string; unit_price: number; shipping_fee: number; status: string; created_at: string };
type WholesalerRow = { user_id: string; status: string; created_at: string; verified_at: string | null };

function Metric({ label, value, note }: { label: string; value: number | null; note: string }) {
  return <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
    <p className="text-sm font-semibold text-[#68796c]">{label}</p>
    <p className="mt-3 text-3xl font-black tabular-nums text-[#173b2d]">{value === null ? "—" : new Intl.NumberFormat("en-BD").format(value)}</p>
    <p className="mt-2 text-xs text-[#829084]">{note}</p>
  </article>;
}

function Status({ value }: { value: string }) {
  const styles: Record<string, string> = {
    pending_review: "bg-amber-50 text-amber-800",
    open: "bg-emerald-50 text-emerald-800",
    closed: "bg-slate-100 text-slate-700",
    selected: "bg-sky-50 text-sky-800",
    cancelled: "bg-rose-50 text-rose-700",
    verified: "bg-emerald-50 text-emerald-800",
    pending: "bg-amber-50 text-amber-800",
    suspended: "bg-rose-50 text-rose-700",
    approved: "bg-emerald-50 text-emerald-800",
    rejected: "bg-rose-50 text-rose-700",
    withdrawn: "bg-slate-100 text-slate-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[value] ?? "bg-slate-100 text-slate-700"}`}>{value.replaceAll("_", " ")}</span>;
}

export default async function AdminDemandIntelligencePage() {
  const { supabase } = await requireAdminPage("dashboard.read");
  const [requestsResult, quotesResult, wholesalersResult] = await Promise.all([
    supabase.from("bulk_requests").select("id,product_name,quantity,unit,district,upazila,status,visibility,created_at,quote_deadline").order("created_at", { ascending: false }).limit(100),
    supabase.from("bulk_quotes").select("id,request_id,unit_price,shipping_fee,status,created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("bulk_wholesalers").select("user_id,status,created_at,verified_at").order("created_at", { ascending: false }).limit(500),
  ]);

  const requests = (requestsResult.data ?? []) as RequestRow[];
  const quotes = (quotesResult.data ?? []) as QuoteRow[];
  const wholesalers = (wholesalersResult.data ?? []) as WholesalerRow[];
  const hasErrors = Boolean(requestsResult.error || quotesResult.error || wholesalersResult.error);
  const openRequests = requests.filter((row) => row.status === "open").length;
  const pendingReview = requests.filter((row) => row.status === "pending_review").length;
  const verifiedWholesalers = wholesalers.filter((row) => row.status === "verified").length;
  const quoteByRequest = new Map<string, number>();
  for (const quote of quotes) quoteByRequest.set(quote.request_id, (quoteByRequest.get(quote.request_id) ?? 0) + 1);

  return <AdminPageLayout className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[28px] bg-[#123b2d] px-5 py-7 text-white sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[36px] border-lime-300/10" />
      <div className="relative max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[.22em] text-lime-300">AGRIVA · GROWTH INTELLIGENCE</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">Demand & RFQ Intelligence</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-50/80">ক্রেতার bulk demand, supplier quote এবং wholesaler verification—বিদ্যমান RFQ workflow-এর ওপর read-only operational view।</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/buyer-demands" className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-[#173b2d] hover:bg-lime-200">Public demand board ↗</Link>
          <Link href="/admin/command-center" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Command Center</Link>
        </div>
      </div>
    </section>

    <section className="mt-6" aria-label="Demand and supplier summary">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Open RFQs" value={requestsResult.error ? null : openRequests} note="Open among latest 100 RFQs" />
        <Metric label="Awaiting review" value={requestsResult.error ? null : pendingReview} note="Requests requiring moderation" />
        <Metric label="Quotes received" value={quotesResult.error ? null : quotes.length} note="Latest 500 quote records" />
        <Metric label="Verified wholesalers" value={wholesalersResult.error ? null : verifiedWholesalers} note="Latest 500 wholesaler records" />
      </div>
      {hasErrors && <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">এক বা একাধিক RFQ dataset পড়া যায়নি। সংশ্লিষ্ট metric-এ “—” দেখানো হয়েছে; এটিকে শূন্য মনে করবেন না। Supabase migration/RLS status যাচাই করুন।</p>}
    </section>

    <section className="mt-7 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-5" aria-labelledby="rfq-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8a968a]">Latest activity</p><h2 id="rfq-heading" className="mt-1 text-lg font-black text-[#173b2d]">Buyer RFQ pipeline</h2></div>
        <span className="text-xs text-[#829084]">Latest 100 requests · read-only</span>
      </div>
      {!requests.length ? <p className="mt-5 rounded-xl bg-[#f7faf5] p-5 text-sm text-[#68796c]">{requestsResult.error ? "RFQ data is unavailable for this admin session." : "এখনো কোনো bulk request নেই।"}</p> :
        <div role="region" aria-label="Buyer RFQ pipeline table, horizontally scrollable" tabIndex={0} className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-[#e7ede4] text-xs text-[#829084]"><th className="px-3 py-3 font-bold">Product / quantity</th><th className="px-3 py-3 font-bold">Location</th><th className="px-3 py-3 font-bold">Status</th><th className="px-3 py-3 font-bold">Quotes</th><th className="px-3 py-3 font-bold">Created</th></tr></thead>
            <tbody>{requests.map((request) => <tr key={request.id} className="border-b border-[#f0f3ee] last:border-0">
              <td className="px-3 py-3"><p className="font-bold text-[#173b2d]">{request.product_name}</p><p className="mt-1 text-xs text-[#829084]">{new Intl.NumberFormat("en-BD").format(request.quantity)} {request.unit} · {request.visibility}</p></td>
              <td className="px-3 py-3 text-[#53675a]">{request.upazila ? request.upazila + ", " : ""}{request.district}</td>
              <td className="px-3 py-3"><Status value={request.status}/></td>
              <td className="px-3 py-3 font-bold tabular-nums text-[#315840]">{quoteByRequest.get(request.id) ?? 0}</td>
              <td className="px-3 py-3 text-xs text-[#829084]">{new Date(request.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}</td>
            </tr>)}</tbody>
          </table>
        </div>}
    </section>

    <section className="mt-5 grid gap-4 xl:grid-cols-2">
      <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <h2 className="font-black text-[#173b2d]">Quote pipeline</h2><p className="mt-1 text-xs text-[#829084]">Latest 500 quotes, grouped by workflow status</p>
        <div className="mt-4 flex flex-wrap gap-2">{["pending","approved","rejected","withdrawn"].map((status) => <div key={status} className="rounded-xl bg-[#f7faf5] px-3 py-2"><p className="text-[11px] font-semibold capitalize text-[#829084]">{status}</p><p className="mt-1 text-xl font-black tabular-nums text-[#173b2d]">{quotesResult.error ? "—" : quotes.filter((quote) => quote.status === status).length}</p></div>)}</div>
      </article>
      <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <h2 className="font-black text-[#173b2d]">Wholesaler onboarding</h2><p className="mt-1 text-xs text-[#829084]">Latest 500 supplier verification records</p>
        <div className="mt-4 flex flex-wrap gap-2">{["pending","verified","suspended"].map((status) => <div key={status} className="rounded-xl bg-[#f7faf5] px-3 py-2"><p className="text-[11px] font-semibold capitalize text-[#829084]">{status}</p><p className="mt-1 text-xl font-black tabular-nums text-[#173b2d]">{wholesalersResult.error ? "—" : wholesalers.filter((row) => row.status === status).length}</p></div>)}</div>
      </article>
    </section>
    <p className="mt-6 border-t border-[#e2e9df] pt-4 text-xs leading-5 text-[#829084]">Read-only analytics · No buyer phone numbers, private contact details or quote moderation actions are exposed here. Counts are bounded to the latest 500 quotes/wholesalers and latest 100 RFQs.</p>
  </AdminPageLayout>;
}
