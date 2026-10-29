import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorizePermission } from "@/lib/auth/server-authorization";

async function requireCompanyReviewer() {
  const auth = await authorizePermission("users.manage");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/admin/companies");
    redirect("/dashboard");
  }
  if (!auth.roles.some((role) => role === "admin" || role === "super_admin")) redirect("/dashboard");
  return auth;
}

async function reviewApplication(formData: FormData) {
  "use server";
  const id = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["approve", "reject"].includes(decision)) redirect("/admin/companies?notice=invalid");
  if (decision === "reject" && (reason.length < 3 || reason.length > 1000)) redirect("/admin/companies?notice=reason");
  const auth = await requireCompanyReviewer();
  const { error } = await auth.supabase.rpc("admin_review_seed_company_application", {
    p_application_id: id,
    p_decision: decision,
    p_reason: decision === "reject" ? reason : null,
  });
  revalidatePath("/admin/companies");
  revalidatePath("/company/dashboard");
  revalidatePath("/admin");
  redirect(error ? "/admin/companies?notice=error" : "/admin/companies?notice=saved");
}

type Application = {
  id: string; applicant_user_id: string; company_name: string; legal_name: string | null;
  registration_number: string | null; contact_phone: string; business_email: string;
  district: string; website: string | null; product_categories: string[]; notes: string | null;
  status: "pending" | "approved" | "rejected"; created_at: string;
};

const categoryLabels: Record<string, string> = {
  seeds: "বীজ", fertilizers: "সার", "crop-protection": "ফসল সুরক্ষা",
  machinery: "কৃষি যন্ত্রপাতি", other: "অন্যান্য",
};

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const auth = await requireCompanyReviewer();
  const { notice } = await searchParams;
  const { data, error } = await auth.supabase.from("seed_company_applications")
    .select("id,applicant_user_id,company_name,legal_name,registration_number,contact_phone,business_email,district,website,product_categories,notes,status,created_at")
    .order("created_at", { ascending: false }).limit(100);
  const applications = (data ?? []) as Application[];
  const notices: Record<string, string> = {
    saved: "কোম্পানির আবেদনের সিদ্ধান্ত সংরক্ষণ হয়েছে।",
    error: "সিদ্ধান্ত সংরক্ষণ হয়নি। Migration ও database permission যাচাই করুন।",
    invalid: "আবেদন বা সিদ্ধান্ত সঠিক নয়।",
    reason: "প্রত্যাখ্যানের কারণ ৩–১০০০ অক্ষরের হতে হবে।",
  };

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#123b27] p-6 text-white">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-100">AGRIVA • Company governance</p><h1 className="mt-2 text-3xl font-black">Seed Company Applications</h1><p className="mt-2 text-sm text-emerald-50">কোম্পানির পরিচয় যাচাই করে অনুমোদন বা কারণসহ প্রত্যাখ্যান করুন।</p></div>
        <Link href="/admin" className="rounded-xl border border-white/25 px-4 py-2 text-sm font-bold hover:bg-white/10">Admin dashboard</Link>
      </header>
      {notice && notices[notice] && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notices[notice]}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">আবেদন লোড করা যায়নি। Company onboarding migration প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
      <div className="mt-6 flex flex-wrap gap-3"><span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900">Pending: {applications.filter((a) => a.status === "pending").length}</span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-900">Approved: {applications.filter((a) => a.status === "approved").length}</span><span className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700">Rejected: {applications.filter((a) => a.status === "rejected").length}</span></div>
      <section className="mt-6 space-y-4">
        {applications.map((application) => <article key={application.id} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">{application.company_name}</h2><p className="mt-1 text-sm text-slate-500">আবেদন: {new Date(application.created_at).toLocaleDateString("bn-BD")} · ID {application.id.slice(0, 8)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${application.status === "pending" ? "bg-amber-100 text-amber-900" : application.status === "approved" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{application.status === "pending" ? "যাচাই অপেক্ষমাণ" : application.status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"}</span></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-slate-500">আইনগত নাম</dt><dd className="mt-1 font-semibold">{application.legal_name || "উল্লেখ করা হয়নি"}</dd></div>
            <div><dt className="text-slate-500">নিবন্ধন / লাইসেন্স</dt><dd className="mt-1 font-semibold">{application.registration_number || "উল্লেখ করা হয়নি"}</dd></div>
            <div><dt className="text-slate-500">ফোন</dt><dd className="mt-1 font-semibold">{application.contact_phone}</dd></div>
            <div><dt className="text-slate-500">ব্যবসায়িক ইমেইল</dt><dd className="mt-1 break-words font-semibold">{application.business_email}</dd></div>
            <div><dt className="text-slate-500">জেলা</dt><dd className="mt-1 font-semibold">{application.district}</dd></div>
            <div><dt className="text-slate-500">ওয়েবসাইট</dt><dd className="mt-1 break-words font-semibold">{application.website || "উল্লেখ করা হয়নি"}</dd></div>
            <div className="sm:col-span-2 lg:col-span-3"><dt className="text-slate-500">পণ্যের ধরন</dt><dd className="mt-1 font-semibold">{(application.product_categories ?? []).map((category) => categoryLabels[category] || category).join(", ")}</dd></div>
            {application.notes && <div className="sm:col-span-2 lg:col-span-3"><dt className="text-slate-500">অতিরিক্ত তথ্য</dt><dd className="mt-1 whitespace-pre-wrap">{application.notes}</dd></div>}
          </dl>
          {application.status === "pending" && <form action={reviewApplication} className="mt-5 border-t border-slate-100 pt-5">
            <input type="hidden" name="applicationId" value={application.id} />
            <label className="block text-sm font-bold">প্রত্যাখ্যান করলে কারণ লিখুন (অনুমোদনের ক্ষেত্রে ঐচ্ছিক)
              <textarea name="reason" maxLength={1000} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" placeholder="কাগজপত্র বা তথ্যের ঘাটতি থাকলে স্পষ্ট করে লিখুন" />
            </label>
            <div className="mt-3 flex flex-wrap gap-3"><button name="decision" value="approve" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">কোম্পানি অনুমোদন করুন</button><button name="decision" value="reject" className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-extrabold text-rose-900 hover:bg-rose-100">প্রত্যাখ্যান করুন</button></div>
          </form>}
        </article>)}
        {!applications.length && !error && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-extrabold">এখনো কোনো আবেদন নেই</h2><p className="mt-2 text-sm text-slate-600">কোম্পানি আবেদন করলে এখানে দেখা যাবে।</p></div>}
      </section>
    </div>
  </main>;
}
