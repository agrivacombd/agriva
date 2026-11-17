import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { comparableQuotes } from "@/lib/bulk-rfq/comparison";
export const dynamic="force-dynamic";
async function acceptQuote(data:FormData){
 "use server";
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Faccount%2Fcustom-orders");
 const quote=String(data.get("quote")||"");
 const request=String(data.get("request")||"");
 if(!/^[0-9a-f-]{36}$/i.test(quote)||!/^[0-9a-f-]{36}$/i.test(request))redirect("/account/custom-orders");
 const {data:owned}=await db.from("bulk_requests").select("id").eq("id",request).eq("buyer_id",user.id).maybeSingle();
 if(!owned)redirect("/account/custom-orders");
 const {error}=await db.rpc("bulk_select_quote",{p_quote:quote});
 redirect(`/account/custom-orders/${request}?notice=${error?"failed":"selected"}`);
}
type Quote={id:string;wholesaler_id:string;unit_price:number;shipping_fee:number;extra_fee:number;lead_days:number;expires_at:string;status:"approved"|"pending"|"rejected"|"withdrawn";details:string};
export default async function Compare({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{notice?:string}>}){
 const {id}=await params;const p=await searchParams;
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Faccount%2Fcustom-orders");
 const {data:request}=await db.from("bulk_requests").select("id,buyer_id,product_name,quantity,unit,district,upazila,status").eq("id",id).eq("buyer_id",user.id).maybeSingle();
 if(!request)notFound();
 const {data:selection}=await db.from("bulk_selections").select("quote_id,fulfillment_status,updated_at").eq("request_id",id).eq("buyer_id",user.id).maybeSingle();
 const fulfillment:Record<string,string>={pending_confirmation:"অর্ডার নিশ্চিতকরণের অপেক্ষায়",confirmed:"অর্ডার নিশ্চিত",processing:"প্রসেসিং চলছে",shipped:"পণ্য পাঠানো হয়েছে",delivered:"ডেলিভারি সম্পন্ন",completed:"সম্পূর্ণ হয়েছে",cancelled:"বাতিল"};
 const {data}=await db.from("bulk_quotes").select("id,wholesaler_id,unit_price,shipping_fee,extra_fee,lead_days,expires_at,status,details").eq("request_id",id);
 const approved=(data??[] as Quote[]).filter(q=>q.status==="approved");
 const supplierIds=[...new Set(approved.map(q=>q.wholesaler_id))];
 const {data:verifiedSuppliers}=supplierIds.length?await db.from("bulk_wholesalers").select("user_id,display_name,status").in("user_id",supplierIds):{data:[]};
 const supplierNames=new Map((verifiedSuppliers??[]).filter(w=>w.status==="verified").map(w=>[w.user_id,w.display_name]));
 const sortedIds=comparableQuotes(approved.map(q=>({id:q.id,productSubtotalMinor:Math.round(Number(q.unit_price)*Number(request.quantity)*100),shippingMinor:Math.round(Number(q.shipping_fee)*100),feesMinor:Math.round(Number(q.extra_fee)*100),deliveryDays:q.lead_days,expiresAt:q.expires_at,status:q.status}))).map(q=>q.id);
 const quotes=sortedIds.map(id=>approved.find(q=>q.id===id)!).filter(Boolean);
 const money=(n:number)=>new Intl.NumberFormat("bn-BD",{style:"currency",currency:"BDT",maximumFractionDigits:2}).format(n);
 return <main className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-5xl">
 <Link href="/account/custom-orders" className="text-sm font-bold text-emerald-800 underline">← আমার অর্ডার</Link><h1 className="mt-4 text-3xl font-black">পাইকারদের অফার তুলনা</h1>
 <p className="mt-2 text-slate-600">{request.product_name} · {request.quantity} {request.unit} · {request.district}</p>
 {selection&&<p role="status" className="mt-4 rounded-xl bg-emerald-100 p-4 font-semibold">অর্ডারের অবস্থা: {fulfillment[selection.fulfillment_status]??selection.fulfillment_status}</p>}
 {p.notice==="selected"&&<p role="status" className="mt-5 rounded-xl bg-emerald-100 p-4">পাইকার নির্বাচনের অনুরোধ গ্রহণ করা হয়েছে। অ্যাডমিন সরবরাহ ও পেমেন্টের শর্ত নিশ্চিত করবেন।</p>}
 {p.notice==="failed"&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4">অফার নির্বাচন করা যায়নি। অফারটির মেয়াদ বা অর্ডারের অবস্থা পরীক্ষা করুন।</p>}
 <p className="mt-5 rounded-xl bg-white p-4 text-sm">এখানে শুধুমাত্র অ্যাডমিন-অনুমোদিত, মেয়াদোত্তীর্ণ নয় এমন অফার দেখানো হচ্ছে। ডেলিভারি ও অতিরিক্ত ফিসহ মোট মূল্য অনুযায়ী সাজানো।</p>
 {!quotes.length?<p className="mt-6 rounded-xl bg-white p-6">এখনো কোনো অনুমোদিত অফার নেই। কিছু সময় পরে আবার দেখুন।</p>:
 <div className="mt-6 grid gap-4 md:grid-cols-2">{quotes.map((q,i)=>{
 const total=Number(q.unit_price)*Number(request.quantity)+Number(q.shipping_fee)+Number(q.extra_fee);
 return <article key={q.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
 <div className="flex justify-between gap-2"><h2 className="font-bold">{supplierNames.get(q.wholesaler_id)||`যাচাইকৃত পাইকার ${i+1}`}</h2>{i===0&&<span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold">সর্বনিম্ন মোট মূল্য</span>}</div>
 <p className="mt-3 text-sm">প্রতি {request.unit}: {money(Number(q.unit_price))}</p>
 <p className="text-sm">পরিবহন: {money(Number(q.shipping_fee))}</p>
 <p className="text-sm">অন্যান্য ফি: {money(Number(q.extra_fee))}</p>
 <p className="text-sm">সম্ভাব্য সরবরাহ: {q.lead_days} দিন</p>
 <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{q.details}</p>
 <p className="mt-4 text-xl font-black">{money(total)}</p>
 <p className="text-xs text-slate-500">অফারের মেয়াদ: {new Date(q.expires_at).toLocaleString("bn-BD",{timeZone:"Asia/Dhaka"})}</p>
 {request.status==="open"&&<form action={acceptQuote} className="mt-4"><input type="hidden" name="quote" value={q.id}/><input type="hidden" name="request" value={request.id}/><button className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white">এই অফারটি নির্বাচন করুন</button></form>}
 </article>})}</div>}
 </div></main>;
}
