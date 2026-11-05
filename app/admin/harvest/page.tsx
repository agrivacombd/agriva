import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/admin/authz";

async function moderateHarvestListing(formData: FormData) {
  "use server";
  const listingId = String(formData.get("listing_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!/^[0-9a-f-]{36}$/i.test(listingId) || !["approve", "pause", "reject"].includes(decision)) {
    redirect("/admin/harvest?notice=invalid");
  }
  if (decision === "reject" && !note) redirect("/admin/harvest?notice=reason");

  const { supabase } = await requireAdminPage("harvest.moderate");
  const { data: listing, error: lookupError } = await supabase
    .from("harvest_listings").select("id,status").eq("id", listingId).maybeSingle();
  if (lookupError || !listing) redirect("/admin/harvest?notice=error");
  if (decision === "approve" && listing.status === "sold_out") {
    redirect("/admin/harvest?notice=sold");
  }
  if (decision === "pause" && listing.status !== "available") {
    redirect("/admin/harvest?notice=invalid");
  }

  const p_status = decision === "approve" ? "approved" : decision === "pause" ? "pending" : "rejected";
  const { error } = await supabase.rpc("admin_moderate_harvest_listing", {
    p_listing_id: listingId,
    p_status,
    p_note: note || null,
  });
  revalidatePath("/admin/harvest");
  revalidatePath("/sell-my-harvest");
  redirect(error ? "/admin/harvest?notice=error" : "/admin/harvest?notice=updated");
}

const noticeLabels: Record<string, string> = {
  updated: "ফসলের পোস্টের অবস্থা আপডেট হয়েছে।",
  invalid: "এই পোস্টের বর্তমান অবস্থায় এই action করা যাবে না।",
  reason: "প্রত্যাখ্যানের কারণ লিখতে হবে।",
  sold: "বিক্রি শেষ হওয়া পোস্ট পুনরায় চালু করা যাবে না।",
  error: "আপডেট হয়নি। Admin permission, migration ও database log যাচাই করুন।",
};

export default async function AdminHarvestPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdminPage("harvest.read");
  const { data: listings, error } = await supabase.from("harvest_listings")
    .select("id,seller_name,crop_name,variety,quantity,unit,price_per_unit,district,upazila,image_urls,status,moderation_status,moderation_note,created_at")
    .order("created_at", { ascending: false }).limit(200);
  const unitName = (unit: string) => ({ kg: "কেজি", maund: "মণ", ton: "টন", bag: "বস্তা" }[unit] ?? unit);
  const statusName = (status: string) => ({ available: "বিক্রির জন্য চালু", paused: "সাময়িক বন্ধ", sold_out: "বিক্রি শেষ" }[status] ?? status);
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Sell My Harvest · Moderation</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <div className="mt-7"><h1 className="text-3xl font-black">কৃষকের ফসলের পোস্ট</h1><p className="mt-2 text-sm text-slate-600">পোস্টগুলো যাচাই করুন। প্রয়োজন হলে সাময়িক বন্ধ, প্রত্যাখ্যান অথবা বন্ধ পোস্ট পুনরায় চালু করুন। বিক্রি শেষ হওয়া পোস্ট পুনরায় চালু করা যাবে না।</p></div>
    {params.notice && noticeLabels[params.notice] && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-white p-3 text-sm">{noticeLabels[params.notice]}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">ডেটাবেস থেকে পোস্ট আনা যায়নি। Migration ও RLS policy যাচাই করুন।</p>}
    <div className="mt-6 space-y-4">{(listings ?? []).map((item) => <article key={item.id} className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-[140px_1fr]">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-emerald-50">{item.image_urls?.[0] ? <img src={item.image_urls[0]} alt={item.crop_name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-4xl">🌾</div>}</div>
      <div><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-xl font-black">{item.crop_name}{item.variety ? " · " + item.variety : ""}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold">{statusName(item.status)}</span></div><p className="mt-1 text-sm text-slate-600">বিক্রেতা: {item.seller_name} · {item.upazila ? item.upazila + ", " : ""}{item.district}</p><p className="mt-2 text-sm font-bold">৳{Number(item.price_per_unit).toLocaleString("en-BD")} / {unitName(item.unit)} · পরিমাণ {Number(item.quantity).toLocaleString("en-BD")} {unitName(item.unit)}</p><p className="mt-1 text-xs text-slate-500">পোস্ট: {new Date(item.created_at).toLocaleString("bn-BD")} · মডারেশন: {item.moderation_status}</p>{item.moderation_note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">নোট: {item.moderation_note}</p>}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {item.status === "paused" && item.moderation_status === "pending" && <form action={moderateHarvestListing} className="flex flex-wrap items-center gap-2"><input type="hidden" name="listing_id" value={item.id}/><input type="hidden" name="decision" value="approve"/><button className="min-h-10 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">আবার চালু করুন</button></form>}
        {item.status === "available" && <form action={moderateHarvestListing} className="flex flex-wrap items-center gap-2"><input type="hidden" name="listing_id" value={item.id}/><input type="hidden" name="decision" value="pause"/><button className="min-h-10 rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-900">সাময়িক বন্ধ</button></form>}
        {item.status !== "sold_out" && item.moderation_status !== "rejected" && <form action={moderateHarvestListing} className="flex flex-wrap items-center gap-2"><input type="hidden" name="listing_id" value={item.id}/><input type="hidden" name="decision" value="reject"/><input name="note" required maxLength={500} placeholder="প্রত্যাখ্যানের কারণ" aria-label="প্রত্যাখ্যানের কারণ" className="min-h-10 w-48 rounded-lg border border-slate-300 px-3 text-sm"/><button className="min-h-10 rounded-lg border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800">প্রত্যাখ্যান</button></form>}
      </div></div>
    </article>)}</div>
    {!error && (listings ?? []).length === 0 && <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600">এখনো কোনো ফসল বিক্রির পোস্ট আসেনি।</div>}
  </div></main>;
}
