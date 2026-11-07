import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/admin/authz";

const integrations = [
  { key: "google_search_console", name: "Google Search Console", category: "verification", group: "Search verification", field: "token", label: "HTML verification token", placeholder: "Google site verification token", help: "শুধু token দিন; সম্পূর্ণ meta tag নয়।" },
  { key: "bing_webmaster", name: "Bing Webmaster Tools", category: "verification", group: "Search verification", field: "token", label: "Bing verification code", placeholder: "msvalidate.01 token", help: "Bing Webmaster Tools থেকে পাওয়া verification code।" },
  { key: "yandex_webmaster", name: "Yandex Webmaster", category: "verification", group: "Search verification", field: "token", label: "Yandex verification code", placeholder: "Yandex verification token", help: "Yandex Webmaster verification token।" },
  { key: "pinterest_verification", name: "Pinterest domain verification", category: "verification", group: "Search verification", field: "token", label: "Pinterest verification code", placeholder: "p:domain_verify token", help: "Pinterest business settings-এর domain verification code।" },
  { key: "facebook_domain_verification", name: "Facebook domain verification", category: "verification", group: "Search verification", field: "token", label: "Facebook verification code", placeholder: "facebook-domain-verification token", help: "Meta Business Settings থেকে পাওয়া domain verification code।" },
  { key: "ga4", name: "Google Analytics 4", category: "analytics", group: "Analytics & tag manager", field: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX", help: "GA4 web data stream ID। Consent integration ও event QA সম্পন্ন না হওয়া পর্যন্ত এটি শুধু সংরক্ষিত থাকবে।" },
  { key: "google_tag_manager", name: "Google Tag Manager", category: "analytics", group: "Analytics & tag manager", field: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX", help: "একই tag যেন GTM ও native integration—দুই জায়গা থেকে fire না করে, সে ব্যবস্থা পরে enable হবে।" },
  { key: "microsoft_clarity", name: "Microsoft Clarity", category: "analytics", group: "Analytics & tag manager", field: "project_id", label: "Project ID", placeholder: "Clarity project ID", help: "Session recording-এর আগে consent ও sensitive-field masking যাচাই করতে হবে।" },
  { key: "meta_pixel", name: "Meta Pixel", category: "marketing", group: "Advertising pixels", field: "pixel_id", label: "Pixel ID", placeholder: "Meta Pixel ID", help: "শুধু marketing consent-এর পর load হবে; এখন configuration-only।" },
  { key: "google_ads", name: "Google Ads conversion", category: "marketing", group: "Advertising pixels", field: "conversion_id", label: "Conversion ID", placeholder: "AW-XXXXXXXXX", help: "Conversion label ও server-side deduplication পরবর্তী ধাপে যোগ হবে।" },
  { key: "pinterest_tag", name: "Pinterest Tag", category: "marketing", group: "Advertising pixels", field: "tag_id", label: "Tag ID", placeholder: "Pinterest Tag ID", help: "শুধু marketing consent-এর পর load হবে।" },
  { key: "tiktok_pixel", name: "TikTok Pixel", category: "marketing", group: "Advertising pixels", field: "pixel_id", label: "Pixel ID", placeholder: "TikTok Pixel ID", help: "শুধু marketing consent-এর পর load হবে।" },
  { key: "microsoft_uet", name: "Microsoft UET", category: "marketing", group: "Advertising pixels", field: "tag_id", label: "UET Tag ID", placeholder: "Microsoft UET Tag ID", help: "শুধু marketing consent-এর পর load হবে।" },
] as const;

type IntegrationKey = (typeof integrations)[number]["key"];

async function saveIntegration(formData: FormData) {
  "use server";
  const key = String(formData.get("integration_key") ?? "") as IntegrationKey;
  const definition = integrations.find((item) => item.key === key);
  if (!definition) redirect("/admin/settings?growth=invalid");
  const value = String(formData.get("value") ?? "").trim();
  const enabled = formData.get("enabled") === "on";
  if (value.length > 500 || /[<>\u0000-\u001f]/.test(value)) redirect("/admin/settings?growth=invalid");
  const patterns: Record<string, RegExp> = {
    ga4: /^G-[A-Z0-9]{4,20}$/i,
    google_tag_manager: /^GTM-[A-Z0-9]{4,12}$/i,
    google_ads: /^AW-[0-9]{6,20}$/,
    meta_pixel: /^[0-9]{5,25}$/,
    pinterest_tag: /^[A-Za-z0-9_-]{3,80}$/,
    tiktok_pixel: /^[A-Za-z0-9_-]{3,80}$/,
    microsoft_uet: /^[0-9]{5,20}$/,
    microsoft_clarity: /^[A-Za-z0-9]{6,24}$/,
  };
  if (value && patterns[key] && !patterns[key].test(value)) redirect("/admin/settings?growth=invalid");
  if (enabled && !value) redirect("/admin/settings?growth=missing");
  const { supabase, user } = await requireAdminPage("settings.write");
  const config = { [definition.field]: value };
  const { error } = await supabase.from("site_integrations").upsert({
    provider_key: key,
    category: definition.category,
    config,
    enabled,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider_key" });
  if (error) redirect("/admin/settings?growth=error");
  await supabase.from("site_integration_audit").insert({
    provider_key: key,
    action: enabled ? "enabled_or_updated" : "disabled_or_updated",
    actor_id: user.id,
    details: { configured: Boolean(value), enabled },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect("/admin/settings?growth=saved");
}

export default async function AdminSettingsPage({ searchParams }: { searchParams?: Promise<{ notice?: string; growth?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdminPage("settings.read");
  const [{ data: settings, error }, { data: integrationsData }] = await Promise.all([
    supabase.from("site_settings").select("key,value,description,updated_at").order("key"),
    supabase.from("site_integrations").select("provider_key,config,enabled,updated_at"),
  ]);
  const values = new Map((settings ?? []).map((item) => [item.key, item.value]));
  const configured = new Map((integrationsData ?? []).map((item) => [item.provider_key, item]));
  const groups = ["Search verification", "Analytics & tag manager", "Advertising pixels"];
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Site configuration</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <p className="mt-7 text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Platform configuration</p><h1 className="mt-2 text-3xl font-black">সাইট সেটিংস</h1><p className="mt-2 text-sm leading-6 text-[#637266]">সাইটের পরিচিতি, সাপোর্ট যোগাযোগ, হোমপেজ ঘোষণা এবং checkout-এর অনুমোদিত অপশন নিয়ন্ত্রণ করুন।</p>
    {params?.notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{params.notice === "saved" ? "সেটিংস সংরক্ষণ হয়েছে।" : "সেটিংস সংরক্ষণ হয়নি।"}</p>}
    {params?.growth && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${params.growth === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{params.growth === "saved" ? "Growth & Tracking configuration সংরক্ষিত হয়েছে।" : params.growth === "missing" ? "Enable করার আগে provider ID/token দিতে হবে।" : params.growth === "invalid" ? "ID/token format বা input যাচাই করুন।" : "Configuration সংরক্ষণ করা যায়নি। Migration ও database permission যাচাই করুন।"}</p>}
    {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Settings table পড়া যায়নি। Migration প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
    <section className="mt-8 rounded-3xl border border-[#dce8d9] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-[#9a7624]">Growth operations</p><h2 className="mt-1 text-2xl font-black">Growth & Tracking Center</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#667568]">Search engine ownership verification, analytics এবং advertising platform-এর configuration এক জায়গায় পরিচালনা করুন।</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1.5 text-xs font-bold">Configuration only</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#f4f8f1] p-4"><p className="text-xs font-bold text-[#6d7b6e]">Search verification</p><p className="mt-1 text-2xl font-black">{integrations.filter(x=>x.category==="verification").length}</p><p className="text-xs text-[#718071]">Google · Bing · Yandex · Meta · Pinterest</p></div><div className="rounded-2xl bg-[#f4f8f1] p-4"><p className="text-xs font-bold text-[#6d7b6e]">Analytics</p><p className="mt-1 text-2xl font-black">3</p><p className="text-xs text-[#718071]">GA4 · GTM · Clarity</p></div><div className="rounded-2xl bg-[#f4f8f1] p-4"><p className="text-xs font-bold text-[#6d7b6e]">Advertising</p><p className="mt-1 text-2xl font-black">5</p><p className="text-xs text-[#718071]">Meta · Google · Pinterest · TikTok · UET</p></div></div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Privacy-first:</strong> এই পর্যায়ে ID/token নিরাপদে সংরক্ষণ ও verification meta tag প্রকাশ করা হবে। Analytics/marketing script এখনো load হবে না। Consent manager, event deduplication ও server-side conversion QA সম্পন্ন না হওয়া পর্যন্ত কোনো pixel চালু হবে না। Arbitrary JavaScript গ্রহণ করা হয় না।</div>
      {groups.map(group => <div key={group} className="mt-8"><h3 className="text-lg font-black">{group}</h3><div className="mt-3 grid gap-4 lg:grid-cols-2">{integrations.filter(item=>item.group===group).map(item=>{const row=configured.get(item.key);const savedValue=String((row?.config as Record<string,string>|null)?.[item.field]??"");return <form key={item.key} action={saveIntegration} className="rounded-2xl border border-[#dfe8dc] bg-[#fcfdfb] p-4 sm:p-5"><input type="hidden" name="integration_key" value={item.key}/><div className="flex items-start justify-between gap-3"><div><h4 className="font-extrabold">{item.name}</h4><p className="mt-1 text-xs leading-5 text-[#748074]">{item.help}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${row?.enabled ? "bg-emerald-100 text-emerald-800" : savedValue ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{row?.enabled ? "Enabled" : savedValue ? "Configured · off" : "Not configured"}</span></div><label className="mt-4 block text-xs font-bold text-[#425447]" htmlFor={item.key}>{item.label}</label><input id={item.key} name="value" type="text" autoComplete="off" spellCheck={false} maxLength={500} placeholder={item.placeholder} defaultValue={savedValue} className="mt-1.5 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#39764c] focus:ring-2 focus:ring-[#39764c]/15"/><label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#536356]"><input type="checkbox" name="enabled" defaultChecked={Boolean(row?.enabled)} className="h-4 w-4 accent-[#17452c]"/> Mark as enabled</label><div className="mt-4 flex items-center justify-between gap-2"><span className="text-[11px] text-[#849084]">{row?.updated_at ? `Updated ${new Date(row.updated_at).toLocaleDateString("en-GB")}` : "Not saved yet"}</span><button className="rounded-xl bg-[#17452c] px-4 py-2 text-xs font-extrabold text-white">Save configuration</button></div></form>})}</div></div>)}
    </section>
    <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5"><h2 className="font-black">SEO, AEO & privacy roadmap</h2><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Search & indexing:</strong> Sitemap, robots, canonical, IndexNow submission ও webmaster verification.</p><p><strong>Structured data:</strong> Organization, WebSite, Product, Article ও Breadcrumb JSON-LD validation.</p><p><strong>Measurement:</strong> UTM attribution, GA4 ecommerce events, transaction ID deduplication ও admin traffic exclusion.</p><p><strong>Consent:</strong> পৃথক analytics/marketing consent, withdrawal, audit trail ও script gating.</p></div><p className="mt-4 text-xs text-[#788579]">পরবর্তী ধাপে Consent & Event pipeline যোগ হলে তবেই Analytics/Advertising integration runtime-এ সক্রিয় করা হবে।</p></section>
    <div className="mt-6 grid gap-4">{[
      {key:"site_name",label:"সাইটের নাম",description:"Public brand name",type:"text"},
      {key:"support_phone",label:"সাপোর্ট ফোন",description:"কাস্টমার সাপোর্টের ফোন নম্বর",type:"text"},
      {key:"support_email",label:"সাপোর্ট ইমেইল",description:"কাস্টমার সাপোর্টের ইমেইল",type:"email"},
      {key:"homepage_notice",label:"হোমপেজ ঘোষণা",description:"খালি রাখলে কোনো ঘোষণা দেখানো হবে না",type:"textarea"},
      {key:"homepage_hero_title",label:"হোমপেজের প্রধান শিরোনাম",description:"হোমপেজের hero section-এর বড় শিরোনাম",type:"textarea"},
      {key:"homepage_hero_subtitle",label:"হোমপেজের পরিচিতি",description:"প্রধান শিরোনামের নিচের বর্ণনা",type:"textarea"},
      {key:"cod_enabled",label:"Cash on delivery",description:"COD checkout চালু বা বন্ধ",type:"boolean"},
      {key:"online_payment_enabled",label:"Online payment",description:"নিরাপত্তার জন্য verified integration ছাড়া চালু করা যাবে না",type:"boolean"},
    ].map(field=><form key={field.key} action={async (formData)=>{ "use server"; const key=String(formData.get("key")??"");const value=String(formData.get("value")??"");const allowed=["site_name","support_phone","support_email","homepage_notice","homepage_hero_title","homepage_hero_subtitle","cod_enabled","online_payment_enabled"];if(!allowed.includes(key))redirect("/admin/settings?notice=invalid");const {supabase}=await requireAdminPage("settings.write");const {error:saveError}=await supabase.rpc("admin_update_site_setting",{p_key:key,p_value:value});revalidatePath("/admin/settings");revalidatePath("/");redirect(saveError?"/admin/settings?notice=error":"/admin/settings?notice=saved");}} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm"><input type="hidden" name="key" value={field.key}/><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-black">{field.label}</h2><p className="mt-1 text-sm text-[#748074]">{field.description}</p></div><span className="rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold">{field.key}</span></div>{field.type==="textarea"?<textarea name="value" maxLength={1000} rows={3} defaultValue={values.get(field.key)??""} className="mt-4 w-full rounded-xl border border-[#d9e3d5] px-3 py-2.5 text-sm"/>:field.type==="boolean"?<select name="value" defaultValue={values.get(field.key)??(field.key==="online_payment_enabled"?"false":"true")} className="mt-4 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 py-2.5 text-sm"><option value="true">Enabled</option><option value="false">Disabled</option></select>:<input name="value" type={field.type} required={field.key==="site_name"} maxLength={field.key==="site_name"?120:1000} defaultValue={values.get(field.key)??""} className="mt-4 w-full rounded-xl border border-[#d9e3d5] px-3 py-2.5 text-sm"/>}{field.key==="online_payment_enabled"&&<p className="mt-2 text-xs font-semibold text-amber-800">Online payment enable করার চেষ্টা করলে database RPC তা প্রত্যাখ্যান করবে।</p>}<div className="mt-4 flex justify-end"><button className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">Save setting</button></div></form>)}</div>
    <p className="mt-5 text-xs text-[#7b887d]">Growth & Tracking integration data আলাদা table-এ থাকে; সাধারণ site settings থেকে পৃথক।</p>
  </div></main>;
}
