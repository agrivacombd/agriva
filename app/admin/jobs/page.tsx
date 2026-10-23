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
async function moderateJob(formData: FormData) {
  "use server";
  const jobId = String(formData.get("job_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!jobId || !["published", "rejected", "paused", "filled"].includes(status)) redirect("/admin/jobs?notice=invalid");
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_moderate_job_post", { p_job_id: jobId, p_status: status, p_note: note || null });
  revalidatePath("/admin/jobs"); revalidatePath("/jobs"); revalidatePath("/sitemap.xml");
  redirect(error ? "/admin/jobs?notice=error" : "/admin/jobs?notice=updated");
}
const labels: Record<string,string> = {pending:"অনুমোদনের অপেক্ষায়",published:"প্রকাশিত",rejected:"প্রত্যাখ্যাত",paused:"স্থগিত",filled:"কর্মী পাওয়া গেছে",draft:"খসড়া"};
export default async function AdminJobsPage({searchParams}:{searchParams:Promise<{notice?:string;status?:string}>}) {
  const params = await searchParams; const supabase = await requireAdmin();
  const status = ["pending","published","rejected","paused","filled","draft"].includes(params.status || "") ? params.status! : "pending";
  const {data:jobs,error} = await supabase.from("job_posts").select("id,title,slug,employer_name,job_type,district,upazila,created_at,starts_at,application_deadline,salary_min,salary_max,compensation_type,status,moderation_note,latitude,longitude").eq("status",status).order("created_at",{ascending:false}).limit(100);
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-sm font-bold text-emerald-800">← Admin Dashboard</Link><header className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">AGRIVA ADMIN</p><h1 className="mt-2 text-3xl font-black">কৃষি চাকরি যাচাই ও মডারেশন</h1><p className="mt-2 text-sm text-slate-600">চাকরি যাচাই করে প্রকাশ, প্রত্যাখ্যান, স্থগিত বা পূরণ হয়েছে হিসেবে চিহ্নিত করুন।</p></div><span className="rounded-xl bg-white px-4 py-3 text-sm font-bold">{jobs?.length ?? 0}টি পোস্ট</span></header>
 {params.notice&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{params.notice==="updated"?"চাকরির স্ট্যাটাস আপডেট হয়েছে।":params.notice==="invalid"?"তথ্য সঠিক নয়।":"আপডেট করা যায়নি। Migration ও admin access যাচাই করুন।"}</p>}
 <nav className="mt-6 flex flex-wrap gap-2">{Object.entries(labels).map(([key,label])=><Link key={key} href={"/admin/jobs?status="+key} className={"rounded-xl px-4 py-2 text-sm font-bold "+(status===key?"bg-emerald-800 text-white":"border border-emerald-900/10 bg-white text-emerald-900")}>{label}</Link>)}</nav>
 {error&&<p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Job database migration এখনো প্রয়োগ করা হয়নি অথবা টেবিল পড়া যাচ্ছে না।</p>}
 {!error&&(!jobs||jobs.length===0)&&<div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center"><h2 className="font-black">এই তালিকায় কোনো পোস্ট নেই</h2><p className="mt-2 text-sm text-slate-600">অন্য status বেছে দেখুন।</p></div>}
 <div className="mt-6 space-y-5">{(jobs||[]).map(job=><article key={job.id} className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">{labels[job.status]||job.status}</span><h2 className="mt-3 text-lg font-black">{job.title}</h2><p className="mt-1 text-sm text-slate-600">{job.employer_name} · {job.job_type} · {job.upazila}, {job.district}</p><p className="mt-2 text-sm">মজুরি: {job.salary_min==null&&job.salary_max==null?"আলোচনা সাপেক্ষ":"৳"+[job.salary_min,job.salary_max].filter(v=>v!=null).join("–")} · পোস্ট: {new Intl.DateTimeFormat("bn-BD",{dateStyle:"medium"}).format(new Date(job.created_at))}</p>{job.starts_at&&<p className="mt-1 text-xs text-slate-500">শুরুর সময়: {new Intl.DateTimeFormat("bn-BD",{dateStyle:"medium"}).format(new Date(job.starts_at))}</p>}{job.moderation_note&&<p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">আগের নোট: {job.moderation_note}</p>}</div><Link href={"/jobs/"+job.slug} target="_blank" className="text-sm font-bold text-emerald-800 underline">পাবলিক পেজ ↗</Link></div>
 <div className="mt-4 flex flex-wrap gap-3">{job.latitude!=null&&job.longitude!=null&&<a className="rounded-lg border px-3 py-2 text-sm font-bold" target="_blank" rel="noopener noreferrer" href={"https://www.google.com/maps/search/?api=1&query="+job.latitude+","+job.longitude}>লোকেশন যাচাই ↗</a>}<form action={moderateJob} className="flex min-w-0 flex-1 flex-wrap items-center gap-2"><input type="hidden" name="job_id" value={job.id}/><input name="note" maxLength={1000} placeholder="মডারেশন নোট (ঐচ্ছিক)" className="min-h-10 min-w-48 flex-1 rounded-lg border px-3 text-sm"/><button name="status" value="published" className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">প্রকাশ করুন</button><button name="status" value="rejected" className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-800">প্রত্যাখ্যান</button>{job.status==="published"&&<button name="status" value="paused" className="rounded-lg border px-3 py-2 text-sm font-bold">স্থগিত</button>}<button name="status" value="filled" className="rounded-lg border px-3 py-2 text-sm font-bold">কর্মী পাওয়া গেছে</button></form></div></article>)}</div></div></main>;
}