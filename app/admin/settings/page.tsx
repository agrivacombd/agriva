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

async function saveSetting(formData: FormData) {
  "use server";
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "");
  const allowed = ["site_name","support_phone","support_email","homepage_notice","homepage_hero_title","homepage_hero_subtitle","cod_enabled","online_payment_enabled"];
  if (!allowed.includes(key)) redirect("/admin/settings?notice=invalid");
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_site_setting", { p_key: key, p_value: value });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect(error ? "/admin/settings?notice=error" : "/admin/settings?notice=saved");
}

const fields = [
  {key:"site_name",label:"সাইটের নাম",description:"Public brand name",type:"text"},
  {key:"support_phone",label:"সাপোর্ট ফোন",description:"কাস্টমার সাপোর্টের ফোন নম্বর",type:"text"},
  {key:"support_email",label:"সাপোর্ট ইমেইল",description:"কাস্টমার সাপোর্টের ইমেইল",type:"email"},
  {key:"homepage_notice",label:"হোমপেজ ঘোষণা",description:"খালি রাখলে কোনো ঘোষণা দেখানো হবে না",type:"textarea"},
  {key:"homepage_hero_title",label:"হোমপেজের প্রধান শিরোনাম",description:"হোমপেজের hero section-এর বড় শিরোনাম",type:"textarea"},
  {key:"homepage_hero_subtitle",label:"হোমপেজের পরিচিতি",description:"প্রধান শিরোনামের নিচের বর্ণনা",type:"textarea"},
  {key:"cod_enabled",label:"Cash on delivery",description:"COD checkout চালু বা বন্ধ",type:"boolean"},
  {key:"online_payment_enabled",label:"Online payment",description:"নিরাপত্তার জন্য verified integration ছাড়া চালু করা যাবে না",type:"boolean"},
];

export default async function AdminSettingsPage({searchParams}:{searchParams?:Promise<{notice?:string}>}) {
  const params = await searchParams;
  const supabase = await requireAdmin();
  const {data,error} = await supabase.from("site_settings").select("key,value,description,updated_at").order("key");
  const values = new Map((data ?? []).map(item=>[item.key,item.value]));
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Site configuration</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <p className="mt-7 text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Platform configuration</p><h1 className="mt-2 text-3xl font-black">সাইট সেটিংস</h1><p className="mt-2 text-sm leading-6 text-[#637266]">সাইটের পরিচিতি, সাপোর্ট যোগাযোগ, হোমপেজ ঘোষণা এবং checkout-এর অনুমোদিত অপশন নিয়ন্ত্রণ করুন। পরিবর্তন audit log-এ লেখা হয়।</p>
    {params?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice==="saved"?"border-emerald-200 bg-emerald-50 text-emerald-900":"border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice==="saved"?"সেটিংস সংরক্ষণ হয়েছে।":searchParams.notice==="invalid"?"সেটিংসের key সঠিক নয়।":"সেটিংস সংরক্ষণ হয়নি। Migration 025 এবং database permissions যাচাই করুন।"}</p>}
    {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Settings table পড়া যায়নি। Migration 025 প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
    <div className="mt-6 grid gap-4">{fields.map(field=><form key={field.key} action={saveSetting} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm"><input type="hidden" name="key" value={field.key}/><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-black">{field.label}</h2><p className="mt-1 text-sm text-[#748074]">{field.description}</p></div><span className="rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold">{field.key}</span></div>
      {field.type==="textarea" ? <textarea name="value" maxLength={1000} rows={3} defaultValue={values.get(field.key)??""} className="mt-4 w-full rounded-xl border border-[#d9e3d5] px-3 py-2.5 text-sm"/> : field.type==="boolean" ? <select name="value" defaultValue={values.get(field.key)??(field.key==="online_payment_enabled"?"false":"true")} className="mt-4 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 py-2.5 text-sm"><option value="true">Enabled</option><option value="false">Disabled</option></select> : <input name="value" type={field.type} required={field.key==="site_name"} maxLength={field.key==="site_name"?120:1000} defaultValue={values.get(field.key)??""} className="mt-4 w-full rounded-xl border border-[#d9e3d5] px-3 py-2.5 text-sm"/>}
      {field.key==="online_payment_enabled" && <p className="mt-2 text-xs font-semibold text-amber-800">Online payment enable করার চেষ্টা করলে database RPC তা প্রত্যাখ্যান করবে।</p>}
      <div className="mt-4 flex justify-end"><button className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">Save setting</button></div>
    </form>)}</div>
    <p className="mt-5 text-xs text-[#7b887d]">নোট: ডেটাবেসে সেটিংস সংরক্ষিত হয়; হোমপেজ বা checkout-এ কোনো সেটিং কার্যকর করতে সংশ্লিষ্ট UI-কে সেটিংস পড়ার জন্য যুক্ত থাকতে হবে।</p>
  </div></main>;
}
