import { AdminPage as AdminPageLayout, AdminErrorState } from "@/components/admin/ui/AdminPrimitives";
import {formatBulkDeliveryArea} from "@/lib/bulk-rfq/delivery-area";
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
async function transitionFulfillment(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("orders.transition");
 const request=String(f.get("request_id")??"");
 const status=String(f.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(request)||!["confirmed","processing","shipped","delivered","completed","cancelled"].includes(status))redirect("/admin/custom-orders?notice=invalid");
 const {error}=await supabase.rpc("bulk_transition_fulfillment",{p_request:request,p_status:status});
 redirect(`/admin/custom-orders?notice=${error?"error":"updated"}`);
}
async function transitionItem(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("orders.transition");
 const item=String(f.get("item_id")??""),status=String(f.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(item)||!["confirmed","processing","shipped","delivered","completed","cancelled"].includes(status))
  redirect("/admin/custom-orders?notice=invalid");
 const {error}=await supabase.rpc("bulk_transition_item_fulfillment",{p_item:item,p_status:status});
 redirect(`/admin/custom-orders?notice=${error?"error":"updated"}`);
}
async function verifyWholesaler(f:FormData){
 "use server";
 const {supabase}=await requireAdminPage("identity.review");
 const user=String(f.get("user_id")??"").trim();
 const status=String(f.get("status")??"");
 const display_name=String(f.get("display_name")??"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(user)||!["verified","suspended"].includes(status)||display_name.length>120||(status==="verified"&&display_name.length<2))redirect("/admin/custom-orders?notice=invalid");
 const {error}=await supabase.rpc("bulk_verify_named_wholesaler",{p_user:user,p_status:status,p_display_name:display_name});
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
 const requestIds=(requests??[]).map(x=>x.id);
 const {data:multiItems}=requestIds.length?await supabase.from("bulk_request_items")
  .select("id,request_id,product_name,quantity,unit,position").in("request_id",requestIds).order("position",{ascending:true}):{data:[]};
 const {data:itemAwards}=requestIds.length?await supabase.from("bulk_item_awards")
  .select("item_id,request_id,offer_id,fulfillment_status").in("request_id",requestIds):{data:[]};
 const {data:multiOffers}=requestIds.length?await supabase.from("bulk_item_offers")
  .select("id,request_id,quote_id,item_id,unit_price,shipping_fee,extra_fee").in("request_id",requestIds):{data:[]};
 const {data:selections}=await supabase.from("bulk_selections").select("request_id,fulfillment_status").limit(100);
 const fulfillmentNext:Record<string,string[]>={pending_confirmation:["confirmed","cancelled"],confirmed:["processing","cancelled"],processing:["shipped","cancelled"],shipped:["delivered"],delivered:["completed"],completed:[],cancelled:[]};
 const fulfillmentBn:Record<string,string>={pending_confirmation:"নিশ্চিতকরণের অপেক্ষায়",confirmed:"নিশ্চিত",processing:"প্রসেসিং",shipped:"পাঠানো হয়েছে",delivered:"ডেলিভারি সম্পন্ন",completed:"সম্পন্ন",cancelled:"বাতিল"};
 const {data:quotes}=await supabase.from("bulk_quotes").select("id,request_id,wholesaler_id,unit_price,shipping_fee,extra_fee,status,created_at").order("created_at",{ascending:false}).limit(100);
 const {data:profiles}=await supabase.from("profiles").select("id,full_name,role").order("full_name",{ascending:true}).limit(300);
 const p=await searchParams;
 const field="rounded-xl border border-slate-300 px-3 py-2 text-sm";
 return <AdminPageLayout className="min-h-screen bg-[#f7f9f5] px-4 py-10 text-[#17351f]"><div className="mx-auto max-w-6xl">
  <Link href="/admin" className="font-semibold text-emerald-800 underline">← Admin</Link>
  <h1 className="mt-3 text-3xl font-black">Bulk RFQ · Admin Dashboard</h1>
  <p className="mt-2 text-slate-600">চাহিদা যাচাই, পাইকারকে আমন্ত্রণ এবং কোটেশন অনুমোদন।</p>
  {p.notice&&<p role="status" className="mt-5 rounded-xl bg-white p-4">{p.notice==="verified"?"পাইকারের যাচাইকরণ আপডেট হয়েছে।":p.notice==="invited"?"পাইকারের অ্যাকাউন্টে আমন্ত্রণ যুক্ত হয়েছে।":p.notice==="updated"?"তথ্য আপডেট হয়েছে।":p.notice==="not_wholesaler"?"এই ব্যবহারকারীকে অনুমোদিত পাইকার হিসেবে পাওয়া যায়নি।":"অনুরোধ সম্পন্ন হয়নি; permissions ও অবস্থা যাচাই করুন।"}</p>}
  <datalist id="bulk-wholesaler-accounts">{profiles?.map(p=><option key={p.id} value={p.id} label={p.full_name??p.role}/>)}</datalist>
  <form action={verifyWholesaler} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-100 bg-white p-5">
    <label className="grid gap-1 text-sm font-semibold">Wholesaler Account UUID<input required name="user_id" list="bulk-wholesaler-accounts" placeholder="অ্যাকাউন্ট খুঁজুন বা ID লিখুন" className={field}/></label>
    <label className="grid gap-1 text-sm font-semibold">পাইকারের ব্যবসায়িক নাম<input name="display_name" required maxLength={120} placeholder="যেমন: কৃষি ট্রেডার্স" className={field}/></label>
    <label className="grid gap-1 text-sm font-semibold">Verification<select name="status" className={field}><option value="verified">Verify</option><option value="suspended">Suspend</option></select></label>
    <button className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Save Verification</button>
   </form>
  {error?<div className="mt-6"><AdminErrorState title="RFQ তালিকা লোড করা যায়নি" description="Migration বা authorization যাচাই করুন।"/></div>:<div className="mt-7 grid gap-4">{requests?.map(r=><section key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{r.product_name}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{r.status}</span></div>
   <p className="mt-2 text-sm">{r.quantity} {r.unit} · {formatBulkDeliveryArea(r.district)} · {r.buyer_type} · {r.visibility}</p>
   {(multiItems??[]).filter(it=>it.request_id===r.id).length>0&&<div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
    <p className="mb-3 font-bold">পণ্যের তালিকা</p>
    {(multiItems??[]).filter(it=>it.request_id===r.id).map(it=>{
     const award=(itemAwards??[]).find(a=>a.item_id===it.id);
     return <div key={it.id} className="mb-2 rounded-lg bg-white p-3">
      <p className="text-sm font-semibold">{it.product_name} · {it.quantity} {it.unit}</p>
      {award&&<><p className="mt-1 text-xs text-emerald-800">পাইকার নির্বাচিত · {fulfillmentBn[award.fulfillment_status]??award.fulfillment_status}</p>
       <div className="mt-2 flex flex-wrap gap-2">{(fulfillmentNext[award.fulfillment_status]??[]).map(status=><form key={status} action={transitionItem}>
        <input type="hidden" name="item_id" value={it.id}/><input type="hidden" name="status" value={status}/>
        <button className="rounded-lg border px-3 py-2 text-xs font-semibold">{fulfillmentBn[status]??status}</button>
       </form>)}</div></>}
     </div>;
    })}
   </div>}
   <div className="mt-4 flex flex-wrap gap-2">{(["open","closed","cancelled"] as const).map(status=><form key={status} action={changeRequest}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="status" value={status}/><button disabled={r.status===status||r.status==="selected"} className="rounded-xl border border-emerald-700 px-3 py-2 text-sm font-bold disabled:opacity-40">{status==="open"?"অনুমোদন / Open":status==="closed"?"বন্ধ করুন":"বাতিল করুন"}</button></form>)}</div>
   <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm">
     <p className="font-bold">পাইকারের জন্য নিরাপদ আমন্ত্রণ লিংক</p>
     <p className="mt-1 text-slate-600">প্রথমে যাচাইকৃত পাইকারের অ্যাকাউন্টে আমন্ত্রণ যুক্ত করুন, তারপর নিচের লিংক পাঠান। লগইন ছাড়া লিংকটি অফার জমার অনুমতি দেয় না।</p>
     <input aria-label="পাইকারের আমন্ত্রণ লিংক" readOnly value={`https://agriva.com.bd/wholesaler/requests?request=${encodeURIComponent(r.id)}`} className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm"/>
    </div>
   <form action={inviteWholesaler} className="mt-5 flex flex-wrap gap-2"><input type="hidden" name="request_id" value={r.id}/><label className="sr-only" htmlFor={`wholesaler-${r.id}`}>পাইকারের অ্যাকাউন্ট ID</label><input id={`wholesaler-${r.id}`} required name="wholesaler_id" list="bulk-wholesaler-accounts" placeholder="যাচাইকৃত পাইকার নির্বাচন করুন" className={field}/><button className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">পাইকারকে আমন্ত্রণ</button></form>
   {selections?.filter(sel=>sel.request_id===r.id).map(sel=><div key={sel.request_id} className="mt-4 rounded-xl border border-emerald-200 p-3">
     <p className="font-bold">নির্বাচিত অর্ডার: {fulfillmentBn[sel.fulfillment_status]??sel.fulfillment_status}</p>
     <div className="mt-2 flex flex-wrap gap-2">{(fulfillmentNext[sel.fulfillment_status]??[]).map(status=><form key={status} action={transitionFulfillment}>
      <input type="hidden" name="request_id" value={r.id}/><input type="hidden" name="status" value={status}/>
      <button className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold">{fulfillmentBn[status]??status}</button>
     </form>)}</div>
    </div>)}
   <div className="mt-5 space-y-2">{quotes?.filter(q=>q.request_id===r.id).map(q=><div key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
    <div><strong>পাইকার {q.wholesaler_id.slice(0,8)}…</strong>
     {(multiOffers??[]).some(o=>o.quote_id===q.id)?(multiOffers??[]).filter(o=>o.quote_id===q.id).map(o=><p key={o.id} className="mt-1 text-xs">{(multiItems??[]).find(i=>i.id===o.item_id)?.product_name??"পণ্য"}: ৳{o.unit_price}/একক + ডেলিভারি ৳{o.shipping_fee} + ফি ৳{o.extra_fee}</p>):
      <p>প্রতি একক ৳{q.unit_price} + পরিবহন ৳{q.shipping_fee} + অন্যান্য ৳{q.extra_fee}</p>}
     <p className="text-xs text-slate-500">{q.status}</p></div>
    <div className="flex gap-2">{(["approved","rejected"] as const).map(status=><form key={status} action={moderateQuote}><input type="hidden" name="id" value={q.id}/><input type="hidden" name="status" value={status}/><button disabled={q.status===status} className="rounded-lg border border-emerald-800 px-3 py-2 font-semibold disabled:opacity-40">{status==="approved"?"অনুমোদন":"বাতিল"}</button></form>)}</div>
   </div>)}</div>
  </section>)}</div>}
 </div></AdminPageLayout>;
}
