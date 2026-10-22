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
  return { supabase, user };
}

async function saveSettings(formData: FormData) {
  "use server";
  const ga4 = String(formData.get("ga4_measurement_id") ?? "").trim();
  const verificationInput = String(formData.get("google_site_verification") ?? "").trim();
  const bingInput = String(formData.get("bing_site_verification") ?? "").trim();
  const indexnowKey = String(formData.get("indexnow_key") ?? "").trim();
  const match = verificationInput.match(/<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const verification = match?.[1] ?? verificationInput;
  if (ga4 && !/^G-[A-Z0-9]+$/.test(ga4)) redirect("/admin/site-integrations?notice=invalid_ga");
  if (verification && !/^[A-Za-z0-9_+=\/-]+$/.test(verification)) redirect("/admin/site-integrations?notice=invalid_verification");
  if (bingInput && !/^[A-Za-z0-9_+=/-]+$/.test(bingInput)) redirect("/admin/site-integrations?notice=invalid_bing");
  if (indexnowKey && !/^[A-Za-z0-9-]{8,128}$/.test(indexnowKey)) redirect("/admin/site-integrations?notice=invalid_indexnow");
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase.from("site_public_integrations").upsert({
    id: 1,
    ga4_measurement_id: ga4 || null,
    google_site_verification: verification || null,
    bing_site_verification: bingInput || null,
    indexnow_key: indexnowKey || null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }, { onConflict: "id" });
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-integrations");
  redirect(error ? "/admin/site-integrations?notice=save_error" : "/admin/site-integrations?notice=saved");
}

const notices: Record<string, string> = {
  saved: "Google settings সংরক্ষণ হয়েছে। Production-এ কার্যকর করতে deployment প্রয়োজন হতে পারে।",
  invalid_ga: "Measurement ID সঠিক নয়। G- দিয়ে শুরু হওয়া GA4 ID দিন।",
  invalid_verification: "Verification value সঠিক নয়। শুধু Google meta tag-এর content value দিন।",
  save_error: "সেটিংস সেভ হয়নি। Migration 031 প্রয়োগ করা হয়েছে কি না যাচাই করুন।",
};

export default async function SiteIntegrationsPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_public_integrations").select("ga4_measurement_id,google_site_verification,bing_site_verification,indexnow_key,updated_at").eq("id", 1).maybeSingle();
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f]"><div className="mx-auto max-w-3xl">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#123b27] p-5 text-white"><div><p className="text-sm text-emerald-100">AGRIVA Super Admin</p><h1 className="text-2xl font-black">Search Engine Integrations</h1></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <p className="mt-5 text-sm leading-6 text-slate-600">GA4, Google Search Console, Bing Webmaster Tools এবং IndexNow-এর public setup এখানে রাখুন। Service account JSON/private key এখানে কখনো দেবেন না।</p>
    {params?.notice && <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold">{notices[params.notice] ?? "অবস্থা অজানা।"}</p>}
    <form action={saveSettings} className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow-sm">
      <div><label htmlFor="ga4_measurement_id" className="block text-sm font-bold">Google Analytics 4 Measurement ID</label><input id="ga4_measurement_id" name="ga4_measurement_id" defaultValue={data?.ga4_measurement_id ?? ""} placeholder="G-XXXXXXXXXX" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">GA4 → Admin → Data streams → Web stream থেকে পাওয়া G-... ID।</p></div>
      <div><label htmlFor="google_site_verification" className="block text-sm font-bold">Google Search Console Verification</label><input id="google_site_verification" name="google_site_verification" defaultValue={data?.google_site_verification ?? ""} placeholder="meta tag-এর content value paste করুন" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">শুধু content value দিন, অথবা পুরো google-site-verification meta tag paste করুন। HTML tag method URL-prefix property-এর জন্য; Domain property হলে DNS verification ব্যবহার করুন।</p></div>
      <div><label htmlFor="bing_site_verification" className="block text-sm font-bold">Bing Webmaster Verification</label><input id="bing_site_verification" name="bing_site_verification" defaultValue={data?.bing_site_verification ?? ""} placeholder="Bing meta tag content value" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Bing Webmaster Tools-এর HTML meta verification token; শুধু content value দিন।</p></div>
      <div><label htmlFor="indexnow_key" className="block text-sm font-bold">IndexNow API Key</label><input id="indexnow_key" name="indexnow_key" defaultValue={data?.indexnow_key ?? ""} placeholder="নিজের random key (8-128 chars)" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Save করলে /YOUR-KEY.txt endpoint তৈরি হবে। এটি public verification key; private credential নয়।</p></div>
      <button type="submit" className="rounded-xl bg-[#17452c] px-5 py-3 font-bold text-white">Save Search Settings</button>
    </form>
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>প্রয়োজনীয়:</strong> প্রথমে <code>supabase/migrations/031_google_site_integrations.sql</code> migration apply করতে হবে। Save করার পর home page source-এ <code>google-site-verification</code> tag আছে কি না দেখে Search Console-এ Verify চাপুন। Analytics data দেখতে GA4-এ কিছু সময় লাগতে পারে.</section>
    {data?.updated_at && <p className="mt-3 text-xs text-slate-500">Last saved: {new Date(data.updated_at).toLocaleString("en-BD")}</p>}
  </div></main>;
}
