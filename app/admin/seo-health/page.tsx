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

async function submitIndexNow(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const raw = String(formData.get("urls") ?? "");
  const { data: settings } = await supabase.from("site_public_integrations").select("indexnow_key").eq("id", 1).maybeSingle();
  if (!settings?.indexnow_key) redirect("/admin/seo-health?notice=missing_key");
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const host = new URL(base).host;
  const urls = [...new Set(raw.split(/[\s,]+/).map(v => v.trim()).filter(Boolean))];
  if (!urls.length || urls.length > 1000) redirect("/admin/seo-health?notice=invalid_urls");
  if (urls.some(url => { try { const parsed = new URL(url); return parsed.protocol !== "https:" || parsed.host !== host; } catch { return true; } })) redirect("/admin/seo-health?notice=invalid_urls");
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: settings.indexnow_key, keyLocation: base + "/" + settings.indexnow_key + ".txt", urlList: urls }),
    cache: "no-store",
  });
  revalidatePath("/admin/seo-health");
  redirect("/admin/seo-health?notice=" + (response.ok || response.status === 202 ? "submitted" : "provider_error_" + response.status));
}

const notices: Record<string, string> = {
  submitted: "IndexNow request accepted. এটি URL discovery notice; indexing বা ranking-এর নিশ্চয়তা নয়।",
  missing_key: "আগে Search Engine Integrations-এ IndexNow key save করুন এবং migration apply করুন।",
  invalid_urls: "নিজের https://agriva.com.bd domain-এর 1–1000টি valid URL দিন।",
};
export default async function SeoHealthPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const supabase = await requireAdmin();
  const { data: settings } = await supabase.from("site_public_integrations").select("indexnow_key,google_site_verification,bing_site_verification,ga4_measurement_id").eq("id", 1).maybeSingle();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const checks = [
    { name: "robots.txt", href: "/robots.txt", detail: "Crawler access rules" },
    { name: "sitemap.xml", href: "/sitemap.xml", detail: "Canonical URL discovery" },
    { name: "Merchant product feed", href: "/api/merchant-center", detail: "Approved/in-stock product feed; review feed requirements" },
  ];
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f]"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#123b27] p-5 text-white"><div><p className="text-sm text-emerald-100">AGRIVA Super Admin</p><h1 className="text-2xl font-black">Search Engine Health</h1></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin</Link></header>
    {params?.notice && <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold">{notices[params.notice] ?? (params.notice.startsWith("provider_error_") ? "IndexNow provider returned HTTP " + params.notice.slice("provider_error_".length) + ". Key, key file and request verify করুন।" : "Status unavailable.")}</p>}
    <p className="mt-5 text-sm leading-6 text-slate-600">এই পেজ configuration readiness ও crawl resources দেখায়। Search engine-এর actual indexed URL, impressions বা crawl errors তাদের Webmaster dashboard/API access ছাড়া এখানে নিশ্চিত বলা হবে না।</p>
    <section className="mt-5 grid gap-3 sm:grid-cols-2">{[
      ["Google Analytics", Boolean(settings?.ga4_measurement_id)],
      ["Google verification code", Boolean(settings?.google_site_verification)],
      ["Bing verification code", Boolean(settings?.bing_site_verification)],
      ["IndexNow key", Boolean(settings?.indexnow_key)],
    ].map(([name,ok])=><div key={String(name)} className="rounded-xl bg-white p-4"><p className="font-bold">{name}</p><p className={ok?"mt-1 text-sm text-emerald-700":"mt-1 text-sm text-amber-800"}>{ok?"Configured":"Needs setup"}</p></div>)}</section>
    <section className="mt-5 rounded-2xl bg-white p-5"><h2 className="font-black">Crawler resources</h2><div className="mt-3 space-y-3">{checks.map(check=><div key={check.href} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="font-bold">{check.name}</p><p className="text-xs text-slate-500">{check.detail}</p></div><Link className="font-semibold text-emerald-800 underline" href={check.href} target="_blank">{base+check.href} ↗</Link></div>)}</div></section>
    <section className="mt-5 rounded-2xl bg-white p-5"><h2 className="font-black">Notify search engines with IndexNow</h2><p className="mt-2 text-sm leading-6 text-slate-600">নতুন/পরিবর্তিত product বা guide-এর নিজের domain-এর পূর্ণ URL প্রতি লাইনে paste করুন। সর্বোচ্চ 1000 URL একবারে পাঠানো যাবে।</p><form action={submitIndexNow} className="mt-4 space-y-3"><textarea name="urls" required rows={6} placeholder={"https://agriva.com.bd/marketplace/example-product\nhttps://agriva.com.bd/guides/example-guide"} className="w-full rounded-xl border border-slate-300 p-3 font-mono text-sm"/><button className="rounded-xl bg-[#17452c] px-5 py-3 font-bold text-white">Submit URLs to IndexNow</button></form><p className="mt-3 text-xs text-slate-500">Key status: {settings?.indexnow_key ? "configured" : "not configured"}. Automatic submission on every product edit can be added after confirming all product mutation paths.</p></section>
    <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Before using: apply migration 031. Bing/Google verification codes must be verified in the provider dashboards. IndexNow needs its key text endpoint reachable on the deployed site. Search engine acceptance does not guarantee indexing or ranking.</section>
    <Link href="/admin/site-integrations" className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold">Configure verification & IndexNow ↗</Link>
  </div></main>;
}
