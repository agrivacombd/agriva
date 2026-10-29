import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";

async function requireAdmin(capability: AdminCapability = "transport.read") {
  const { supabase, user } = await requireAdminPage(capability);
  return supabase;
}

async function reviewTransportPartner(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!userId || !["verified", "rejected", "suspended"].includes(status) || note.length > 1000) {
    redirect("/admin/transport?notice=invalid");
  }
  const supabase = await requireAdmin("transport.moderate");
  const { error } = await supabase.rpc("admin_set_transport_partner_verification", {
    p_user_id: userId,
    p_status: status,
    p_note: note,
  });
  revalidatePath("/admin/transport");
  revalidatePath("/transport");
  redirect(error ? "/admin/transport?notice=error" : "/admin/transport?notice=updated");
}

const statusLabels: Record<string, string> = {
  pending: "পর্যালোচনার অপেক্ষায়",
  verified: "যাচাইকৃত",
  rejected: "প্রত্যাখ্যাত",
  suspended: "স্থগিত",
};
const vehicleLabels: Record<string, string> = {
  van: "ভ্যান / ছোট যান",
  pickup: "পিকআপ",
  truck: "ট্রাক",
  covered: "কাভার্ড ভ্যান",
  refrigerated: "রেফ্রিজারেটেড গাড়ি",
};
const noticeLabels: Record<string, string> = {
  updated: "পার্টনারের যাচাই-স্ট্যাটাস আপডেট হয়েছে।",
  error: "আপডেট হয়নি। আপনার অ্যাডমিন অনুমতি ও ডেটাবেস মাইগ্রেশন যাচাই করুন।",
  invalid: "ফর্মের তথ্য সঠিক নয়।",
};

type SearchParams = { notice?: string; status?: string };

export default async function AdminTransportPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await requireAdmin();
  const selectedStatus = ["pending", "verified", "rejected", "suspended", "all"].includes(searchParams?.status ?? "")
    ? (searchParams?.status ?? "pending")
    : "pending";

  let query = supabase
    .from("transport_partners")
    .select("user_id,full_name,phone,district,vehicle_type,capacity_kg,vehicle_registration,notes,verification_status,created_at,reviewed_at,verification_note")
    .order("created_at", { ascending: false })
    .limit(100);
  if (selectedStatus !== "all") query = query.eq("verification_status", selectedStatus);
  const { data, error } = await query;
  const partners = data ?? [];

  return (
    <main className="min-h-screen bg-[#f4f7f1] text-[#17351f]">
      <header className="border-b border-[#dfe8dc] bg-[#123b27] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div><Link href="/" className="text-2xl font-black">AGRIVA<span className="text-[#d9b85b]">.</span></Link><p className="mt-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">Transport partner review</p></div>
          <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">← অ্যাডমিন প্যানেল</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-[#a47b20]">Partner verification</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">পরিবহন পার্টনার যাচাই</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">গাড়ির তথ্য, নিবন্ধন নম্বর ও যোগাযোগের তথ্য যাচাই করে আবেদন অনুমোদন, প্রত্যাখ্যান বা স্থগিত করুন। শুধু যাচাইকৃত পার্টনাররা ভাড়ার অফার দিতে পারবেন।</p>

        {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${searchParams.notice === "error" || searchParams.notice === "invalid" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{noticeLabels[searchParams.notice] ?? "অপারেশন সম্পন্ন হয়েছে।"}</p>}

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="আবেদনের স্ট্যাটাস">
          {[
            ["pending", "অপেক্ষমাণ"],
            ["verified", "যাচাইকৃত"],
            ["rejected", "প্রত্যাখ্যাত"],
            ["suspended", "স্থগিত"],
            ["all", "সব আবেদন"],
          ].map(([value, label]) => <Link key={value} href={`/admin/transport?status=${value}`} className={`rounded-full border px-4 py-2 text-sm font-bold ${selectedStatus === value ? "border-[#17452c] bg-[#17452c] text-white" : "border-[#d9e3d5] bg-white text-[#34543b] hover:border-[#36764a]"}`}>{label}</Link>)}
        </nav>

        {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">আবেদন লোড করা যায়নি। নতুন migration প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
        {!error && partners.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-[#cbdcc7] bg-white p-10 text-center"><h2 className="text-xl font-black">কোনো আবেদন নেই</h2><p className="mt-2 text-sm text-[#68786b]">এই ক্যাটাগরিতে এখনো কোনো পরিবহন পার্টনার নেই।</p></div>}

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {partners.map(partner => <article key={partner.user_id} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-black">{partner.full_name}</h2><p className="mt-1 text-sm text-[#68786b]">{partner.district} জেলা · {vehicleLabels[partner.vehicle_type] ?? partner.vehicle_type}</p></div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-black ${partner.verification_status === "verified" ? "bg-emerald-100 text-emerald-800" : partner.verification_status === "pending" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"}`}>{statusLabels[partner.verification_status] ?? partner.verification_status}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-[#f7faf5] p-3"><dt className="text-xs text-[#68786b]">ফোন</dt><dd className="mt-1 font-bold">{partner.phone}</dd></div>
              <div className="rounded-xl bg-[#f7faf5] p-3"><dt className="text-xs text-[#68786b]">গাড়ির নিবন্ধন</dt><dd className="mt-1 font-bold">{partner.vehicle_registration}</dd></div>
              <div className="rounded-xl bg-[#f7faf5] p-3"><dt className="text-xs text-[#68786b]">বহনক্ষমতা</dt><dd className="mt-1 font-bold">{partner.capacity_kg} কেজি</dd></div>
              <div className="rounded-xl bg-[#f7faf5] p-3"><dt className="text-xs text-[#68786b]">আবেদনের তারিখ</dt><dd className="mt-1 font-bold">{new Date(partner.created_at).toLocaleDateString("bn-BD")}</dd></div>
            </dl>
            {partner.notes && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#f7faf5] p-3 text-sm leading-6"><span className="font-bold">অতিরিক্ত তথ্য: </span>{partner.notes}</p>}
            {partner.reviewed_at && <p className="mt-3 text-xs text-[#68786b]">সর্বশেষ পর্যালোচনা: {new Date(partner.reviewed_at).toLocaleDateString("bn-BD")} {partner.verification_note ? `· নোট: ${partner.verification_note}` : ""}</p>}
            <form action={reviewTransportPartner} className="mt-4 border-t border-[#e7ede4] pt-4">
              <input type="hidden" name="userId" value={partner.user_id} />
              <label className="block text-sm font-bold">পর্যালোচনার নোট (ঐচ্ছিক)
                <textarea name="note" maxLength={1000} defaultValue={partner.verification_note ?? ""} rows={2} className="mt-1.5 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" placeholder="যাচাইয়ের সংক্ষিপ্ত কারণ লিখুন" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {partner.verification_status !== "verified" && <button name="status" value="verified" className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#22613d]">✓ অনুমোদন করুন</button>}
                {partner.verification_status !== "rejected" && <button name="status" value="rejected" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-800 hover:bg-rose-100">প্রত্যাখ্যান</button>}
                {partner.verification_status !== "suspended" && <button name="status" value="suspended" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100">স্থগিত করুন</button>}
              </div>
            </form>
          </article>)}
        </section>
        <p className="mt-8 text-center text-xs text-[#879187]">সার্ভার-সাইড admin role check এবং database RPC authorization দ্বারা সুরক্ষিত।</p>
      </div>
    </main>
  );
}
