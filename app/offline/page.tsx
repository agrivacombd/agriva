import Link from "next/link";

export const metadata = {
  title: "অফলাইন | AGRIVA",
  description: "ইন্টারনেট সংযোগ নেই। সংযোগ ফিরে এলে আবার চেষ্টা করুন।",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
          <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
            <path d="M24 40V22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M24 28C10 28 7 17 8 8c12 0 20 5 20 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M24 33c0-12 7-19 17-20 1 10-4 19-17 20Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">আপনি এখন অফলাইনে আছেন</h1>
        <p className="mt-3 leading-7 text-slate-600">ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন। সব ফিচার অফলাইনে কাজ নাও করতে পারে।</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">আবার চেষ্টা করুন</Link>
      </section>
    </main>
  );
}
