import Link from "next/link";

export const metadata = { title: "AGRIVA AI", description: "AI assistance for agriculture questions and practical farm guidance." };

export default function AIPage() {
  return <main className="min-h-screen bg-slate-50 px-6 py-16"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-bold text-emerald-700">AGRIVA AI</p><h1 className="mt-3 text-4xl font-black text-slate-900">Your agriculture AI assistant</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">Ask about crops, farming practices, pests, soil and agriculture knowledge. AI integrations can be configured from this workspace.</p><div className="mt-8 flex gap-3"><Link href="/" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Back home</Link><Link href="/tools" className="rounded-xl border px-5 py-3 text-sm font-bold">Explore tools</Link></div></div></main>;
}
