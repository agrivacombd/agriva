import Link from "next/link";

const stats = [
  ["🌾", "Active farms", "03", "+1 this month"],
  ["🔎", "AI searches", "1,284", "+18.4%"],
  ["📰", "Saved articles", "24", "6 new"],
  ["🛒", "Marketplace", "12", "recommendations"],
];

const insights = [
  { title: "Rice crop check", text: "Review your rice field notes and recent weather before the next field visit.", tag: "Farm" },
  { title: "Search insight", text: "Users are asking more about rice leaf disease this week.", tag: "AI" },
  { title: "Content to explore", text: "New guides are available for soil health and seasonal crop planning.", tag: "Learn" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">AGRIVA<span className="text-[#b58b28]">.</span></Link>
          <nav className="flex items-center gap-5 text-sm font-semibold text-[#49614e]">
            <Link href="/dashboard" className="text-[#1f7a45]">Dashboard</Link>
            <Link href="/admin">Admin</Link>
            <button className="rounded-full bg-[#17351f] px-4 py-2 text-white">Account</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#b58b28]">AGRIVA intelligence</p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Your agriculture command center.</h1>
          <p className="mt-3 max-w-2xl text-[#5e7063]">Ask AGRIVA, monitor your farms, discover useful knowledge, and turn everyday questions into actionable insights.</p>
        </div>

        <div className="mb-8 rounded-3xl bg-[#17351f] p-6 text-white shadow-xl md:p-8">
          <p className="text-sm font-semibold text-[#b9d4bd]">AGRIVA AI</p>
          <h2 className="mt-2 text-2xl font-bold">What would you like to know today?</h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input className="min-h-14 flex-1 rounded-2xl border border-white/15 bg-white/10 px-5 outline-none placeholder:text-[#b9c9bc]" placeholder="Ask about crops, soil, weather, products..." />
            <button className="rounded-2xl bg-[#c8a64b] px-7 py-4 font-bold text-[#17351f]">Ask AGRIVA →</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#d7e4d8]">
            {['Rice disease', 'Soil health', 'Farm planning', 'Find products'].map((x) => <span key={x} className="rounded-full border border-white/15 px-3 py-2">{x}</span>)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([icon, label, value, note]) => (
            <div key={label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><span className="text-2xl">{icon}</span><span className="text-xs font-semibold text-[#6b7e70]">{note}</span></div>
              <p className="mt-5 text-sm text-[#66776a]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">AI insights</h2><span className="rounded-full bg-[#e9f4e9] px-3 py-1 text-xs font-bold text-[#1f7a45]">Live intelligence</span></div>
            <div className="mt-5 space-y-3">{insights.map((item) => <div key={item.title} className="rounded-2xl bg-[#f6f8f3] p-4"><div className="flex items-center justify-between gap-4"><h3 className="font-bold">{item.title}</h3><span className="text-xs font-bold text-[#b58b28]">{item.tag}</span></div><p className="mt-1 text-sm leading-6 text-[#657467]">{item.text}</p></div>)}</div>
          </section>
          <section className="rounded-3xl bg-[#e7f0e6] p-6"><p className="text-sm font-bold text-[#1f7a45]">Quick actions</p><div className="mt-5 grid gap-3"><button className="rounded-2xl bg-white p-4 text-left font-bold shadow-sm">＋ Add a farm</button><button className="rounded-2xl bg-white p-4 text-left font-bold shadow-sm">🌱 Add a crop</button><button className="rounded-2xl bg-white p-4 text-left font-bold shadow-sm">📰 Explore articles</button><button className="rounded-2xl bg-white p-4 text-left font-bold shadow-sm">🛒 Browse marketplace</button></div></section>
        </div>
      </section>
    </main>
  );
}
