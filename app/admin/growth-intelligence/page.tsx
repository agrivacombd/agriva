import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata = {
  title: "Growth Intelligence | AGRIVA Admin",
  robots: { index: false, follow: false },
};

type CountResult = { count: number | null; error: unknown };
type MonthMetric = { label: string; signups: number | null; orders: number | null; orderEvents: number | null };

function Metric({ label, result, note }: { label: string; result: CountResult; note: string }) {
  const unavailable = Boolean(result.error) || result.count === null;
  return <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
    <p className="text-sm font-semibold text-[#68796c]">{label}</p>
    <p className="mt-3 text-3xl font-black tabular-nums text-[#173b2d]">{unavailable ? "—" : new Intl.NumberFormat("en-BD").format(result.count!)}</p>
    <p className="mt-2 text-xs text-[#829084]">{unavailable ? "ডেটা যাচাই প্রয়োজন" : note}</p>
  </article>;
}

function TrendBar({ label, value, max, unavailable }: { label: string; value: number | null; max: number; unavailable: boolean }) {
  const width = value === null || max <= 0 ? 0 : Math.max(2, Math.round((value / max) * 100));
  return <div className="grid grid-cols-[minmax(5.5rem,1fr)_minmax(4rem,2fr)_3.5rem] items-center gap-3">
    <span className="truncate text-xs font-semibold text-[#53675a]">{label}</span>
    <div className="h-2 overflow-hidden rounded-full bg-[#edf2e9]" role="img" aria-label={unavailable ? label + ": unavailable" : label + ": " + value}>
      <div className="h-full rounded-full bg-[#4d8a57]" style={{ width: width + "%" }} />
    </div>
    <span className="text-right text-xs font-bold tabular-nums text-[#173b2d]">{unavailable || value === null ? "—" : new Intl.NumberFormat("en-BD").format(value)}</span>
  </div>;
}

export default async function AdminGrowthIntelligencePage() {
  const { supabase } = await requireAdminPage("dashboard.read");
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [signups30, orders30, orderEvents30, attribution30] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since30),
    supabase.from("marketplace_orders").select("id", { count: "exact", head: true }).gte("created_at", since30),
    supabase.from("order_events").select("id", { count: "exact", head: true }).gte("created_at", since30),
    supabase.from("attribution_sessions").select("id", { count: "exact", head: true }).gte("created_at", since30),
  ]);

  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: start.toLocaleDateString("en-BD", { month: "short", year: "numeric", timeZone: "UTC" }),
    };
  });

  const trend: MonthMetric[] = await Promise.all(months.map(async (month) => {
    const [signups, orders, events] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", month.start).lt("created_at", month.end),
      supabase.from("marketplace_orders").select("id", { count: "exact", head: true }).gte("created_at", month.start).lt("created_at", month.end),
      supabase.from("order_events").select("id", { count: "exact", head: true }).gte("created_at", month.start).lt("created_at", month.end),
    ]);
    return {
      label: month.label,
      signups: signups.error ? null : signups.count,
      orders: orders.error ? null : orders.count,
      orderEvents: events.error ? null : events.count,
    };
  }));

  const summary = [signups30, orders30, orderEvents30, attribution30];
  const hasSummaryErrors = summary.some((result) => Boolean(result.error));
  const hasTrendErrors = trend.some((month) => month.signups === null || month.orders === null || month.orderEvents === null);
  const maxSignups = Math.max(0, ...trend.map((month) => month.signups ?? 0));
  const maxOrders = Math.max(0, ...trend.map((month) => month.orders ?? 0));
  const maxEvents = Math.max(0, ...trend.map((month) => month.orderEvents ?? 0));

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[28px] bg-[#123b2d] px-5 py-7 text-white shadow-sm sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[36px] border-lime-300/10" />
      <div className="relative max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[.22em] text-lime-300">AGRIVA · ADMIN 2.0 · PHASE 2</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">Growth & Engagement Intelligence</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-50/80">নতুন account, marketplace activity, order lifecycle এবং referral attribution—বিদ্যমান অনুমোদিত data থেকে তৈরি read-only growth overview।</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/demand-intelligence" className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-[#173b2d] hover:bg-lime-200">Demand & RFQ ↗</Link>
          <Link href="/admin/orders" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Order operations</Link>
        </div>
      </div>
    </section>

    <section className="mt-6" aria-label="Last 30 day growth metrics">
      <div className="mb-3"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8a968a]">Last 30 days · live database counts</p><h2 className="mt-1 text-lg font-black text-[#173b2d]">Growth signals</h2></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="New accounts" result={signups30} note="New profile records" />
        <Metric label="Marketplace orders" result={orders30} note="Orders created in this period" />
        <Metric label="Order lifecycle events" result={orderEvents30} note="Workflow events recorded" />
        <Metric label="Referral sessions" result={attribution30} note="Attribution sessions created" />
      </div>
      {hasSummaryErrors && <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">এক বা একাধিক growth metric পড়া যায়নি। “—” ডেটা অনুপলব্ধ বোঝায়, শূন্য নয়। Admin RLS ও data availability যাচাই করুন।</p>}
    </section>

    <section className="mt-6 grid gap-4 xl:grid-cols-3" aria-label="Monthly growth trends">
      {([
        { key: "signups", title: "Account acquisition", description: "New profiles by calendar month", max: maxSignups },
        { key: "orders", title: "Marketplace activity", description: "Orders created by calendar month", max: maxOrders },
        { key: "orderEvents", title: "Engagement signals", description: "Order lifecycle events by month", max: maxEvents },
      ] as const).map((series) => <article key={series.key} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <h2 className="font-black text-[#173b2d]">{series.title}</h2>
        <p className="mt-1 text-xs text-[#829084]">{series.description}</p>
        <div className="mt-5 space-y-4">
          {trend.map((month) => {
            const value = month[series.key];
            return <TrendBar key={month.label} label={month.label} value={value} max={series.max} unavailable={value === null} />;
          })}
        </div>
      </article>)}
    </section>
    {hasTrendErrors && <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">কিছু মাসের trend data অনুপলব্ধ। সংশ্লিষ্ট মান “—” হিসেবে দেখানো হয়েছে।</p>}

    <section className="mt-6 grid gap-4 xl:grid-cols-2">
      <article className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8a968a]">Existing capability</p>
        <h2 className="mt-2 font-black text-[#173b2d]">Admin order notifications</h2>
        <p className="mt-2 text-sm leading-6 text-[#53675a]">AdminShell-এর notification bell authenticated recent-order feed ৩০ সেকেন্ড পরপর refresh করে। এটি admin operational alert—customer marketing push নয়।</p>
        <Link href="/admin/orders" className="mt-4 inline-flex rounded-xl border border-[#dfe8dc] bg-[#f7faf5] px-3 py-2 text-xs font-bold text-[#315840] hover:bg-[#edf5e9]">Open order queue ↗</Link>
      </article>
      <article className="rounded-2xl border border-amber-200 bg-[#fffdf6] p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-800">Measurement gaps</p>
        <h2 className="mt-2 font-black text-[#173b2d]">What is not measured yet</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#53675a]">
          <li>Durable user-session and app-activity events are not available for reliable DAU/MAU or retention cohorts.</li>
          <li>Push subscription, delivery and open telemetry is not available to verify customer push performance.</li>
          <li>Referral session counts are attribution records, not unique visitors or verified conversions.</li>
        </ul>
      </article>
    </section>

    <p className="mt-6 border-t border-[#e2e9df] pt-4 text-xs leading-5 text-[#829084]">Read-only analytics · Monthly values use exact database counts for calendar months · No visitor tokens, phone numbers, order addresses or user-level activity are exposed.</p>
  </main>;
}
