import {formatBulkDeliveryArea} from "@/lib/bulk-rfq/delivery-area";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function submitQuote(f:FormData){
 "use server";
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Fwholesaler%2Frequests");
 const request_id=String(f.get("request_id")??""),lead_days=Number(f.get("lead_days"));
 const details=String(f.get("details")??"").trim();
 if(!uuid.test(request_id)||!Number.isInteger(lead_days)||lead_days<1||lead_days>365||details.length>2000)
  redirect("/wholesaler/requests?notice=invalid");
 const {data:items,error:itemsError}=await db.from("bulk_request_items")
 .select("id").eq("request_id",request_id).order("position",{ascending:true});
 if(itemsError)redirect("/wholesaler/requests?notice=failed");
 if(items?.length){
  const chosen=f.getAll("quoted_item").map(String);
  if(!chosen.length||chosen.length>20||new Set(chosen).size!==chosen.length||chosen.some(id=>!items.some(x=>x.id===id)))
   redirect("/wholesaler/requests?notice=invalid");
  const lines=[];
  for(const item_id of chosen){
   const unit_price=String(f.get(`price_${item_id}`)??"");
   const shipping_fee=String(f.get(`shipping_${item_id}`)??"0");
   const extra_fee=String(f.get(`fee_${item_id}`)??"0");
   if(!/^\d{1,7}(\.\d{1,2})?$/.test(unit_price)||!/^\d{1,9}(\.\d{1,2})?$/.test(shipping_fee)||
     !/^\d{1,9}(\.\d{1,2})?$/.test(extra_fee)||Number(unit_price)<=0||Number(unit_price)>1000000)
    redirect("/wholesaler/requests?notice=invalid");
   lines.push({item_id,unit_price,shipping_fee,extra_fee});
  }
  const {error}=await db.rpc("bulk_submit_multi_quote",{p_request:request_id,p_lines:lines,p_lead_days:lead_days,p_details:details});
  redirect(`/wholesaler/requests?notice=${error?"failed":"submitted"}`);
 }
 // Historical single-product RFQs keep their previous quotation behavior.
 const unit_price=Number(f.get("unit_price")),shipping_fee=Number(f.get("shipping_fee")),extra_fee=Number(f.get("extra_fee"));
 if(![unit_price,shipping_fee,extra_fee].every(Number.isFinite)||unit_price<=0||unit_price>1000000||shipping_fee<0||extra_fee<0)
  redirect("/wholesaler/requests?notice=invalid");
 const {error}=await db.from("bulk_quotes").insert({request_id,wholesaler_id:user.id,
 unit_price,shipping_fee,extra_fee,lead_days,details,expires_at:new Date(Date.now()+604800000).toISOString(),status:"pending"});
 redirect(`/wholesaler/requests?notice=${error?"failed":"submitted"}`);
}
export default async function WholesalerRequests({searchParams}:{searchParams:Promise<{notice?:string;request?:string}>}){
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Fwholesaler%2Frequests");
 const {data:invitations,error}=await db.from("bulk_invitations").select("request_id,expires_at,revoked_at")
  .eq("wholesaler_id",user.id).order("created_at",{ascending:false}).limit(50);
 const ids=(invitations??[]).filter(i=>!i.revoked_at&&Date.parse(i.expires_at)>Date.now()).map(x=>x.request_id);
 const {data:requests}=ids.length?await db.from("bulk_requests").select("id,product_name,specification,quantity,unit,district,upazila,status").in("id",ids):{data:[]};
 const {data:items}=ids.length?await db.from("bulk_request_items").select("id,request_id,product_name,specification,quantity,unit,position").in("request_id",ids).order("position",{ascending:true}):{data:[]};
 const {data:existing}=ids.length?await db.from("bulk_quotes").select("request_id").eq("wholesaler_id",user.id).in("request_id",ids):{data:[]};
 const quoted=new Set((existing??[]).map(q=>q.request_id)),p=await searchParams;
 const field="w-full rounded-xl border border-slate-300 p-3";
 return <main className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-4xl">
  <Link className="text-sm font-bold text-emerald-700 underline" href="/custom-order">← Bulk Order</Link>
  <h1 className="mt-4 text-3xl font-black">পাইকারের Quotation Dashboard</h1>
  <Link href="/wholesaler/orders" className="mt-4 inline-flex rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">নির্বাচিত অর্ডার দেখুন</Link>
  <p className="mt-3 text-slate-600">প্রতিটি পণ্যের আলাদা দাম দিন। কোনো পণ্য দিতে না পারলে সেটি আনচেক করুন। অন্য পাইকারের দাম আপনার কাছে গোপন থাকবে।</p>
  {p.notice&&<p role="status" className="mt-4 rounded-xl bg-white p-4">{p.notice==="submitted"?"কোটেশন জমা হয়েছে; Admin অনুমোদনের অপেক্ষায়।":p.notice==="invalid"?"দাম বা পণ্যের তথ্য সংশোধন করুন।":"কোটেশন জমা দেওয়া যায়নি। আগে জমা দিয়েছেন কি না যাচাই করুন।"}</p>}
  {error?<p role="alert" className="mt-6 rounded-xl bg-red-50 p-4">আমন্ত্রণ লোড হয়নি।</p>:!requests?.length?<p className="mt-6 rounded-xl bg-white p-6">কোনো সক্রিয় আমন্ত্রণ নেই।</p>:
  <div className="mt-6 grid gap-5">{requests.filter(r=>!p.request||r.id===p.request).map(r=>{
    const list=(items??[]).filter(i=>i.request_id===r.id);
    return <article key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
     <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{r.product_name}{list.length>1?` + আরও ${list.length-1}টি`:""}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{r.status==="open"?"অফার চলছে":"বন্ধ"}</span></div>
     <p className="mt-2 text-sm">ডেলিভারি: {formatBulkDeliveryArea(r.district,r.upazila)}</p>
     {quoted.has(r.id)?<p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm">এই অনুরোধে ইতোমধ্যে অফার জমা হয়েছে।</p>:
     r.status==="open"?<form action={submitQuote} className="mt-5 space-y-4">
      <input type="hidden" name="request_id" value={r.id}/>
      {list.length?list.map(it=><fieldset className="rounded-xl border border-slate-200 p-4" key={it.id}>
       <legend className="px-2 font-semibold">{it.product_name} — {it.quantity} {it.unit}</legend>
       <p className="mb-2 text-sm text-slate-600">{it.specification}</p>
       <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" defaultChecked name="quoted_item" value={it.id}/> এই পণ্য সরবরাহ করব</label>
       <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">প্রতি {it.unit} মূল্য (৳)<input type="number" min=".01" max="1000000" step=".01" name={`price_${it.id}`} className={field} placeholder="দাম"/></label>
        <label className="text-sm">ডেলিভারি চার্জ (৳)<input type="number" min="0" step=".01" name={`shipping_${it.id}`} defaultValue="0" className={field}/></label>
        <label className="text-sm">অন্যান্য ফি (৳)<input type="number" min="0" step=".01" name={`fee_${it.id}`} defaultValue="0" className={field}/></label>
       </div>
      </fieldset>):<fieldset className="grid gap-3 sm:grid-cols-3"><legend className="mb-2 font-bold">{r.product_name} · {r.quantity} {r.unit}</legend>
       <label className="text-sm">প্রতি একক মূল্য (৳)<input required type="number" min=".01" max="1000000" step=".01" name="unit_price" className={field}/></label>
       <label className="text-sm">ডেলিভারি (৳)<input required type="number" min="0" step=".01" name="shipping_fee" defaultValue="0" className={field}/></label>
       <label className="text-sm">অন্যান্য ফি (৳)<input required type="number" min="0" step=".01" name="extra_fee" defaultValue="0" className={field}/></label>
      </fieldset>}
      <label className="block text-sm font-semibold">সরবরাহের সময় (দিন)<input required min="1" max="365" type="number" name="lead_days" className={field}/></label>
      <label className="block text-sm font-semibold">পণ্যের মান ও শর্ত<textarea name="details" maxLength={2000} rows={3} className={field}/></label>
      <button className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white">পণ্যের কোটেশন জমা দিন</button>
     </form>:null}
    </article>;
   })}</div>}
 </div></main>;
}
