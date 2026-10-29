import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Application = {
  id: string; company_name: string; status: "pending" | "approved" | "rejected";
  review_reason: string | null; created_at: string; reviewed_at: string | null;
};
type Company = {
  id: string; company_name: string; legal_name: string | null; registration_number: string | null;
  contact_phone: string; business_email: string; district: string; website: string | null;
  verification_status: "verified" | "suspended"; verified_at: string; product_categories: string[];
};

export default async function CompanyDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=/company/dashboard");

  const [{ data: application, error: applicationError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from("seed_company_applications")
      .select("id,company_name,status,review_reason,created_at,reviewed_at")
      .eq("applicant_user_id", user.id).maybeSingle(),
    supabase.from("seed_companies")
      .select("id,company_name,legal_name,registration_number,contact_phone,business_email,district,website,verification_status,verified_at,product_categories")
      .eq("owner_user_id", user.id).maybeSingle(),
  ]);
  const currentApplication = application as Application | null;
  const verifiedCompany = company as Company | null;

  return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#123f30] p-6 text-white sm:p-8">
        <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-200">AGRIVA Company Portal</p><h1 className="mt-2 text-3xl font-black">কোম্পানি ড্যাশবোর্ড</h1><p className="mt-2 text-sm text-emerald-50/85">কোম্পানির আবেদন ও যাচাইয়ের অবস্থা এক জায়গায় দেখুন।</p></div>
        <Link href="/marketplace" className="rounded-xl border border-white/25 px-4 py-2.5 text-sm font-bold hover:bg-white/10">Marketplace দেখুন</Link>
      </header>

      {(applicationError || companyError) && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">কোম্পানির তথ্য লোড করা যায়নি। Company onboarding migration প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}

      {verifiedCompany ? <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700">Verified Company</p><h2 className="mt-2 text-2xl font-black">{verifiedCompany.company_name}</h2><p className="mt-2 text-sm text-slate-600">AGRIVA-তে কোম্পানির পরিচয় যাচাই সম্পন্ন হয়েছে।</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${verifiedCompany.verification_status === "verified" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{verifiedCompany.verification_status === "verified" ? "যাচাইকৃত কোম্পানি" : "সাময়িক স্থগিত"}</span></div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">আইনগত নাম</dt><dd className="mt-1 font-bold">{verifiedCompany.legal_name || "উল্লেখ করা হয়নি"}</dd></div>
          <div><dt className="text-sm text-slate-500">নিবন্ধন / লাইসেন্স</dt><dd className="mt-1 font-bold">{verifiedCompany.registration_number || "উল্লেখ করা হয়নি"}</dd></div>
          <div><dt className="text-sm text-slate-500">যোগাযোগ</dt><dd className="mt-1 font-bold">{verifiedCompany.contact_phone} · {verifiedCompany.business_email}</dd></div>
          <div><dt className="text-sm text-slate-500">জেলা</dt><dd className="mt-1 font-bold">{verifiedCompany.district}</dd></div>
        </dl>
        {verifiedCompany.verification_status === "verified" ? <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-extrabold text-blue-950">পরবর্তী ধাপ: কোম্পানির পণ্য ক্যাটালগ</p><p className="mt-2 text-sm leading-6 text-blue-900">কোম্পানির পণ্য যোগ করার আগে কোম্পানি-ভিত্তিক ownership, স্টক, মূল্য ও moderation workflow সংযুক্ত করতে হবে। এই পর্যায়ে ভুলভাবে সাধারণ Seller বা AGRIVA Official হিসেবে পণ্য প্রকাশের সুযোগ রাখা হয়নি।</p></div> : <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">আপনার কোম্পানির অ্যাকাউন্ট সাময়িকভাবে স্থগিত। AGRIVA সহায়তা দলের সঙ্গে যোগাযোগ করুন।</p>}
      </section> : currentApplication ? <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-emerald-700">Company application</p><h2 className="mt-2 text-2xl font-black">{currentApplication.company_name}</h2>
        <div className={`mt-5 rounded-xl p-4 ${currentApplication.status === "pending" ? "bg-amber-50 text-amber-950" : "bg-rose-50 text-rose-950"}`}>
          <p className="font-extrabold">{currentApplication.status === "pending" ? "আবেদন যাচাইয়ের অপেক্ষায়" : "আবেদন প্রত্যাখ্যাত"}</p>
          <p className="mt-2 text-sm leading-6">{currentApplication.status === "pending" ? "AGRIVA টিম কোম্পানির তথ্য যাচাই করবে। অনুমোদনের আগে কোম্পানি হিসেবে পণ্য প্রকাশ করা যাবে না।" : currentApplication.review_reason || "আবেদনটি অনুমোদিত হয়নি। তথ্য সংশোধন করে পুনরায় জমা দিতে পারেন।"}</p>
          {currentApplication.status === "rejected" && <Link href="/company/apply" className="mt-4 inline-flex rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white">সংশোধন করে আবার আবেদন করুন</Link>}
        </div>
        <p className="mt-4 text-xs text-slate-500">আবেদনের তারিখ: {new Date(currentApplication.created_at).toLocaleDateString("bn-BD")}</p>
      </section> : <section className="mt-6 rounded-2xl border border-dashed border-emerald-900/20 bg-white p-8 text-center sm:p-12">
        <h2 className="text-2xl font-black">আপনার কোম্পানিকে AGRIVA-তে যুক্ত করুন</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">কোম্পানির তথ্য জমা দিন। AGRIVA যাচাই ও অনুমোদনের পর কোম্পানির পরিচয় সক্রিয় হবে।</p><Link href="/company/apply" className="mt-6 inline-flex rounded-xl bg-emerald-900 px-5 py-3 font-extrabold text-white hover:bg-emerald-800">কোম্পানির আবেদন শুরু করুন</Link>
      </section>}
      <p className="mt-6 text-center text-xs leading-5 text-slate-500">কোম্পানির আবেদন বা যাচাইকৃত অবস্থার ভিত্তিতে সাধারণ Seller permission স্বয়ংক্রিয়ভাবে পরিবর্তন করা হয় না। কোম্পানির অনুমতি আলাদাভাবে নিয়ন্ত্রিত হবে।</p>
    </div>
  </main>;
}
