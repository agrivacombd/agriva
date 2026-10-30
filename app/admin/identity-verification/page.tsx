import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/admin/authz";

async function reviewApplication(formData:FormData){
 "use server";
 const id=String(formData.get("applicationId")||"");
 const decision=String(formData.get("decision")||"");
 const note=String(formData.get("reviewNote")||"").slice(0,1000);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(decision))return;
 const {supabase}=await requireAdminPage("identity.review");
 const {error}=await supabase.rpc("admin_review_module_application",{p_application_id:id,p_decision:decision,p_review_note:note});
 if(error)throw new Error("Application review failed. Check migration and admin authorization.");
 revalidatePath("/admin/identity-verification");
}
export default async function IdentityVerificationAdminPage(){
 const {supabase}=await requireAdminPage("identity.review");
 const {data:applications,error}=await supabase.from("module_access_applications")
  .select("id,user_id,module,applicant_type,organization_id,status,applicant_data,created_at")
  .in("status",["pending","under_review"]).order("created_at",{ascending:true}).limit(100);
 const items=await Promise.all((applications||[]).map(async app=>{
  const data=(app.applicant_data||{}) as Record<string,unknown>;
  const paths=Array.isArray(data.evidence_paths)?data.evidence_paths.filter((p):p is string=>typeof p==="string"&&p.startsWith(app.user_id+"/")).slice(0,5):[];
  const signed=await Promise.all(paths.map(async path=>{
   const {data:object}=await supabase.storage.from("identity-verification").createSignedUrl(path,300);
   return object?.signedUrl||null;
  }));
  return {app,data,evidence:signed.filter((url):url is string=>Boolean(url))};
 }));
 return <main className="min-h-screen bg-[#f5f8f2] px-4 py-8 text-[#173b2d] sm:px-6"><div className="mx-auto max-w-6xl">
  <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123f30] p-5 text-white"><div><p className="text-xs font-bold uppercase tracking-widest text-[#c9dfca]">AGRIVA • ADMIN</p><h1 className="mt-1 text-2xl font-black">Identity verification queue</h1></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
  <p className="mt-5 text-sm leading-6 text-[#637568]">প্রতিটি আবেদন ও private evidence যাচাই করে অনুমোদন বা প্রত্যাখ্যান করুন। Approve করলে module grant এবং gardener/farmer verification একই database transaction-এ কার্যকর হয়। Marketplace অনুমোদন সংশ্লিষ্ট প্রতিষ্ঠানকেও verified করে।</p>
  {error&&<p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">আবেদন তালিকা লোড করা যায়নি। Identity workflow migration প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
  <div className="mt-6 space-y-4">{items.map(({app,data,evidence})=><article key={app.id} className="rounded-2xl border border-[#e1e9df] bg-white p-5 shadow-sm">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-[#eaf4eb] px-3 py-1 text-xs font-bold">{app.module}</span><h2 className="mt-3 text-lg font-black">{String(data.organization_name||app.applicant_type)}</h2><p className="mt-1 text-xs text-[#788579]">Applicant: {app.user_id} · {new Date(app.created_at).toLocaleString("en-GB")}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{app.status}</span></div>
   <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{Object.entries(data).filter(([key])=>key!=="evidence_paths").map(([key,value])=><div key={key} className="rounded-lg bg-[#f8faf6] p-3"><dt className="text-xs font-semibold text-[#718174]">{key.replaceAll("_"," ")}</dt><dd className="mt-1 break-words font-medium">{Array.isArray(value)?value.join(", "):String(value??"—")}</dd></div>)}</dl>
   {evidence.length>0&&<div className="mt-4 flex flex-wrap gap-2">{evidence.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-[#dce7d9] px-3 py-2 text-xs font-bold text-[#126b4f]">Evidence {i+1} ↗</a>)}</div>}
   <form action={reviewApplication} className="mt-5 grid gap-3 border-t border-[#edf1ea] pt-4 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="applicationId" value={app.id}/><input name="reviewNote" maxLength={1000} placeholder="Review note (optional; explain rejection)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm"/><button name="decision" value="rejected" className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Reject</button><button name="decision" value="approved" className="rounded-lg bg-[#126b4f] px-4 py-2 text-sm font-bold text-white">Approve & grant access</button></form>
  </article>)}</div>
  {!items.length&&!error&&<p className="mt-6 rounded-2xl border border-[#e1e9df] bg-white p-8 text-center text-sm text-[#6a7b6e]">কোনো pending application নেই।</p>}
 </div></main>;
}
