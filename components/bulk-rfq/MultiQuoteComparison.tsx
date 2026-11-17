import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
type Item={id:string;product_name:string;quantity:number;unit:string;specification:string;position:number};
type Offer={id:string;item_id:string;quote_id:string;unit_price:number;shipping_fee:number;extra_fee:number};
type Quote={id:string;wholesaler_id:string;status:string;expires_at:string;lead_days:number;details:string};
type Award={item_id:string;offer_id:string;fulfillment_status:string};
const uuid=/^[0-9a-f-]{36}$/i;
async function chooseProductOffer(f:FormData){
 "use server";
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Faccount%2Fcustom-orders");
 const request=String(f.get("request")??""),offer=String(f.get("offer")??"");
 if(!uuid.test(request)||!uuid.test(offer))redirect("/account/custom-orders");
 const {data:r}=await db.from("bulk_requests").select("id").eq("buyer_id",user.id).eq("id",request).maybeSingle();
 if(!r)redirect("/account/custom-orders");
 const {error}=await db.rpc("bulk_select_item_offer",{p_offer:offer});
 redirect(`/account/custom-orders/${request}?notice=${error?"failed":"selected"}`);
}
export default async function MultiQuoteComparison({request,items,notice}:{request:{id:string;status:string};items:Item[];notice?:string}){
 const db=await createSupabaseServerClient();
 const {data:q}=await db.from("bulk_quotes").select("id,wholesaler_id,status,expires_at,lead_days,details").eq("request_id",request.id);
 const quotes=(q??[]) as Quote[];
 const active=quotes.filter(x=>x.status==="approved"&&Date.parse(x.expires_at)>Date.now());
 const {data:o}=await db.from("bulk_item_offers").select("id,item_id,quote_id,unit_price,shipping_fee,extra_fee").eq("request_id",request.id);
 const offers=(o??[]) as Offer[];
 const {data:a}=await db.from("bulk_item_awards").select("item_id,offer_id,fulfillment_status").eq("request_id",request.id);
 const awards=(a??[]) as Award[];
 const ids=[...new Set(active.map(x=>x.wholesaler_id))];
 const {data:names}=ids.length?await db.from("bulk_wholesalers").select("user_id,display_name,status").in("user_id",ids):{data:[]};
 const supplierName=new Map((names??[]).filter(n=>n.status==="verified").map(n=>[n.user_id,n.display_name]));
 const currency=(n:number)=>new Intl.NumberFormat("bn-BD",{style:"currency",currency:"BDT",maximumFractionDigits:2}).format(n);
 return <div className="mt-6 space-y-5">
  {notice==="selected"&&<p role="status" className="rounded-xl bg-emerald-100 p-4 font-semibold">পণ্যের জন্য পাইকার নির্বাচন হয়েছে। Admin নিশ্চিত করবেন।</p>}
  {notice==="failed"&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">অফার নির্বাচন করা যায়নি। মেয়াদ বা আগের নির্বাচন পরীক্ষা করুন।</p>}
  <p className="rounded-xl bg-white p-4 text-sm text-slate-700">প্রতি পণ্যের জন্য অনুমোদিত অফারগুলো ডেলিভারি ও ফিসহ মোট দামের ভিত্তিতে সাজানো। এক অর্ডারে একাধিক পাইকার বেছে নিতে পারবেন।</p>
  {items.map((item,index)=>{
   const award=awards.find(a=>a.item_id===item.id);
   const candidates=offers.filter(x=>x.item_id===item.id).map(o=>({o,q:active.find(q=>q.id===o.quote_id)})).filter((x):x is {o:Offer;q:Quote}=>!!x.q)
    .sort((a,b)=>((Number(a.o.unit_price)-Number(b.o.unit_price))*Number(item.quantity)+Number(a.o.shipping_fee)-Number(b.o.shipping_fee)+Number(a.o.extra_fee)-Number(b.o.extra_fee)));
   return <section key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold text-emerald-700">পণ্য {index+1}</p><h2 className="text-xl font-black">{item.product_name}</h2><p className="mt-1 text-sm">{item.quantity} {item.unit}</p><p className="mt-1 text-sm text-slate-600">{item.specification}</p></div>
     {award&&<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold">পাইকার নির্বাচিত — {award.fulfillment_status}</span>}
    </div>
    {!candidates.length?<p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">এই পণ্যে এখনো কোনো অনুমোদিত অফার নেই।</p>:
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{candidates.map(({o,q},j)=>{
     const total=Number(o.unit_price)*Number(item.quantity)+Number(o.shipping_fee)+Number(o.extra_fee);
     return <div key={o.id} className={`rounded-xl border p-4 ${award?.offer_id===o.id?"border-emerald-700 bg-emerald-50":"border-slate-200"}`}>
      <p className="font-bold">{supplierName.get(q.wholesaler_id)||"যাচাইকৃত পাইকার"} {j===0&&<span className="ml-1 text-xs font-semibold text-emerald-700">সর্বনিম্ন মোট দাম</span>}</p>
      <p className="mt-2 text-sm">প্রতি {item.unit}: {currency(Number(o.unit_price))}</p>
      <p className="text-sm">পরিবহন: {currency(Number(o.shipping_fee))}</p><p className="text-sm">অন্যান্য ফি: {currency(Number(o.extra_fee))}</p>
      <p className="text-sm">সম্ভাব্য সময়: {q.lead_days} দিন</p>
      <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{q.details}</p>
      <p className="mt-3 text-xl font-black">{currency(total)}</p>
      {award?.offer_id===o.id?<p className="mt-3 font-bold text-emerald-800">✓ নির্বাচিত অফার</p>:
       !award&&request.status==="open"?<form className="mt-3" action={chooseProductOffer}>
        <input type="hidden" name="request" value={request.id}/><input type="hidden" name="offer" value={o.id}/>
        <button className="w-full rounded-xl bg-emerald-800 px-3 py-3 text-sm font-bold text-white">এই পণ্যের জন্য নির্বাচন করুন</button></form>:null}
     </div>;
    })}</div>}
   </section>;
  })}
 </div>;
}
