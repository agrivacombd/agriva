import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact AGRIVA by phone, email, or WhatsApp.",
};

const phoneNumber = "01717504028";
const internationalPhoneNumber = "8801717504028";
const emailAddress = "Agriva.com.bd@gmail.com";
const whatsappMessage = encodeURIComponent("Hello AGRIVA, I would like to know more about your services.");

export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-12 text-[#173629] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">← AGRIVA home</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">We’re here to help</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Contact Us</h1>
        <p className="mt-6 leading-8 text-slate-600">Have a question about AGRIVA, our agricultural tools, or marketplace features? Contact us using any of the options below.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a href={`tel:${phoneNumber}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 transition hover:border-emerald-300 hover:bg-emerald-50">
            <h2 className="font-bold">Phone</h2>
            <p className="mt-2 text-sm text-slate-600">Tap to call AGRIVA</p>
            <span className="mt-3 inline-block font-semibold text-emerald-800">{phoneNumber}</span>
          </a>
          <a href={`https://wa.me/${internationalPhoneNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 transition hover:border-emerald-300 hover:bg-emerald-50">
            <h2 className="font-bold">WhatsApp</h2>
            <p className="mt-2 text-sm text-slate-600">Tap to open WhatsApp and send a message</p>
            <span className="mt-3 inline-block font-semibold text-emerald-800">{phoneNumber}</span>
          </a>
          <a href={`mailto:${emailAddress}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 transition hover:border-emerald-300 hover:bg-emerald-50 sm:col-span-2">
            <h2 className="font-bold">Email</h2>
            <p className="mt-2 text-sm text-slate-600">Tap to write us an email</p>
            <span className="mt-3 inline-block break-all font-semibold text-emerald-800">{emailAddress}</span>
          </a>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/marketplace" className="rounded-2xl border border-slate-100 p-5 hover:border-emerald-200">
            <h2 className="font-bold">Marketplace</h2><p className="mt-2 text-sm leading-6 text-slate-600">Explore agricultural products and marketplace features.</p>
          </Link>
          <Link href="/learn" className="rounded-2xl border border-slate-100 p-5 hover:border-emerald-200">
            <h2 className="font-bold">Learning resources</h2><p className="mt-2 text-sm leading-6 text-slate-600">Browse agricultural learning materials and guides.</p>
          </Link>
        </div>
      </article>
    </main>
  );
}
