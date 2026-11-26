import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Leaf, Search, ShoppingBag, Sprout, Wrench } from "lucide-react";

export const metadata = {
  title: "পৃষ্ঠা পাওয়া যায়নি | AGRIVA",
  description: "আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি পাওয়া যায়নি। AGRIVA-এর কৃষি পণ্য, শেখার গাইড ও টুলস দেখুন।",
  robots: { index: false, follow: true },
};

const destinations = [
  { href: "/marketplace", label: "কৃষি মার্কেটপ্লেস", detail: "বীজ, সার ও কৃষি উপকরণ খুঁজুন", icon: ShoppingBag },
  { href: "/learn", label: "কৃষি শেখার কেন্দ্র", detail: "চাষাবাদ, মাটি ও রোগবালাই বিষয়ে গাইড", icon: BookOpen },
  { href: "/plant-market", label: "Plant Market", detail: "গাছ ও চারা দেখুন", icon: Leaf },
  { href: "/tools", label: "কৃষি টুলস", detail: "দৈনন্দিন কৃষি হিসাব ও সহায়ক টুল", icon: Wrench },
];

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Sprout size={32} aria-hidden="true" />
          </div>
          <p className="mt-6 text-center text-sm font-extrabold tracking-widest text-emerald-700">404 · PAGE NOT FOUND</p>
          <h1 className="mt-2 text-center text-3xl font-black text-slate-900 sm:text-4xl">দুঃখিত, পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-8 text-slate-600">
            লিংকটি পুরোনো হতে পারে, ঠিকানায় ভুল থাকতে পারে অথবা পৃষ্ঠাটি সরানো হয়েছে।
            AGRIVA-এর নিচের বিভাগগুলো থেকে আপনার প্রয়োজনীয় তথ্য খুঁজে নিন।
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              <Home size={18} aria-hidden="true" /> AGRIVA হোমে যান
            </Link>
          </div>
        </div>

        <section aria-labelledby="helpful-links" className="mt-8">
          <h2 id="helpful-links" className="text-center text-xl font-black text-slate-900">আপনি হয়তো এগুলো খুঁজছেন</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {destinations.map(({ href, label, detail, icon: Icon }) => (
              <Link key={href} href={href} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-extrabold text-slate-900 group-hover:text-emerald-800">{label}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{detail}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <p className="mt-8 text-center text-sm text-slate-500">
          লিংকটি কাজ না করলে <Link href="/contact-us" className="font-bold text-emerald-700 underline underline-offset-2">আমাদের জানান</Link>।
        </p>
      </div>
    </main>
  );
}
