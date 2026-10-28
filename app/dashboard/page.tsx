import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MobileDashboardNav from "@/components/MobileDashboardNav";
import BrandLogo from "@/components/BrandLogo";

type Role = "farmer" | "buyer" | "seller" | "reseller" | "transport" | "transport_provider" | "job_seeker" | "worker" | "employer" | "student" | "educator" | "expert" | "agriculturist" | "rooftop_gardener" | "organization" | "admin";

const roleInfo: Record<Role, { bn: string; en: string; description: string; links: { label: string; href: string; icon: string }[] }> = {
  farmer: { bn: "কৃষক", en: "Farmer", description: "খামার, ফসল ও মাঠের কাজ এক জায়গায় পরিচালনা করুন।", links: [{ label: "আমার খামার", href: "/farms", icon: "🌾" }, { label: "ফসলের রোগ শনাক্ত", href: "/crop-disease", icon: "🔬" }, { label: "ফসল বিক্রি করুন", href: "/sell-harvest", icon: "🧺" }, { label: "আবহাওয়া", href: "/weather", icon: "🌦️" }] },
  buyer: { bn: "ক্রেতা", en: "Buyer", description: "কৃষিপণ্য খুঁজুন এবং আপনার চাহিদা প্রকাশ করুন।", links: [{ label: "মার্কেটপ্লেস", href: "/marketplace", icon: "🛒" }, { label: "ক্রেতার চাহিদা", href: "/buyer-demands", icon: "📋" }, { label: "ফসল খুঁজুন", href: "/sell-harvest", icon: "🌽" }] },
  seller: { bn: "বিক্রেতা / ডিলার", en: "Seller / Dealer", description: "কৃষি উপকরণ ও পণ্য গ্রাহকদের কাছে পৌঁছে দিন।", links: [{ label: "মার্কেটপ্লেস", href: "/marketplace", icon: "🏪" }, { label: "পণ্য যোগ করুন", href: "/farmer/products/new", icon: "➕" }, { label: "অর্ডার দেখুন", href: "/dashboard/farmer/orders", icon: "📦" }] },
  reseller: { bn: "রিসেলার", en: "Reseller", description: "আপনার রেফারেল ও বিক্রয় কার্যক্রম পরিচালনা করুন।", links: [{ label: "রিসেলার ড্যাশবোর্ড", href: "/reseller/dashboard", icon: "📈" }, { label: "মার্কেটপ্লেস", href: "/marketplace", icon: "🛒" }] },
  transport: { bn: "পরিবহন সেবাদাতা", en: "Transport provider", description: "কৃষিপণ্য পরিবহনের সুযোগ ও বুকিং পরিচালনা করুন।", links: [{ label: "পরিবহন বুকিং", href: "/transport", icon: "🚚" }] },
  transport_provider: { bn: "পরিবহন সেবাদাতা", en: "Transport provider", description: "কৃষিপণ্য পরিবহনের সুযোগ ও বুকিং পরিচালনা করুন।", links: [{ label: "পরিবহন বুকিং", href: "/transport", icon: "🚚" }] },
  job_seeker: { bn: "চাকরিপ্রার্থী", en: "Job seeker", description: "কৃষি খাতের চাকরি খুঁজুন এবং নিজের প্রোফাইল প্রস্তুত করুন।", links: [{ label: "চাকরির সুযোগ", href: "/jobs", icon: "💼" }, { label: "CV তৈরি করুন", href: "/jobs/cv-builder", icon: "📄" }] },
  worker: { bn: "কৃষিশ্রমিক", en: "Agricultural worker", description: "কৃষি খাতে কাজের সুযোগ খুঁজুন।", links: [{ label: "চাকরির সুযোগ", href: "/jobs", icon: "🧑‍🌾" }] },
  employer: { bn: "নিয়োগদাতা", en: "Employer", description: "কৃষি খাতে কাজের সুযোগ প্রকাশ করুন ও কর্মী খুঁজুন।", links: [{ label: "চাকরির সুযোগ", href: "/jobs", icon: "📣" }] },
  student: { bn: "কৃষি শিক্ষার্থী", en: "Agriculture student", description: "কৃষি বিষয়ে শিখুন, অনুশীলন করুন ও দক্ষতা বাড়ান।", links: [{ label: "শেখার কেন্দ্র", href: "/learn", icon: "🎓" }, { label: "কৃষি আর্টিকেল", href: "/learn/plant-science", icon: "📚" }] },
  educator: { bn: "শিক্ষার্থী / প্রশিক্ষক", en: "Student / Educator", description: "কৃষি জ্ঞান, গাইড ও শেখার রিসোর্স ব্যবহার করুন।", links: [{ label: "শেখার কেন্দ্র", href: "/learn", icon: "🎓" }, { label: "কৃষি আর্টিকেল", href: "/articles", icon: "📚" }] },
  expert: { bn: "কৃষিবিদ / বিশেষজ্ঞ", en: "Agriculture expert", description: "বিশেষজ্ঞ জ্ঞান ও কৃষি পরামর্শের জন্য প্রাসঙ্গিক টুল ব্যবহার করুন।", links: [{ label: "কৃষি জ্ঞান", href: "/learn", icon: "📘" }, { label: "কৃষি আর্টিকেল", href: "/learn/plant-science", icon: "📰" }, { label: "ফসলের রোগ সহায়তা", href: "/crop-disease", icon: "🔬" }] },
  agriculturist: { bn: "কৃষিবিদ", en: "Agriculturist", description: "কৃষি জ্ঞান ও পরামর্শের রিসোর্সে দ্রুত প্রবেশ করুন।", links: [{ label: "শেখার কেন্দ্র", href: "/learn", icon: "📘" }, { label: "কৃষি আর্টিকেল", href: "/articles", icon: "📰" }] },
  rooftop_gardener: { bn: "ছাদবাগানকারী", en: "Rooftop gardener", description: "আপনার ছাদবাগান, গাছ ও পরিচর্যার কাজ গুছিয়ে রাখুন।", links: [{ label: "আমার বাগান", href: "/garden", icon: "🪴" }, { label: "Green Exchange", href: "/green-exchange/board", icon: "🌱" }] },
  organization: { bn: "প্রতিষ্ঠান", en: "Organization", description: "কৃষি-সম্পর্কিত প্রতিষ্ঠানের কার্যক্রম পরিচালনা করুন।", links: [{ label: "মার্কেটপ্লেস", href: "/marketplace", icon: "🏢" }, { label: "চাকরি", href: "/jobs", icon: "💼" }] },
  admin: { bn: "অ্যাডমিন", en: "Administrator", description: "অনুমোদিত প্রশাসনিক কাজ ও প্ল্যাটফর্ম পরিচালনা।", links: [{ label: "অ্যাডমিন প্যানেল", href: "/admin", icon: "🛡️" }, { label: "কৃষি কনটেন্ট", href: "/admin/articles", icon: "📚" }] },
};

const commonLinks = [
  { label: "AGRIVA AI", href: "/search", icon: "✨", description: "কৃষি বিষয়ে প্রশ্ন করুন" },
  { label: "মার্কেটপ্লেস", href: "/marketplace", icon: "🛒", description: "পণ্য ও কৃষি উপকরণ দেখুন" },
  { label: "আবহাওয়া", href: "/weather", icon: "🌦️", description: "কাজের আগে আবহাওয়া দেখুন" },
  { label: "শেখার কেন্দ্র", href: "/learn", icon: "🎓", description: "গাইড ও শিক্ষামূলক কনটেন্ট" },
  { label: "Green Impact", href: "/impact", icon: "🌱", description: "যাচাইযোগ্য সবুজ কার্যক্রমের প্রভাব দেখুন" },
  { label: "চাকরি", href: "/jobs", icon: "💼", description: "কৃষি খাতের কাজের সুযোগ" },
  { label: "প্রোফাইল সেটিংস", href: "/profile", icon: "⚙️", description: "আপনার তথ্য ও পছন্দ আপডেট করুন" },
];

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    supabase.from("user_role_memberships").select("role").eq("user_id", user.id),
  ]);

  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "AGRIVA User";
  const storedRoles = (memberships ?? []).map((item) => item.role).filter((role): role is Role => role in roleInfo);
  const legacyRole = profile?.role && profile.role in roleInfo ? [profile.role as Role] : [];
  const roles = Array.from(new Set(storedRoles.length ? storedRoles : legacyRole.length ? legacyRole : ["farmer" as Role]));
  const roleCards = roles.map((role) => ({ role, info: roleInfo[role] }));

  return (
    <main className="min-h-screen bg-[#f5f8f2] pb-24 text-[#173b2d] md:pb-0">
      <header className="sticky top-0 z-20 border-b border-[#e2e9df] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo href="/" imageClassName="h-10 w-40 sm:w-48" priority />
          <div className="flex items-center gap-3">
            <Link href="/profile" className="hidden rounded-full border border-[#dce6da] px-4 py-2 text-sm font-semibold sm:block">প্রোফাইল সেটিংস</Link>
            <span className="max-w-[140px] truncate rounded-full bg-[#eaf4eb] px-4 py-2 text-sm font-bold text-[#126b4f] sm:max-w-[220px]">{name}</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a67f25]">AGRIVA • PERSONAL DASHBOARD</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">স্বাগতম, {name} 👋</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#617467]">আপনার নির্বাচিত ভূমিকা অনুযায়ী প্রয়োজনীয় সেবা ও কাজগুলো এখানে সাজানো হয়েছে।</p>
          </div>
          <Link href="/profile" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#126b4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b563e]">ভূমিকা পরিবর্তন করুন ↗</Link>
        </div>

        <section className="mt-8 rounded-[1.75rem] bg-[#123f30] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-[#c9dfca]">AGRIVA AI সহকারী</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">আজ আপনার কী সহায়তা দরকার?</h2>
              <p className="mt-2 text-sm leading-6 text-[#d3e5d6]">ফসল, মাটি, আবহাওয়া, বাজার বা কৃষি ব্যবসা—আপনার প্রশ্ন দিয়ে শুরু করুন।</p>
            </div>
            <Link href="/search" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#d3b252] px-6 py-3 font-bold text-[#173b2d] hover:bg-[#e2c36c]">AGRIVA-কে জিজ্ঞাসা করুন <span className="ml-2">→</span></Link>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-xl font-black sm:text-2xl">আপনার নির্বাচিত ভূমিকা</h2><p className="mt-1 text-sm text-[#6a7b6e]">একই account-এ একাধিক ভূমিকা ব্যবহার করতে পারবেন।</p></div>
            <span className="rounded-full border border-[#dce6da] bg-white px-3 py-1.5 text-xs font-bold text-[#3c6b4e]">{roles.length}টি ভূমিকা</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleCards.map(({ role, info }) => (
              <article key={role} className="rounded-2xl border border-[#e1e9df] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3"><div><span className="inline-flex rounded-xl bg-[#edf5eb] px-3 py-2 text-lg"> {role === "farmer" ? "🌾" : role === "buyer" ? "🛒" : role === "seller" || role === "reseller" ? "🏪" : (role === "transport_provider" || role === "transport") ? "🚚" : role === "job_seeker" || role === "worker" || role === "employer" ? "💼" : role === "student" || role === "educator" ? "🎓" : role === "rooftop_gardener" ? "🪴" : role === "admin" ? "🛡️" : "📘"} </span><h3 className="mt-3 text-lg font-extrabold">{info.bn}</h3></div><span className="rounded-full bg-[#eaf4eb] px-2.5 py-1 text-xs font-bold text-[#26734d]">সক্রিয়</span></div>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#647568]">{info.description}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{info.links.map((item) => <Link key={item.href + item.label} href={item.href} className="rounded-xl border border-[#e6ece3] bg-[#fbfcfa] px-3 py-3 text-sm font-bold transition hover:border-[#a8c9aa] hover:bg-[#f0f7ee]">{item.icon} <span className="ml-1">{item.label}</span></Link>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div><h2 className="text-xl font-black sm:text-2xl">দ্রুত প্রবেশ</h2><p className="mt-1 text-sm text-[#6a7b6e]">আপনার account-এর জন্য দরকারি AGRIVA সেবাগুলো।</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {commonLinks.map((item) => <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-[#e1e9df] bg-white p-4 transition hover:border-[#a8c9aa] hover:shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf5eb] text-xl">{item.icon}</span><span><span className="block font-bold">{item.label}</span><span className="mt-1 block text-xs text-[#6a7b6e]">{item.description}</span></span><span className="ml-auto text-[#a67f25] transition group-hover:translate-x-1">→</span></Link>)}
          </div>
        </section>
        <footer className="mt-10 border-t border-[#e0e8dd] py-6 text-center text-xs text-[#718174]">AGRIVA • কৃষি, বাজার, জ্ঞান ও কাজ—একসাথে।</footer>
      </section>

      <MobileDashboardNav active="dashboard" />
    </main>
  );
}
