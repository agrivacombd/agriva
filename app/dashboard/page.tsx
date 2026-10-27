import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = "farmer" | "buyer" | "seller" | "transport_provider" | "student" | "agronomist" | "gardener" | "reseller" | "admin";
type Action = { icon: string; titleBn: string; titleEn: string; descBn: string; href: string };
type RoleInfo = { bn: string; en: string; intro: string; actions: Action[] };

const roleInfo: Record<Role, RoleInfo> = {
  farmer: { bn: "কৃষক", en: "Farmer", intro: "আপনার জমি, ফসল ও মৌসুমের কাজ এক জায়গা থেকে গুছিয়ে রাখুন।", actions: [
    { icon: "🌾", titleBn: "আমার খামার", titleEn: "My farms", descBn: "জমি ও ফসলের তথ্য রাখুন", href: "/farms" },
    { icon: "🔬", titleBn: "ক্রপ ডাক্তার", titleEn: "Crop doctor", descBn: "ফসলের সমস্যা বুঝুন", href: "/crop-disease" },
    { icon: "🌦️", titleBn: "আবহাওয়া", titleEn: "Weather", descBn: "কাজের আগে আবহাওয়া দেখুন", href: "/weather" },
    { icon: "🛒", titleBn: "কৃষি বাজার", titleEn: "Marketplace", descBn: "বীজ ও কৃষি উপকরণ খুঁজুন", href: "/marketplace" },
    { icon: "🤖", titleBn: "AI কৃষি সহকারী", titleEn: "AI assistant", descBn: "কৃষি বিষয়ে প্রশ্ন করুন", href: "/search" },
  ] },
  buyer: { bn: "ক্রেতা", en: "Buyer", intro: "কৃষিপণ্য খুঁজুন, বিকল্প তুলনা করুন এবং কেনাকাটা গুছিয়ে রাখুন।", actions: [
    { icon: "🛒", titleBn: "পণ্য খুঁজুন", titleEn: "Explore products", descBn: "কৃষিপণ্যের বাজার দেখুন", href: "/marketplace" },
    { icon: "🔎", titleBn: "স্মার্ট সার্চ", titleEn: "Smart search", descBn: "দ্রুত পণ্য ও তথ্য খুঁজুন", href: "/search" },
    { icon: "📦", titleBn: "আমার অর্ডার", titleEn: "My orders", descBn: "অর্ডার ও কেনাকাটার তথ্য", href: "/orders" },
    { icon: "🌱", titleBn: "গ্রিন এক্সচেঞ্জ", titleEn: "Green exchange", descBn: "গাছপ্রেমীদের সাথে যুক্ত হন", href: "/green-exchange/board" },
  ] },
  seller: { bn: "বিক্রেতা", en: "Seller", intro: "আপনার পণ্য ও অর্ডার পরিচালনার জন্য প্রয়োজনীয় জায়গাগুলো একসাথে রাখুন।", actions: [
    { icon: "🏪", titleBn: "কৃষি বাজার", titleEn: "Marketplace", descBn: "পণ্যের বাজারে যান", href: "/marketplace" },
    { icon: "📦", titleBn: "অর্ডার", titleEn: "Orders", descBn: "অর্ডার-সংক্রান্ত তথ্য দেখুন", href: "/orders" },
    { icon: "🔎", titleBn: "পণ্য খুঁজুন", titleEn: "Product discovery", descBn: "বাজারের পণ্য ঘুরে দেখুন", href: "/search" },
    { icon: "🤝", titleBn: "রিসেলার টুলস", titleEn: "Reseller tools", descBn: "রেফারেলভিত্তিক বিক্রিতে আগ্রহী?", href: "/reseller/dashboard" },
  ] },
  transport_provider: { bn: "পরিবহন সেবাদাতা", en: "Transport provider", intro: "পরিবহন সেবা ও বুকিং পরিচালনার প্রয়োজনীয় টুলস একসাথে রাখুন।", actions: [
    { icon: "🚚", titleBn: "পরিবহন সেবা", titleEn: "Transport services", descBn: "পরিবহন সেবা দেখুন", href: "/transport" },
    { icon: "📦", titleBn: "বুকিং ও অর্ডার", titleEn: "Bookings & orders", descBn: "অর্ডার পৃষ্ঠায় যান", href: "/orders" },
    { icon: "🔎", titleBn: "স্মার্ট সার্চ", titleEn: "Smart search", descBn: "প্রাসঙ্গিক তথ্য খুঁজুন", href: "/search" },
  ] },
  student: { bn: "শিক্ষার্থী", en: "Student", intro: "কৃষি বিষয়ে জানুন, দরকারি লেখা পড়ুন এবং শেখার যাত্রা এগিয়ে নিন।", actions: [
    { icon: "🎓", titleBn: "কৃষি-শিক্ষা", titleEn: "Agriculture learning", descBn: "কৃষি বিষয়ক লেখা ও গাইড", href: "/articles" },
    { icon: "🔎", titleBn: "শেখার সার্চ", titleEn: "Learning search", descBn: "কৃষি বিষয়ে খুঁজুন", href: "/search" },
    { icon: "💼", titleBn: "কৃষি চাকরি", titleEn: "Agriculture jobs", descBn: "চাকরির সুযোগ দেখুন", href: "/jobs" },
    { icon: "🌿", titleBn: "গাছপালা", titleEn: "Plants", descBn: "প্রকৃতি ও বাগান বিষয়ে জানুন", href: "/garden" },
  ] },
  agronomist: { bn: "কৃষিবিদ", en: "Agronomist", intro: "কৃষি জ্ঞান, রোগবালাই ও মাঠ পর্যায়ের তথ্য দ্রুত খুঁজুন। বিশেষজ্ঞ ফিচার যাচাইসাপেক্ষ।", actions: [
    { icon: "🔬", titleBn: "ক্রপ ডাক্তার", titleEn: "Crop doctor", descBn: "ফসলের লক্ষণ ও সমাধান", href: "/crop-disease" },
    { icon: "🤖", titleBn: "AI কৃষি সহকারী", titleEn: "AI assistant", descBn: "কৃষি বিষয়ে অনুসন্ধান", href: "/search" },
    { icon: "📰", titleBn: "কৃষি জ্ঞান", titleEn: "Agriculture knowledge", descBn: "গাইড ও আর্টিকেল", href: "/articles" },
    { icon: "💼", titleBn: "কৃষি চাকরি", titleEn: "Agriculture jobs", descBn: "চাকরির সুযোগ", href: "/jobs" },
  ] },
  gardener: { bn: "শখের বাগানপ্রেমী", en: "Home gardener", intro: "আপনার গাছপালা, পরিচর্যা ও বাগান কমিউনিটির কাজ গুছিয়ে রাখুন।", actions: [
    { icon: "🪴", titleBn: "আমার বাগান", titleEn: "My garden", descBn: "গাছপালা ও পরিচর্যা", href: "/garden" },
    { icon: "🌱", titleBn: "গ্রিন এক্সচেঞ্জ", titleEn: "Green exchange", descBn: "গাছপ্রেমীদের সাথে যুক্ত হন", href: "/green-exchange/board" },
    { icon: "🛒", titleBn: "বাগানের বাজার", titleEn: "Garden marketplace", descBn: "গাছ ও উপকরণ খুঁজুন", href: "/marketplace" },
  ] },
  reseller: { bn: "রিসেলার", en: "Reseller", intro: "রেফারেল, কমিশন এবং পেআউট-সংক্রান্ত সুবিধাগুলো দেখুন।", actions: [
    { icon: "🤝", titleBn: "রিসেলার ড্যাশবোর্ড", titleEn: "Reseller dashboard", descBn: "রেফারেল ও কমিশন", href: "/reseller/dashboard" },
    { icon: "🛒", titleBn: "কৃষি বাজার", titleEn: "Marketplace", descBn: "পণ্য দেখুন", href: "/marketplace" },
  ] },
  admin: { bn: "অ্যাডমিন", en: "Admin", intro: "অ্যাডমিন সুবিধা শুধু অনুমোদিত কর্মীদের জন্য।", actions: [
    { icon: "🛡️", titleBn: "অ্যাডমিন", titleEn: "Admin workspace", descBn: "অ্যাডমিন প্যানেল", href: "/admin" },
  ] },
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.email?.split("@")[0] || "AGRIVA";
  const profileRole = profile?.role as Role | undefined;
  const role: Role = profileRole && Object.prototype.hasOwnProperty.call(roleInfo, profileRole) ? profileRole : "farmer";
  const info = roleInfo[role];
  const icon = role === "farmer" ? "🌾" : role === "buyer" ? "🛒" : role === "seller" ? "🏪" : role === "transport_provider" ? "🚚" : role === "student" ? "🎓" : role === "agronomist" ? "🧑‍🌾" : role === "gardener" ? "🪴" : role === "reseller" ? "🤝" : "🛡️";

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <header className="border-b border-black/5 bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="text-2xl font-black tracking-tight">AGRIVA<span className="text-[#c49a3e]">.</span></Link><nav className="flex items-center gap-3 text-sm font-semibold"><span className="hidden rounded-full bg-[#edf6eb] px-3 py-2 text-[#28663a] sm:inline">{info.bn}</span><span className="max-w-[160px] truncate rounded-full bg-[#173f2b] px-4 py-2.5 text-white">{name}</span></nav></div></header>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-11">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a17c2e]">AGRIVA · {info.en}</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">স্বাগতম, {name}!</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#657467] sm:text-base">{info.intro}</p></div><Link href="/search" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1c6338] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1c6338]/10 transition hover:bg-[#164f2d]">🤖 AGRIVA AI-কে জিজ্ঞাসা করুন <span aria-hidden="true">→</span></Link></div>
        <div className="mt-8 overflow-hidden rounded-[1.75rem] bg-[#173f2b] p-6 text-white sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7c17b]">Your workspace</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{info.bn} হিসেবে আপনার কাজ শুরু করুন</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#d1dfd1]">আপনার প্রয়োজনীয় টুলস এখানে সাজানো আছে। নতুন সুবিধা যোগ হলে আপনার কাজের জায়গা আরও সমৃদ্ধ হবে।</p></div><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-4xl">{icon}</span></div></div>
        <div className="mt-8 flex items-center justify-between"><div><h2 className="text-xl font-black">আপনার জন্য প্রয়োজনীয় সেবা</h2><p className="mt-1 text-sm text-[#748276]">Tools selected for your AGRIVA role</p></div><span className="text-xs font-semibold text-[#718274]">Account: {info.en}</span></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{info.actions.map((action) => <Link key={action.href + action.titleEn} href={action.href} className="group rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a8c5a9] hover:shadow-md sm:p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eff7ed] text-2xl">{action.icon}</span><h3 className="mt-4 font-extrabold">{action.titleBn}<span className="ml-2 text-xs font-medium text-[#839084]">{action.titleEn}</span></h3><p className="mt-2 text-sm leading-6 text-[#6b7a6d]">{action.descBn}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1d6939] group-hover:gap-3">শুরু করুন <span aria-hidden="true">→</span></span></Link>)}</div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2"><Link href="/garden" className="flex items-center gap-4 rounded-2xl border border-[#e3e9e0] bg-white p-5 transition hover:border-[#a8c5a9]"><span className="text-3xl">🪴</span><span><strong className="block">পার্সোনাল গার্ডেন</strong><span className="mt-1 block text-sm text-[#6b7a6d]">গাছপালা ও পরিচর্যার কাজ</span></span></Link><Link href="/impact" className="flex items-center gap-4 rounded-2xl border border-[#e3e9e0] bg-white p-5 transition hover:border-[#a8c5a9]"><span className="text-3xl">🌍</span><span><strong className="block">গ্রিন ইমপ্যাক্ট</strong><span className="mt-1 block text-sm text-[#6b7a6d]">কমিউনিটির পরিবেশগত প্রভাব</span></span></Link></div>
        {role === "agronomist" && <p className="mt-6 rounded-2xl border border-[#eadcae] bg-[#fff9e9] p-4 text-sm leading-6 text-[#795e1e]">বিশেষজ্ঞ পরিচয় যাচাই না হওয়া পর্যন্ত verified agronomist সুবিধা চালু হবে না।</p>}
        {role === "admin" && <p className="mt-6 rounded-2xl border border-[#eadcae] bg-[#fff9e9] p-4 text-sm leading-6 text-[#795e1e]">Admin route-এ প্রবেশের আগে server-side authorization অবশ্যই যাচাই করতে হবে।</p>}
      </section>
    </main>
  );
}
