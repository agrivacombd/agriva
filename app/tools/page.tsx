import Link from "next/link";

export const metadata = { title: "Agriculture Tools | AGRIVA", description: "Explore practical agriculture tools from AGRIVA." };

const tools = [
  ["Crop Health", "Understand common crop health issues and next steps."],
  ["Fertilizer Guide", "Plan fertilizer decisions around crop needs."],
  ["Pest Guide", "Explore practical pest identification and management guidance."],
  ["Farm Planner", "Organize farm and crop information in one place."],
] as const;

export default function ToolsPage() {
  return <main className="min-h-screen bg-slate-50 px-6 py-16"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm font-bold text-emerald-700">← AGRIVA home</Link><h1 className="mt-6 text-4xl font-black text-slate-900">Agriculture Tools</h1><p className="mt-3 max-w-2xl text-slate-600">Practical tools for farmers and agriculture users. These tool cards are ready for individual feature integrations.</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{tools.map(([title, text]) => <article key={title} className="rounded-3xl bg-white p-6 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">✦</div><h2 className="mt-5 font-black text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><Link href="/ai" className="mt-5 inline-block text-sm font-bold text-emerald-700">Use with AGRIVA AI →</Link></article>)}</div></div></main>;
}
