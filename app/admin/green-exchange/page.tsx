import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorizePermission } from "@/lib/auth/server-authorization";

async function requireAdmin() {
  const auth = await authorizePermission("exchange.moderate");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=%2Fadmin%2Fgreen-exchange");
    redirect("/dashboard");
  }
  return auth.supabase;
}

async function moderateListing(formData: FormData) {
  "use server";
  const listingId = String(formData.get("listing_id") ?? "").trim();
  const status = String(formData.get("moderation_status") ?? "").trim();
  if (!listingId || !/^[0-9a-f-]{36}$/i.test(listingId) || !["approved", "rejected", "pending"].includes(status)) {
    redirect("/admin/green-exchange?notice=invalid");
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_moderate_green_exchange_listing", {
    p_listing_id: listingId,
    p_moderation_status: status,
  });
  revalidatePath("/admin/green-exchange");
  revalidatePath("/green-exchange");
  revalidatePath("/green-exchange/board");
  revalidatePath("/sitemap.xml");
  redirect(error ? "/admin/green-exchange?notice=error" : "/admin/green-exchange?notice=updated");
}

const statusLabels: Record<string, string> = {
  pending: "অনুমোদনের অপেক্ষায়",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
};
const noticeLabels: Record<string, string> = {
  updated: "পোস্টের মডারেশন স্ট্যাটাস আপডেট হয়েছে।",
  error: "আপডেট হয়নি। migration প্রয়োগ, admin role এবং ডেটাবেস লগ যাচাই করুন।",
  invalid: "ফর্মের তথ্য সঠিক নয়।",
};

type SearchParams = { status?: string; notice?: string };

export default async function AdminGreenExchangePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const supabase = await requireAdmin();
  const status = ["pending", "approved", "rejected"].includes(params.status ?? "") ? params.status! : "pending";
  const { data: listings, error } = await supabase
    .from("green_exchange_listings")
    .select("id,title,plant_name,description,exchange_type,area,district,quantity,status,moderation_status,created_at,owner_id")
    .eq("moderation_status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm font-bold text-emerald-800 underline underline-offset-4">← Admin Dashboard</Link>
        <header className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">AGRIVA ADMIN</p>
          <h1 className="mt-2 text-3xl font-extrabold">Green Exchange মডারেশন</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">পোস্টের মান ও নিরাপত্তা যাচাই করে অনুমোদন দিন। অনুমোদিত ও সক্রিয় পোস্টই পাবলিক বোর্ড এবং sitemap-এ দেখানো হবে।</p>
        </header>
        {params.notice && noticeLabels[params.notice] && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">{noticeLabels[params.notice]}</p>}
        <nav aria-label="মডারেশন স্ট্যাটাস" className="mt-6 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected"] as const).map((item) => (
            <Link key={item} href={`/admin/green-exchange?status=${item}`} aria-current={status === item ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${status === item ? "bg-emerald-800 text-white" : "border border-emerald-200 bg-white text-emerald-900"}`}>
              {statusLabels[item]}
            </Link>
          ))}
        </nav>
        {error ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-6">
            <h2 className="font-bold">মডারেশন ডেটা লোড করা যায়নি</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Green Exchange migration এখনো প্রয়োগ না হলে এই পেজ কাজ করবে না। নিরাপদ migration reconciliation শেষ করে পুনরায় চেষ্টা করুন।</p>
          </div>
        ) : !listings?.length ? (
          <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center">
            <h2 className="text-lg font-bold">এই তালিকায় কোনো পোস্ট নেই</h2>
            <p className="mt-2 text-sm text-slate-600">নতুন পোস্ট জমা হলে এখানে দেখা যাবে।</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {listings.map((item) => (
              <article key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">{item.plant_name}</p>
                    <h2 className="mt-1 text-lg font-extrabold">{item.title}</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">{statusLabels[item.moderation_status] ?? item.moderation_status}</span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{item.description}</p>
                <p className="mt-3 text-sm text-slate-600">এলাকা: {item.area}{item.district ? `, ${item.district}` : ""} · পরিমাণ: {item.quantity}</p>
                <p className="mt-1 break-all text-xs text-slate-400">Owner ID: {item.owner_id} · {new Date(item.created_at).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</p>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {item.moderation_status !== "approved" && <form action={moderateListing}><input type="hidden" name="listing_id" value={item.id} /><input type="hidden" name="moderation_status" value="approved" /><button className="min-h-10 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">অনুমোদন করুন</button></form>}
                  {item.moderation_status !== "rejected" && <form action={moderateListing}><input type="hidden" name="listing_id" value={item.id} /><input type="hidden" name="moderation_status" value="rejected" /><button className="min-h-10 rounded-lg border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800">প্রত্যাখ্যান</button></form>}
                  {item.moderation_status !== "pending" && <form action={moderateListing}><input type="hidden" name="listing_id" value={item.id} /><input type="hidden" name="moderation_status" value="pending" /><button className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">পুনরায় যাচাইয়ে পাঠান</button></form>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
