import {formatBulkDeliveryArea} from "@/lib/bulk-rfq/delivery-area";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const statusLabel:Record<string,string>={pending_confirmation:"অর্ডার নিশ্চিতকরণের অপেক্ষায়",confirmed:"নিশ্চিত",processing:"প্রসেসিং",shipped:"পাঠানো হয়েছে",delivered:"ডেলিভারি সম্পন্ন",completed:"সম্পন্ন",cancelled:"বাতিল"};
export default async function WholesalerOrders(){
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Fwholesaler%2Forders");
 const {data:myQuotes,error}=await db.from("bulk_quotes").select("id,request_id,unit_price,shipping_fee,extra_fee").eq("wholesaler_id",user.id).limit(200);
 const quoteIds=(myQuotes??[]).map(q=>q.id);
 const {data:selected}=quoteIds.length?await db.from("bulk_selections").select("request_id,quote_id,fulfillment_status,updated_at").in("quote_id",quoteIds):{data:[]};
 const {data:myLineOffers}=quoteIds.length?await db.from("bulk_item_offers").select("id,quote_id,item_id,request_id,unit_price,shipping_fee,extra_fee").in("quote_id",quoteIds):{data:[]};
 const offerIds=(myLineOffers??[]).map(x=>x.id);
 const {data:awards}=offerIds.length?await db.from("bulk_item_awards").select("item_id,offer_id,request_id,fulfillment_status").in("offer_id",offerIds):{data:[]};
 const selectedIds=[...new Set([...(selected??[]).map(x=>x.request_id),...(awards??[]).map(x=>x.request_id)])];
 const itemIds=(awards??[]).map(x=>x.item_id);
 const {data:items}=itemIds.length?await db.from("bulk_request_items").select("id,product_name,quantity,unit").in("id",itemIds):{data:[]};
 const itemDetails=new Map((items??[]).map(x=>[x.id,x]));
 const lineDetails=new Map((myLineOffers??[]).map(x=>[x.id,x]));
 const {data:requests}=selectedIds.length?await db.from("bulk_requests").select("id,product_name,quantity,unit,district,upazila").in("id",selectedIds):{data:[]};
 const details=new Map((requests??[]).map(r=>[r.id,r]));
 const quotes=new Map((myQuotes??[]).map(q=>[q.id,q]));
 const money=(n:number)=>new Intl.NumberFormat("bn-BD",{style:"currency",currency:"BDT",maximumFractionDigits:2}).format(n);
 return <main className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-4xl">
  <Link href="/wholesaler/requests" className="text-sm font-bold text-emerald-700 underline">← কোটেশন Dashboard</Link>
  <h1 className="mt-4 text-3xl font-black">পাইকারের নির্বাচিত অর্ডার</h1>
  <p className="mt-2 text-slate-600">ক্রেতা আপনার কোটেশন নির্বাচন করলে এখানে অর্ডারের অবস্থা দেখতে পারবেন।</p>
  {error?<p role="alert" className="mt-6 rounded-xl bg-red-50 p-5">অর্ডার তালিকা লোড করা যায়নি।</p>:
   !(selected?.length||awards?.length)?<p className="mt-6 rounded-xl bg-white p-6">এখনো কোনো ক্রেতা আপনার কোটেশন নির্বাচন করেননি।</p>:
   <div className="mt-6 grid gap-4">
   {(awards??[]).map(a=>{
    const it=itemDetails.get(a.item_id),line=lineDetails.get(a.offer_id),r=details.get(a.request_id);
    if(!it||!line||!r)return null;
    const total=Number(it.quantity)*Number(line.unit_price)+Number(line.shipping_fee)+Number(line.extra_fee);
    return <article key={a.item_id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
     <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-bold">{it.product_name}</h2>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold">{statusLabel[a.fulfillment_status]??a.fulfillment_status}</span></div>
     <p className="mt-2 text-sm">পরিমাণ: {it.quantity} {it.unit} · {formatBulkDeliveryArea(r.district,r.upazila)}</p>
     <p className="mt-2 text-sm">আপনার নির্বাচিত অফার: <strong>{money(total)}</strong></p>
     <p className="mt-2 text-xs text-slate-500">ক্রেতার যোগাযোগ ও পূর্ণ ঠিকানা Admin নিশ্চিত করার পরে সরবরাহের জন্য জানাবেন।</p>
    </article>;
   })}
   {(selected??[]).map(s=>{
    const r=details.get(s.request_id),q=quotes.get(s.quote_id);
    if(!r||!q)return null;
    const total=Number(r.quantity)*Number(q.unit_price)+Number(q.shipping_fee)+Number(q.extra_fee);
    return <article key={s.request_id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-bold">{r.product_name}</h2>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold">{statusLabel[s.fulfillment_status]??s.fulfillment_status}</span></div>
      <p className="mt-3 text-sm">পরিমাণ: {r.quantity} {r.unit} · এলাকা: {formatBulkDeliveryArea(r.district,r.upazila)}</p>
      <p className="mt-2 text-sm">আপনার কোটেশন: <strong>{money(total)}</strong></p>
      <p className="mt-3 text-xs text-slate-500">নিরাপত্তার জন্য ক্রেতার ফোন ও সম্পূর্ণ ঠিকানা এখানে প্রকাশ করা হয় না। AGRIVA Admin নিশ্চিতকরণের পরে পরবর্তী নির্দেশনা দেবেন।</p>
    </article>;
   })}</div>}
 </div></main>;
}
