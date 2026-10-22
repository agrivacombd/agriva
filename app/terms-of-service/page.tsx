import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for accessing and using AGRIVA digital services.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-12 text-[#173629] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">← AGRIVA home</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Using AGRIVA</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: October 23, 2026</p>
        <p className="mt-6 leading-8 text-slate-600">By accessing AGRIVA, you agree to use the platform lawfully and responsibly. If you do not agree with these terms, please discontinue use of the relevant services.</p>
        <h2 className="mt-8 text-xl font-bold">Platform information</h2>
        <p className="mt-3 leading-8 text-slate-600">Agricultural information, AI-generated responses, calculators, weather information, and other tools are provided for general informational support. Verify important decisions with qualified professionals and authoritative local sources.</p>
        <h2 className="mt-8 text-xl font-bold">Accounts and acceptable use</h2>
        <p className="mt-3 leading-8 text-slate-600">Keep your account credentials secure, provide accurate information where requested, and do not misuse the platform, attempt unauthorized access, interfere with its operation, or submit unlawful, misleading, or harmful content.</p>
        <h2 className="mt-8 text-xl font-bold">Marketplace activity</h2>
        <p className="mt-3 leading-8 text-slate-600">Users are responsible for verifying product descriptions, prices, seller or buyer details, delivery arrangements, and any transaction terms. Do not assume that every listing or user-submitted claim has been independently verified by AGRIVA.</p>
        <h2 className="mt-8 text-xl font-bold">Availability and changes</h2>
        <p className="mt-3 leading-8 text-slate-600">Features may change, be interrupted, or become unavailable. To the extent permitted by applicable law, AGRIVA does not guarantee that all information or services will always be uninterrupted, error-free, or suitable for every purpose.</p>
        <h2 className="mt-8 text-xl font-bold">Updates and applicable law</h2>
        <p className="mt-3 leading-8 text-slate-600">These terms may be revised as the platform evolves. Applicable laws and regulations govern use of the service. Have this draft reviewed for AGRIVA’s actual operations and legal obligations before relying on it as a final legal agreement.</p>
      </article>
    </main>
  );
}
