import Link from "next/link";

export const metadata = { title: "Farm Intelligence | AGRIVA", description: "Manage farms, crops and agriculture intelligence with AGRIVA." };

export default function FarmsPage() {
  return <main className="min-h-screen bg-slate-50 px-6 py-16"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm font-bold text-emerald-700">← AGRIVA home</Link><div className="mt-6 rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-bold text-emerald-700">FARM INTELLIGENCE</p><h1 className="mt-2 text-4xl font-black text-slate-900">Farms & Crops</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Keep farm and crop information together and prepare this workspace for weather, crop health and production intelligence integrations.</p><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-emerald-50 p-5"><b>Farms</b><p className="mt-1 text-sm text-slate-600">Add and organize farms.</p></div><div className="rounded-2xl bg-amber-50 p-5"><b>Crops</b><p className="mt-1 text-sm text-slate-600">Track crops and growing cycles.</p></div><div className="rounded-2xl bg-sky-50 p-5"><b>Insights</b><p className="mt-1 text-sm text-slate-600">Connect weather and intelligence data.</p></div></div></div></div></main>;
}
