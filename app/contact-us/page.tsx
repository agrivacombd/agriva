import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Find the available ways to navigate and contact AGRIVA.",
};

export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-12 text-[#173629] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">← AGRIVA home</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">We’re here to help</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Contact Us</h1>
        <p className="mt-6 leading-8 text-slate-600">Have a question about AGRIVA, our agricultural tools, or marketplace features? Use the relevant section of the platform to explore the service you need.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/marketplace" className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 hover:border-emerald-300">
            <h2 className="font-bold">Marketplace</h2><p className="mt-2 text-sm leading-6 text-slate-600">Explore agricultural products and marketplace features.</p>
          </Link>
          <Link href="/learn" className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 hover:border-emerald-300">
            <h2 className="font-bold">Learning resources</h2><p className="mt-2 text-sm leading-6 text-slate-600">Browse agricultural learning materials and guides.</p>
          </Link>
        </div>
        <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Direct support contact details are not published on this page yet. We have not displayed an unverified email address or phone number.</p>
      </article>
    </main>
  );
}
