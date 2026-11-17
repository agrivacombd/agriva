import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
async function submitQuote(formData: FormData){
 "use server";
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Fwholesaler%2Frequests");
 const request_id=String(formData.get("request_id")??"");
 const unit_price=Number(formData.get("unit_price"));
 const shipping_fee=Number(formData.get("shipping_fee"));
 const extra_fee=Number(formData.get("extra_fee"));
 const lead_days=Number(formData.get("lead_days"));
 const details=String(formData.get("details")??"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(request_id)||![unit_price,shipping_fee,extra_fee,lead_days].every(Number.isFinite)||unit_price<=0||unit_price>1000000||shipping_fee<0||extra_fee<0||!Number.isInteger(lead_days)||lead_days<1||lead_days>365||details.length>2000)redirect("/wholesaler/requests?notice=invalid");
 const expires_at=new Date(Date.now()+7*24*60*60*1000).toISOString();
 const {error}=await db.from("bulk_quotes").insert({request_id,wholesaler_id:user.id,unit_price,shipping_fee,extra_fee,lead_days,details,expires_at,status:"pending"});
 redirect(`/wholesaler/requests?notice=${error?"failed":"submitted"}`);
}
export default async function WholesalerRequests({searchParams}:{searchParams:Promise<{notice?:string}>}){
 const db=await createSupabaseServerClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Fwholesaler%2Frequests");
 const {data:invitations,error}=await db.from("bulk_invitations").select("id,request_id,expires_at,revoked_at")
 .eq("wholesaler_id",user.id).order("created_at",{ascending:false}).limit(50);
 const active=(invitations??[]).filter(i=>!i.revoked_at&&new Date(i.expires_at).getTime()>Date.now());
 const ids=active.map(i=>i.request_id);
 const {data:requests}=ids.length?await db.from("bulk_requests").select("id,product_name,specification,quantity,unit,district,upazila,status,quote_deadline").in("id",ids):{data:[]};
 const {data:existing}=ids.length?await db.from("bulk_quotes").select("request_id,status").eq("wholesaler_id",user.id).in("request_id",ids):{data:[]};
 const previouslyQuoted=new Set((existing??[]).map(q=>q.request_id));
 const p=await searchParams;
 return <main className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-4xl">
  <Link className="text-sm font-bold text-emerald-700 underline" href="/custom-order">← Bulk Order</Link>
  <h1 className="mt-4 text-3xl font-black">পাইকারের Quotation Dashboard</h1>
  <p className="mt-2 text-slate-600">আপনার অ্যাকাউন্টে অ্যাডমিনের পাঠানো আমন্ত্রণগুলো এখানে থাকবে। অন্য পাইকারদের দর গোপন থাকবে।</p>
  {p.notice&&<p role="status" className="mt-4 rounded-xl bg-white p-4">{p.notice==="submitted"?"অফার জমা হয়েছে; অ্যাডমিনের অনুমোদনের অপেক্ষায়।":p.notice==="invalid"?"অফারের তথ্য সঠিক নয়।":"অফার জমা দেওয়া যায়নি। একই অনুরোধে আগে অফার দিয়েছেন কি না যাচাই করুন।"}</p>}
  {error?<p role="alert" className="mt-6 rounded-xl bg-red-50 p-4">আমন্ত্রণগুলো লোড করা যায়নি।</p>:!requests?.length?<p className="mt-6 rounded-xl bg-white p-6">এই মুহূর্তে কোনো সক্রিয় আমন্ত্রণ নেই।</p>:<div className="mt-6 grid gap-5">{requests.map(r=><article key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{r.product_name}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{r.status==="open"?"কোটেশন চলছে":"অনুরোধ বন্ধ"}</span></div>
   <p className="mt-2 text-sm">চাহিদা: {r.quantity} {r.unit} · {r.district}{r.upazila?", "+r.upazila:""}</p>
   <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{r.specification}</p>
   {previouslyQuoted.has(r.id)?<p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm">এই অনুরোধে আপনার অফার ইতোমধ্যে জমা হয়েছে।</p>:r.status==="open"?<form action={submitQuote} className="mt-5 grid gap-3 sm:grid-cols-2">
    <input type="hidden" name="request_id" value={r.id}/>
    <label className="grid gap-1 text-sm font-semibold">প্রতি {r.unit} মূল্য (৳)<input required min=".01" step=".01" max="1000000" type="number" name="unit_price" className="rounded-xl border p-3"/></label>
    <label className="grid gap-1 text-sm font-semibold">ডেলিভারি চার্জ (৳)<input required min="0" step=".01" type="number" name="shipping_fee" defaultValue="0" className="rounded-xl border p-3"/></label>
    <label className="grid gap-1 text-sm font-semibold">অন্যান্য ফি (৳)<input required min="0" step=".01" type="number" name="extra_fee" defaultValue="0" className="rounded-xl border p-3"/></label>
    <label className="grid gap-1 text-sm font-semibold">সরবরাহের সময় (দিন)<input required min="1" max="365" type="number" name="lead_days" className="rounded-xl border p-3"/></label>
    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">পণ্যের মান ও শর্ত<textarea maxLength={2000} rows={3} name="details" className="rounded-xl border p-3"/></label>
    <button type="submit" className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white sm:col-span-2">অফার জমা দিন</button>
   </form>:null}
  </article>)}</div>}
 </div></main>;
}
