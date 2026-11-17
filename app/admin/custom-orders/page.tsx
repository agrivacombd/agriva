import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";
export const dynamic="force-dynamic";
async function changeRequest(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("orders.transition");
 const id=String(f.get("id")??""), status=String(f.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["open","closed","cancelled"].includes(status))redirect("/admin/custom-orders?notice=invalid");
 const {error}=await supabase.rpc("bulk_moderate_request",{p_request:id,p_status:status});
 redirect(`/admin/custom-orders?notice=${error?"error":"updated"}`);
}
async function inviteWholesaler(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("orders.transition");
 const request_id=String(f.get("request_id")??"");
 const wholesaler_id=String(f.get("wholesaler_id")??"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(request_id)||!/^[0-9a-f-]{36}$/i.test(wholesaler_id))redirect("/admin/custom-orders?notice=invalid");
 // Authorized wholesaler membership needs to be verified before exposing this action publicly.
 const {data:verified,error:verificationError}=await supabase.from("bulk_wholesalers").select("user_id,status").eq("user_id",wholesaler_id).maybeSingle();
 if(verificationError||verified?.status!=="verified")redirect("/admin/custom-orders?notice=not_wholesaler");
 const {error}=await supabase.from("bulk_invitations").insert({request_id,wholesaler_id});
 redirect(`/admin/custom-orders?notice=${error?"error":"invited"}`);
}
async function verifyWholesaler(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("identity.review");
 const user=String(f.get("user_id")??"").trim();
 const status=String(f.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(user)||!["verified","suspended"].includes(status))redirect("/admin/custom-orders?notice=invalid");
 const {error}=await supabase.rpc("bulk_verify_wholesaler",{p_user:user,p_status:status});
 redirect(`/admin/custom-orders?notice=${error?"error":"verified"}`);
}
async function moderateQuote(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("orders.transition");
 const id=String(f.get("id")??""), status=String(f.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(status))redirect("/admin/custom-orders?notice=invalid");
 const {error}=await supabase.rpc("bulk_moderate_quote",{p_quote:id,p_status:status});
 redirect(`/admin/custom-orders?notice=${error?"error":"updated"}`);
}
export default async function BulkOrdersAdmin({searchParams}:{searchParams:Promise<{notice?:string}>}){
 const {supabase}=await requireAdminPage("orders.read");
 const {data:requests,error}=await supabase.from("bulk_requests")
  .select("id,product_name,quantity,unit,district,visibility,status,buyer_type,created_at")
  .order("created_at",{ascending:false}).limit(100);
 const {data:quotes}=await supabase.from("bulk_quotes").select("id,request_id,wholesaler_id,unit_price,shipping_fee,extra_fee,status,created_at").order("created_at",{ascending:false}).limit(100);
 const p=await searchParams;
 const field="rounded-xl border border-slate-300 px-3 py-2 text-sm";
 return <main className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-6xl">
  <Link href="/admin" className="font-semibold text-emerald-800 underline">← Admin</Link>
  <h1 className="mt-3 text-3xl font-black">Bulk RFQ · Admin Dashboard</h1>
  <p className="mt-2 text-slate-600">চাহিদা যাচাই, পাইকারকে আমন্ত্রণ এবং কোটেশন অনুমোদন।</p>
  {p.notice&&<p role="status" className="mt-5 rounded-xl bg-white p-4">{p.notice==="verified"?"পাইকারের যাচাইকরণ আপডেট হয়েছে।":p.notice==="invited"?"পাইকারের অ্যাকাউন্টে আমন্ত্রণ যুক্ত হয়েছে।":p.notice==="updated"?"তথ্য আপডেট হয়েছে।":p.notice==="not_wholesaler"?"এই ব্যবহারকারীকে অনুমোদিত পাইকার হিসেবে পাওয়া যায়নি।":"অনুরোধ সম্পন্ন হয়নি; permissions ও অবস্থা যাচাই করুন।"}</p>}
  <form action={verifyWholesaler} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-100 bg-white p-5">
    <label className="grid gap-1 text-sm font-semibold">Wholesaler Account UUID<input required name="user_id" placeholder="Registered account UUID" className={field}/></label>
    <label className="grid gap-1 text-sm font-semibold">Verification<select name="status" className={field}><option value="verified">Verify</option><option value="suspended">Suspend</option></select></label>
    <button className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Save Verification</button>
   </form>
  {error?<p role="alert" className="mt-6 rounded-xl bg-red-50 p-4">RFQ তালিকা লোড করা যায়নি; migration বা authorization যাচাই করুন।</p>:<div className="mt-7 grid gap-4">{requests?.map(r=><section key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{r.product_name}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{r.status}</span></div>
   <p className="mt-2 text-sm">{r.quantity} {r.unit} · {r.district} · {r.buyer_type} · {r.visibility}</p>
   <div className="mt-4 flex flex-wrap gap-2">{(["open","closed","cancelled"] as const).map(status=><form key={status} action={changeRequest}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="status" value={status}/><button disabled={r.status===status||r.status==="selected"} className="rounded-xl border border-emerald-700 px-3 py-2 text-sm font-bold disabled:opacity-40">{status==="open"?"অনুমোদন / Open":status==="closed"?"বন্ধ করুন":"বাতিল করুন"}</button></form>)}</div>
   <form action={inviteWholesaler} className="mt-5 flex flex-wrap gap-2"><input type="hidden" name="request_id" value={r.id}/><label className="sr-only" htmlFor={`wholesaler-${r.id}`}>পাইকারের অ্যাকাউন্ট ID</label><input id={`wholesaler-${r.id}`} required name="wholesaler_id" placeholder="Wholesaler account UUID" className={field}/><button className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">পাইকারকে আমন্ত্রণ</button></form>
   <div className="mt-5 space-y-2">{quotes?.filter(q=>q.request_id===r.id).map(q=><div key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
    <div><strong>পাইকার {q.wholesaler_id.slice(0,8)}…</strong><p>প্রতি একক ৳{q.unit_price} + পরিবহন ৳{q.shipping_fee} + অন্যান্য ৳{q.extra_fee}</p><p className="text-xs text-slate-500">{q.status}</p></div>
    <div className="flex gap-2">{(["approved","rejected"] as const).map(status=><form key={status} action={moderateQuote}><input type="hidden" name="id" value={q.id}/><input type="hidden" name="status" value={status}/><button disabled={q.status===status} className="rounded-lg border border-emerald-800 px-3 py-2 font-semibold disabled:opacity-40">{status==="approved"?"অনুমোদন":"বাতিল"}</button></form>)}</div>
   </div>)}</div>
  </section>)}</div>}
 </div></main>;
}
