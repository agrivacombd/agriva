import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about AGRIVA and our mission to make useful agricultural tools and information easier to access.",
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f1] px-4 py-12 text-[#173629] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">← AGRIVA home</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">About AGRIVA</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">About Us</h1>
        <p className="mt-6 leading-8 text-slate-600">AGRIVA is a digital platform designed to bring useful agricultural information and tools together in one place for farmers, agricultural learners, and agribusiness communities in Bangladesh.</p>
        <h2 className="mt-8 text-xl font-bold">Our mission</h2>
        <p className="mt-3 leading-8 text-slate-600">We aim to make agricultural knowledge and practical digital services easier to discover and use—from crop information and learning resources to farm planning tools and marketplace features.</p>
        <h2 className="mt-8 text-xl font-bold">What we offer</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-600">
          <li>Agricultural products and marketplace features</li>
          <li>Learning resources and crop-related guidance</li>
          <li>Digital tools to support farm planning and record keeping</li>
          <li>Services intended to help connect agricultural communities</li>
        </ul>
        <p className="mt-8 leading-8 text-slate-600">AGRIVA’s digital information is intended to support—not replace—advice from qualified agricultural professionals and local authorities.</p>
      </article>
    </main>
  );
}
