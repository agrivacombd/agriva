import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how AGRIVA may handle information when you use the platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-12 text-[#173629] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">← AGRIVA home</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Your information</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: October 23, 2026</p>
        <p className="mt-6 leading-8 text-slate-600">This page explains general privacy principles for AGRIVA. The exact information handled depends on which platform features you use.</p>
        <h2 className="mt-8 text-xl font-bold">Information you provide</h2>
        <p className="mt-3 leading-8 text-slate-600">When you create an account or use platform features, you may provide account details, profile information, search terms, marketplace activity, or information you submit to agricultural tools.</p>
        <h2 className="mt-8 text-xl font-bold">How information may be used</h2>
        <p className="mt-3 leading-8 text-slate-600">Information may be used to provide requested features, maintain account security, support marketplace workflows, improve platform reliability, and respond to service needs.</p>
        <h2 className="mt-8 text-xl font-bold">Storage and sharing</h2>
        <p className="mt-3 leading-8 text-slate-600">Some platform features rely on third-party infrastructure providers. Information should only be accessed or shared as needed to operate the service, meet legal obligations, or protect users and the platform, subject to applicable requirements.</p>
        <h2 className="mt-8 text-xl font-bold">Security and your choices</h2>
        <p className="mt-3 leading-8 text-slate-600">No online service can guarantee absolute security. Use a strong password and avoid submitting sensitive personal information unless a feature specifically requires it. For account or privacy questions, consult the available platform options.</p>
        <h2 className="mt-8 text-xl font-bold">Policy updates</h2>
        <p className="mt-3 leading-8 text-slate-600">This policy may be updated as AGRIVA’s features and legal requirements change. This general policy page should be reviewed against the platform’s actual data practices before being treated as a final legal notice.</p>
      </article>
    </main>
  );
}
