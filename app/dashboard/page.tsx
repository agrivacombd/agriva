import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

const services = [
  { icon: "🤖", title: "AI কৃষি সহায়ক", detail: "ফসল, মাটি, সার ও চাষাবাদ নিয়ে প্রশ্ন করুন", href: "/ai" },
  { icon: "🔬", title: "ফসলের রোগ", detail: "লক্ষণ দেখে প্রাথমিক দিকনির্দেশনা নিন", href: "/crop-disease" },
  { icon: "🌦️", title: "কৃষি আবহাওয়া", detail: "চাষের কাজের আগে আবহাওয়া দেখুন", href: "/weather" },
  { icon: "📈", title: "বাজারদর", detail: "কৃষিপণ্যের দাম ও বাজার তথ্য দেখুন", href: "/market-prices" },
  { icon: "🧮", title: "কৃষি ক্যালকুলেটর", detail: "বীজ, সার ও চাষের খরচ হিসাব করুন", href: "/tools" },
  { icon: "🌱", title: "ফসল বাছাই", detail: "খরচ ও সম্ভাব্য লাভ তুলনা করুন", href: "/crop-choice" },
  { icon: "🧪", title: "মাটি ও সার পরিকল্পনা", detail: "মাটি পরীক্ষা ও সার হিসাব গুছিয়ে নিন", href: "/soil-fertilizer" },
  { icon: "🗓️", title: "ফসল ক্যালেন্ডার", detail: "মৌসুমভিত্তিক কাজের পরিকল্পনা করুন", href: "/crop-calendar" },
  { icon: "🛒", title: "কৃষি মার্কেটপ্লেস", detail: "বীজ ও কৃষি উপকরণ খুঁজুন", href: "/marketplace" },
  { icon: "🌾", title: "ফসল বিক্রি", detail: "আপনার ফসলের পোস্ট তৈরি করুন", href: "/sell-harvest" },
  { icon: "🤝", title: "ক্রেতার চাহিদা", detail: "ক্রেতাদের চাহিদা দেখে অফার দিন", href: "/buyer-demands" },
  { icon: "🚚", title: "পরিবহন", detail: "কৃষিপণ্য পরিবহনের ব্যবস্থা দেখুন", href: "/transport" },
];

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "কৃষক";
  const isAdmin = profile?.role === "admin";

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-black tracking-tight">AGRIVA<span className="text-[#b58b28]">.</span></Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold sm:gap-5">
            <Link href="/dashboard" className="text-[#1f7a45]">আমার ড্যাশবোর্ড</Link>
            <Link href="/marketplace">মার্কেটপ্লেস</Link>
            <Link href="/orders">আমার অর্ডার</Link>
            {isAdmin && <Link href="/admin" className="rounded-lg bg-[#17351f] px-3 py-2 text-white">Super Admin</Link>}
            <form action={signOut}><button className="rounded-lg border border-[#d8e2d5] px-3 py-2 hover:bg-[#f2f6ef]" type="submit">লগআউট</button></form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-3xl bg-[#17351f] p-6 text-white shadow-lg sm:p-9">
          <p className="text-sm font-bold tracking-wide text-[#d8c27d]">আপনার AGRIVA অ্যাকাউন্ট</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">স্বাগতম, {name}!</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#d4e1d5]">কৃষি টুলস ব্যবহার করুন, বাজারদর দেখুন, ফসলের পরিকল্পনা করুন এবং আপনার অর্ডার অনুসরণ করুন—এক জায়গা থেকেই।</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai" className="rounded-xl bg-[#d4b65e] px-5 py-3 font-bold text-[#17351f]">AI-কে প্রশ্ন করুন ↗</Link>
            <Link href="/tools" className="rounded-xl border border-white/25 px-5 py-3 font-bold text-white">কৃষি ক্যালকুলেটর ↗</Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-bold text-[#a47b20]">AGRIVA SERVICES</p><h2 className="mt-1 text-2xl font-black">আপনার কৃষি কাজের টুলস</h2></div>
          <Link href="/" className="text-sm font-bold text-[#267044] underline underline-offset-4">সব সার্ভিস দেখুন</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => <Link key={service.href} href={service.href} className="group rounded-2xl border border-[#e1e8dc] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c9a7] hover:shadow-md">
            <span className="text-3xl" aria-hidden="true">{service.icon}</span>
            <h3 className="mt-4 font-extrabold group-hover:text-[#267044]">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#66776a]">{service.detail}</p>
            <span className="mt-4 inline-block text-sm font-bold text-[#267044]">খুলুন ↗</span>
          </Link>)}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/farms" className="rounded-2xl bg-[#e7f0e6] p-5"><p className="text-2xl">🌾</p><h3 className="mt-3 font-black">আমার খামার</h3><p className="mt-1 text-sm leading-6 text-[#5e7063]">খামারের তথ্য ও মাঠের কাজ ব্যবস্থাপনা করুন।</p></Link>
          <Link href="/orders" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e1e8dc]"><p className="text-2xl">📦</p><h3 className="mt-3 font-black">আমার অর্ডার</h3><p className="mt-1 text-sm leading-6 text-[#5e7063]">অর্ডার ও ডেলিভারির অবস্থা অনুসরণ করুন।</p></Link>
          <Link href="/blog" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e1e8dc]"><p className="text-2xl">📚</p><h3 className="mt-3 font-black">কৃষি গাইড ও ব্লগ</h3><p className="mt-1 text-sm leading-6 text-[#5e7063]">সহজ বাংলায় কৃষি বিষয়ক জ্ঞান পড়ুন।</p></Link>
        </div>
        <p className="mt-8 text-center text-xs leading-5 text-[#7b887d]">আপনার অ্যাকাউন্টের অনুমতি অনুযায়ী ফিচার দেখানো হয়। সাধারণ ব্যবহারকারীর অ্যাকাউন্ট থেকে Super Admin access পাওয়া যায় না।</p>
      </section>
    </main>
  );
}
