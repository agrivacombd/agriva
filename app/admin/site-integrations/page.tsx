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
  const merchantVerification = String(formData.get("merchant_center_verification") ?? "").trim();
  const yandexVerification = String(formData.get("yandex_verification") ?? "").trim();
  const pinterestVerification = String(formData.get("pinterest_verification") ?? "").trim();
  const facebookVerification = String(formData.get("facebook_domain_verification") ?? "").trim();
  const tiktokVerification = String(formData.get("tiktok_verification") ?? "").trim();
  const gtmId = String(formData.get("google_tag_manager_id") ?? "").trim();
  const googleAdsId = String(formData.get("google_ads_conversion_id") ?? "").trim();
  const match = verificationInput.match(/<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const verification = match?.[1] ?? verificationInput;
  if (ga4 && !/^G-[A-Z0-9]+$/.test(ga4)) redirect("/admin/site-integrations?notice=invalid_ga");
  if (verification && !/^[A-Za-z0-9_+=\/-]+$/.test(verification)) redirect("/admin/site-integrations?notice=invalid_verification");
  if (bingInput && !/^[A-Za-z0-9_+=/-]+$/.test(bingInput)) redirect("/admin/site-integrations?notice=invalid_bing");
  if (indexnowKey && !/^[A-Za-z0-9-]{8,128}$/.test(indexnowKey)) redirect("/admin/site-integrations?notice=invalid_indexnow");
  const tokenPattern = /^[A-Za-z0-9_+=/-]+$/;
  if ([merchantVerification,yandexVerification,pinterestVerification,facebookVerification,tiktokVerification].some(v => v && !tokenPattern.test(v))) redirect("/admin/site-integrations?notice=invalid_verification");
  if (gtmId && !/^GTM-[A-Z0-9]+$/.test(gtmId)) redirect("/admin/site-integrations?notice=invalid_gtm");
  if (googleAdsId && !/^AW-[0-9]+$/.test(googleAdsId)) redirect("/admin/site-integrations?notice=invalid_ads");
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase.from("site_public_integrations").upsert({
    id: 1,
    ga4_measurement_id: ga4 || null,
    google_site_verification: verification || null,
    bing_site_verification: bingInput || null,
    indexnow_key: indexnowKey || null,
    merchant_center_verification: merchantVerification || null,
    yandex_verification: yandexVerification || null,
    pinterest_verification: pinterestVerification || null,
    facebook_domain_verification: facebookVerification || null,
    tiktok_verification: tiktokVerification || null,
    google_tag_manager_id: gtmId || null,
    google_ads_conversion_id: googleAdsId || null,
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
  save_error: "সেটিংস সেভ হয়নি। Migration 031/032 প্রয়োগ করা হয়েছে কি না যাচাই করুন.",
  invalid_gtm: "Google Tag Manager ID অবশ্যই GTM- দিয়ে শুরু হতে হবে।",
  invalid_ads: "Google Ads Conversion ID অবশ্যই AW- দিয়ে শুরু হতে হবে.",
};

export default async function SiteIntegrationsPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_public_integrations").select("ga4_measurement_id,google_site_verification,bing_site_verification,indexnow_key,merchant_center_verification,yandex_verification,pinterest_verification,facebook_domain_verification,tiktok_verification,google_tag_manager_id,google_ads_conversion_id,updated_at").eq("id", 1).maybeSingle();
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f]"><div className="mx-auto max-w-3xl">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#123b27] p-5 text-white"><div><p className="text-sm text-emerald-100">AGRIVA Super Admin</p><h1 className="text-2xl font-black">Search Engine Integrations</h1></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <p className="mt-5 text-sm leading-6 text-slate-600">GA4, Google Search Console, Bing Webmaster Tools এবং IndexNow-এর public setup এখানে রাখুন। Service account JSON/private key এখানে কখনো দেবেন না।</p>
    {params?.notice && <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold">{notices[params.notice] ?? "অবস্থা অজানা।"}</p>}
    <form action={saveSettings} className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow-sm">
      <div><label htmlFor="ga4_measurement_id" className="block text-sm font-bold">Google Analytics 4 Measurement ID</label><input id="ga4_measurement_id" name="ga4_measurement_id" defaultValue={data?.ga4_measurement_id ?? ""} placeholder="G-XXXXXXXXXX" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">GA4 → Admin → Data streams → Web stream থেকে পাওয়া G-... ID।</p></div>
      <div><label htmlFor="google_site_verification" className="block text-sm font-bold">Google Search Console Verification</label><input id="google_site_verification" name="google_site_verification" defaultValue={data?.google_site_verification ?? ""} placeholder="meta tag-এর content value paste করুন" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">শুধু content value দিন, অথবা পুরো google-site-verification meta tag paste করুন। HTML tag method URL-prefix property-এর জন্য; Domain property হলে DNS verification ব্যবহার করুন।</p></div>
      <div><label htmlFor="bing_site_verification" className="block text-sm font-bold">Bing Webmaster Verification</label><input id="bing_site_verification" name="bing_site_verification" defaultValue={data?.bing_site_verification ?? ""} placeholder="Bing meta tag content value" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Bing Webmaster Tools-এর HTML meta verification token; শুধু content value দিন।</p></div>
      <div><label htmlFor="indexnow_key" className="block text-sm font-bold">IndexNow API Key</label><input id="indexnow_key" name="indexnow_key" defaultValue={data?.indexnow_key ?? ""} placeholder="নিজের random key (8-128 chars)" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Save করলে /YOUR-KEY.txt endpoint তৈরি হবে। এটি public verification key; private credential নয়।</p></div>
      <div><label htmlFor="merchant_center_verification" className="block text-sm font-bold">Google Merchant Center Website Verification</label><input id="merchant_center_verification" name="merchant_center_verification" defaultValue={data?.merchant_center_verification ?? ""} placeholder="Merchant Center verification token" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Merchant Center থেকে পাওয়া website verification token; save করে Merchant Center-এ verify/claim করুন.</p></div>
      <div><label htmlFor="yandex_verification" className="block text-sm font-bold">Yandex Webmaster Verification</label><input id="yandex_verification" name="yandex_verification" defaultValue={data?.yandex_verification ?? ""} placeholder="Yandex verification content" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Yandex Webmaster meta tag-এর content value.</p></div>
      <div><label htmlFor="pinterest_verification" className="block text-sm font-bold">Pinterest Website Verification</label><input id="pinterest_verification" name="pinterest_verification" defaultValue={data?.pinterest_verification ?? ""} placeholder="Pinterest verification content" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Pinterest claimed website meta tag-এর content value.</p></div>
      <div><label htmlFor="facebook_domain_verification" className="block text-sm font-bold">Meta / Facebook Domain Verification</label><input id="facebook_domain_verification" name="facebook_domain_verification" defaultValue={data?.facebook_domain_verification ?? ""} placeholder="facebook-domain-verification token" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Meta Business Settings → Brand safety → Domains থেকে পাওয়া token.</p></div>
      <div><label htmlFor="tiktok_verification" className="block text-sm font-bold">TikTok Website Verification</label><input id="tiktok_verification" name="tiktok_verification" defaultValue={data?.tiktok_verification ?? ""} placeholder="TikTok verification content" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">TikTok account-এ website meta verification method দেখালে সেই content value দিন.</p></div>
      <div><label htmlFor="google_tag_manager_id" className="block text-sm font-bold">Google Tag Manager Container ID</label><input id="google_tag_manager_id" name="google_tag_manager_id" defaultValue={data?.google_tag_manager_id ?? ""} placeholder="GTM-XXXXXXX" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">Optional GTM container ID; GTM-এর ভিতরে tags publish এবং privacy/consent আলাদা configure করুন.</p></div>
      <div><label htmlFor="google_ads_conversion_id" className="block text-sm font-bold">Google Ads Conversion ID</label><input id="google_ads_conversion_id" name="google_ads_conversion_id" defaultValue={data?.google_ads_conversion_id ?? ""} placeholder="AW-XXXXXXXXX" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono" /><p className="mt-1 text-xs text-slate-500">শুধু ID বসালে conversion events/labels তৈরি হয় না; tracking tags configure করতে হবে.</p></div>
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">GA4/Search Console full reports-এর জন্য server-side service account credentials environment variables-এ রাখতে হবে। এখানে কখনো private key বা service-account JSON paste করবেন না.</p>
      <button type="submit" className="rounded-xl bg-[#17452c] px-5 py-3 font-bold text-white">Save All Verification & Analytics Settings</button>
    </form>
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>প্রয়োজনীয়:</strong> প্রথমে <code>supabase/migrations/031_google_site_integrations.sql</code> migration apply করতে হবে। Save করার পর home page source-এ <code>google-site-verification</code> tag আছে কি না দেখে Search Console-এ Verify চাপুন। Analytics data দেখতে GA4-এ কিছু সময় লাগতে পারে.</section>
    {data?.updated_at && <p className="mt-3 text-xs text-slate-500">Last saved: {new Date(data.updated_at).toLocaleString("en-BD")}</p>}
  </div></main>;
}
