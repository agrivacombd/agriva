import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const statusText:Record<string,string>={pending_review:"যাচাই চলছে",open:"কোটেশন গ্রহণ চলছে",closed:"বন্ধ",selected:"পাইকার নির্বাচিত",cancelled:"বাতিল"};
export default async function MyBulkOrders({searchParams}:{searchParams:Promise<{created?:string;page?:string}>}){
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Faccount%2Fcustom-orders");
 const p=await searchParams;
 const page=Math.max(1,Math.min(1000,Number.parseInt(p.page??"1",10)||1));
 const pageSize=20;
 const {data,error,count}=await db.from("bulk_requests")
 .select("id,product_name,quantity,unit,district,upazila,status,visibility,created_at",{count:"exact"})
 .eq("buyer_id",user.id).order("created_at",{ascending:false}).range((page-1)*pageSize,page*pageSize-1);
 const requestIds=(data??[]).map(r=>r.id);
 const {data:approved}=requestIds.length
  ?await db.from("bulk_quotes").select("request_id,expires_at").eq("status","approved").in("request_id",requestIds)
  :{data:[]};
 const counts=new Map<string,number>();
 for(const q of approved??[]){
  if(Date.parse(q.expires_at)>Date.now()) counts.set(q.request_id,(counts.get(q.request_id)??0)+1);
 }
 return <main className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-5xl">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-emerald-700">AGRIVA • MY BULK ORDERS</p><h1 className="mt-1 text-3xl font-black">আমার কাস্টম অর্ডার</h1><p className="mt-2 text-sm text-slate-600">আগের অনুরোধ থেকে নতুন চাহিদা তৈরি করুন। পুরোনো অফার ও ইতিহাস অপরিবর্তিত থাকবে।</p></div>
  <Link href="/custom-order" className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white">+ নতুন অনুরোধ</Link></div>
  {p.created==="1"&&<p role="status" className="mt-6 rounded-xl bg-emerald-100 p-4">নতুন অনুরোধ জমা হয়েছে। অ্যাডমিন যাচাই করবেন।</p>}
  {error?<p role="alert" className="mt-7 rounded-xl bg-red-50 p-4 text-red-800">অর্ডারের তালিকা পাওয়া যায়নি। ডাটাবেস মাইগ্রেশন ও অ্যাক্সেস পরীক্ষা করুন।</p>:
   !data?.length?<div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm"><p>এখনো কোনো Bulk Order Request নেই।</p><Link className="mt-3 inline-block font-bold text-emerald-700 underline" href="/custom-order">প্রথম অনুরোধ তৈরি করুন</Link></div>:
   <div className="mt-7 grid gap-4 sm:grid-cols-2">{data.map(r=><article key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-bold">{r.product_name}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{statusText[r.status]??r.status}</span></div>
    <p className="mt-2 text-sm text-slate-700">পরিমাণ: <strong>{r.quantity} {r.unit}</strong></p>
    <p className="mt-1 text-sm text-slate-700">ডেলিভারি: {r.district}{r.upazila?", "+r.upazila:""}</p>
    <p className="mt-1 text-sm font-semibold text-emerald-800">অনুমোদিত অফার: {counts.get(r.id)??0} টি</p>
    <p className="mt-1 text-sm text-slate-700">প্রাইভেসি: {r.visibility==="public"?"Public":"Private"}</p>
    <p className="mt-2 text-xs text-slate-500">তৈরি: {new Date(r.created_at).toLocaleDateString("bn-BD",{timeZone:"Asia/Dhaka"})}</p>
    <div className="mt-5 flex flex-wrap gap-2"><Link href={`/custom-order?repeat=${encodeURIComponent(r.id)}`} className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">আবার অর্ডার করুন</Link><Link href={`/account/custom-orders/${encodeURIComponent(r.id)}`} className="rounded-xl border border-emerald-800 px-4 py-2 text-sm font-bold">অফার দেখুন</Link></div>
   </article>)}</div>}
   {!error&&Number(count??0)>pageSize&&<nav aria-label="অর্ডারের তালিকার পৃষ্ঠা" className="mt-7 flex flex-wrap items-center justify-center gap-3">
      {page>1&&<Link className="rounded-lg border px-4 py-2 font-semibold" href={`/account/custom-orders?page=${page-1}`}>← আগের পৃষ্ঠা</Link>}
      <span className="text-sm text-slate-600">পৃষ্ঠা {page} / {Math.ceil(Number(count??0)/pageSize)}</span>
      {page*pageSize<Number(count??0)&&<Link className="rounded-lg border px-4 py-2 font-semibold" href={`/account/custom-orders?page=${page+1}`}>পরের পৃষ্ঠা →</Link>}
    </nav>}
 </div></main>;
}
