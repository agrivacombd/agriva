import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
 title:"পাইকারি পণ্যের চাহিদা | AGRIVA",
 description:"AGRIVA-তে প্রকাশিত ধান, চাল, বীজ ও অন্যান্য কৃষিপণ্যের পাইকারি চাহিদা দেখুন।",
 alternates:{canonical:"/bulk-orders"}
};
type PublicRFQ={id:string;product_name:string;quantity:number;unit:string;district:string;upazila:string;quote_deadline:string|null;created_at:string};
export default async function BulkOrders(){
 const db=await createSupabaseServerClient();
 // This table only contains admin-approved, sanitized public details (never buyer IDs/phones/bids).
 const {data,error}=await db.from("bulk_public_listings").select("id,product_name,quantity,unit,district,upazila,quote_deadline,created_at")
  .order("created_at",{ascending:false}).limit(60);
 const visible=((data??[]) as PublicRFQ[]).filter(r=>!r.quote_deadline||new Date(r.quote_deadline).getTime()>Date.now());
 return <main className="min-h-screen bg-[#f7f9f5] pb-16 text-[#17351f]">
 <div className="bg-[#123f2b] text-white"><div className="mx-auto max-w-6xl px-4 py-12">
  <p className="text-sm font-bold text-lime-300">AGRIVA BULK MARKETPLACE</p>
  <h1 className="mt-3 text-3xl font-black md:text-4xl">পাইকারি পণ্যের চাহিদা</h1>
  <p className="mt-3 max-w-2xl text-emerald-50">B2B ও B2C ক্রেতাদের চাহিদা দেখুন। যাচাইকৃত পাইকাররা আমন্ত্রণ পেয়ে নিরাপদে অফার জমা দিতে পারবেন।</p>
  <div className="mt-6 flex flex-wrap gap-3">
    <Link href="/custom-order" className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-[#17351f]">নতুন Bulk Order দিন</Link>
    <Link href="/wholesaler/requests" className="rounded-xl border border-white/50 px-5 py-3 font-bold">পাইকারের আমন্ত্রণ</Link>
  </div>
 </div></div>
 <div className="mx-auto max-w-6xl px-4 py-8">
  {error?<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">চাহিদার তালিকা পাওয়া যায়নি। অনুগ্রহ করে পরে চেষ্টা করুন।</p>:
   !visible.length?<p className="rounded-2xl bg-white p-8 text-center">এই মুহূর্তে নতুন প্রকাশিত পাইকারি চাহিদা নেই।</p>:
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(r=><article key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">যাচাইকৃত চাহিদা</span>
    <h2 className="mt-3 text-lg font-bold">{r.product_name}</h2>
    <p className="mt-2 text-sm text-slate-700">পরিমাণ: {r.quantity} {r.unit}</p>
    <p className="mt-1 text-sm text-slate-700">এলাকা: {r.district}{r.upazila?", "+r.upazila:""}</p>
    {r.quote_deadline&&<p className="mt-1 text-sm text-slate-500">অফারের শেষ সময়: {new Date(r.quote_deadline).toLocaleDateString("bn-BD",{timeZone:"Asia/Dhaka"})}</p>}
    <p className="mt-4 text-xs text-slate-500">ক্রেতার পরিচয় ও পাইকারদের দাম গোপন রাখা হয়। আমন্ত্রিত পাইকাররা লগইন করে অফার জমা দিতে পারবেন।</p>
   </article>)}</div>}
 </div></main>;
}
