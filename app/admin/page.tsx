import Link from "next/link";

const demand = [
  { query: "ধানের পাতায় বাদামী দাগ", searches: 184, growth: "+42%", status: "Content gap" },
  { query: "টমেটোর পোকা", searches: 96, growth: "+27%", status: "Article opportunity" },
  { query: "জৈব সার", searches: 81, growth: "+19%", status: "Product opportunity" },
  { query: "ধানের রোগের ওষুধ", searches: 64, growth: "+14%", status: "Product review" },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div><Link href="/" className="text-2xl font-black">AGRIVA<span className="text-[#b58b28]">.</span></Link><span className="ml-3 rounded-full bg-[#17351f] px-3 py-1 text-xs font-bold text-white">ADMIN AI</span></div>
          <Link href="/dashboard" className="text-sm font-bold text-[#1f7a45]">← User dashboard</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b58b28]">AI Command Center</p>
        <h1 className="mt-2 text-4xl font-black">Demand intelligence</h1>
        <p className="mt-3 max-w-2xl text-[#617064]">Monitor what users are searching for, detect content gaps, and identify product opportunities. This screen is ready to connect to real search analytics.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['48,920','Searches / 30d'],['72%','No-result rate'],['31','Content gaps'],['18','Product signals']].map(([v,l]) => <div key={l} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"><p className="text-3xl font-black">{v}</p><p className="mt-2 text-sm text-[#657467]">{l}</p></div>)}
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col justify-between gap-3 border-b border-black/5 p-6 md:flex-row md:items-center"><div><h2 className="text-xl font-bold">Search opportunities</h2><p className="mt-1 text-sm text-[#68786b]">Aggregated user queries → AI intent → action opportunity</p></div><button className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">Export insights</button></div>
          <div className="divide-y divide-black/5">{demand.map((row) => <div key={row.query} className="grid gap-3 p-5 md:grid-cols-[1.7fr_.5fr_.5fr_1fr_auto] md:items-center"><div><p className="font-bold">{row.query}</p><p className="mt-1 text-xs text-[#78867b]">Detected from aggregated search activity</p></div><span className="text-sm font-semibold">{row.searches}</span><span className="text-sm font-bold text-[#1f7a45]">{row.growth}</span><span className="w-fit rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold text-[#346843]">{row.status}</span><button className="rounded-xl border border-[#dbe3db] px-3 py-2 text-xs font-bold">Review</button></div>)}</div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[['✍️','AI Content Studio','Turn high-demand topics into article outlines, FAQs and SEO drafts.'],['🛒','Product Opportunities','Find search clusters where users show product intent.'],['🔔','Alert Rules','Set thresholds for search growth, no-result rate and demand signals.']].map(([icon,title,text]) => <div key={title} className="rounded-3xl bg-[#e7f0e6] p-6"><span className="text-3xl">{icon}</span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#617064]">{text}</p><button className="mt-5 text-sm font-bold text-[#1f7a45]">Open module →</button></div>)}
        </div>
      </section>
    </main>
  );
}
