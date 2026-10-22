import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

async function moderateHarvest(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!id || !["approved", "rejected", "pending"].includes(action)) redirect("/admin/harvest?notice=invalid");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("harvest_listings").update({ moderation_status: action, moderation_note: note || null }).eq("id", id);
  revalidatePath("/admin/harvest");
  revalidatePath("/sell-harvest");
  redirect(error ? "/admin/harvest?notice=error" : "/admin/harvest?notice=saved");
}

export default async function AdminHarvestPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const supabase = await requireAdmin();
  const { data: listings, error } = await supabase.from("harvest_listings")
    .select("id,seller_name,crop_name,variety,quantity,unit,price_per_unit,district,upazila,image_urls,status,moderation_status,moderation_note,created_at")
    .order("created_at", { ascending: false }).limit(200);
  const pendingCount = (listings ?? []).filter((item) => item.moderation_status === "pending").length;
  const unitName = (unit: string) => ({ kg: "কেজি", maund: "মণ", ton: "টন", bag: "বস্তা" }[unit] ?? unit);
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Sell My Harvest · Moderation queue</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <div className="mt-7 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black">কৃষকের ফসলের পোস্ট যাচাই</h1><p className="mt-2 text-sm text-slate-600">পোস্টের তথ্য যাচাই করে অনুমোদন দিন বা কারণ উল্লেখ করে প্রত্যাখ্যান করুন।</p></div><span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">অপেক্ষমাণ: {pendingCount}</span></div>
    {params?.notice && <p role="status" className="mt-5 rounded-xl bg-white p-3 text-sm font-semibold">{params.notice === "saved" ? "পোস্টের moderation status আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "অনুরোধটি যাচাই করুন।" : "আপডেট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"}</p>}
    {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">ডেটাবেস থেকে পোস্ট আনা যায়নি। Migration ও RLS policy যাচাই করুন।</p>}
    <div className="mt-6 space-y-4">{(listings ?? []).map((item) => <article key={item.id} className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-[140px_1fr]">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-emerald-50">{item.image_urls?.[0] ? <img src={item.image_urls[0]} alt={item.crop_name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-4xl">🌾</div>}</div>
      <div><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">{item.crop_name}{item.variety ? " · " + item.variety : ""}</h2><p className="mt-1 text-sm text-slate-600">বিক্রেতা: {item.seller_name} · {item.upazila ? item.upazila + ", " : ""}{item.district}</p><p className="mt-2 text-sm font-bold">৳{Number(item.price_per_unit).toLocaleString("en-BD")} / {unitName(item.unit)} · পরিমাণ {Number(item.quantity).toLocaleString("en-BD")} {unitName(item.unit)}</p><p className="mt-1 text-xs text-slate-500">পোস্ট: {new Date(item.created_at).toLocaleString("bn-BD")} · বিক্রির অবস্থা: {item.status}</p></div><span className={"rounded-full px-3 py-1 text-xs font-black " + (item.moderation_status === "approved" ? "bg-emerald-100 text-emerald-900" : item.moderation_status === "rejected" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900")}>{item.moderation_status === "approved" ? "অনুমোদিত" : item.moderation_status === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}</span></div>
      {item.moderation_note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">নোট: {item.moderation_note}</p>}
      <form action={moderateHarvest} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><input type="hidden" name="id" value={item.id}/><label className="flex-1 text-xs font-bold text-slate-600">মডারেশনের নোট (ঐচ্ছিক)<input name="note" maxLength={500} defaultValue={item.moderation_note ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal" placeholder="যাচাইয়ের কারণ / সংশোধনের নির্দেশ"/></label><div className="flex flex-wrap gap-2"><button name="action" value="approved" className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">অনুমোদন</button><button name="action" value="rejected" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-800">প্রত্যাখ্যান</button><button name="action" value="pending" className="rounded-xl border px-4 py-2.5 text-sm font-bold">অপেক্ষমাণ</button></div></form></div>
    </article>)}</div>
    {!error && (listings ?? []).length === 0 && <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600">এখনো কোনো ফসল বিক্রির পোস্ট আসেনি।</div>}
  </div></main>;
}
