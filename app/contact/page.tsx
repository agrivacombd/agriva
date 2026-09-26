import Link from "next/link";

export const metadata = { title: "Contact AGRIVA", description: "Contact the AGRIVA team." };

export default function ContactPage() {
  return <main className="min-h-screen bg-slate-50 px-6 py-16"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm"><Link href="/" className="text-sm font-bold text-emerald-700">← AGRIVA home</Link><h1 className="mt-6 text-4xl font-black text-slate-900">Contact AGRIVA</h1><p className="mt-4 leading-7 text-slate-600">For product, marketplace, reseller or agriculture platform questions, use the contact channel configured for your AGRIVA deployment.</p><Link href="/" className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Back to home</Link></div></main>;
}
