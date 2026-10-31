"use client";
import { useCallback, useEffect, useState } from "react";
type Market="marketplace"|"plant-market";
type Application={id:string;user_id:string;business_name?:string;nursery_name?:string;business_type:string;contact_phone:string;business_address?:string;nursery_address?:string;trade_license?:string|null;created_at:string};
export default function SellerApplicationReview(){
  const [market,setMarket]=useState<Market>("marketplace");
  const [items,setItems]=useState<Application[]>([]);
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setMessage("");
    try{const response=await fetch(`/api/admin/seller-applications/${market}/queue`,{cache:"no-store"});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"আবেদন লোড করা যায়নি।");setItems(data.applications||[]);}
    catch(error){setMessage(error instanceof Error?error.message:"নেটওয়ার্ক সমস্যা হয়েছে।");}
    finally{setLoading(false);}
  },[market]);
  useEffect(()=>{void load();},[load]);
  async function review(id:string,status:"approved"|"rejected"){
    setLoading(true);setMessage("");
    try{const response=await fetch(`/api/admin/seller-applications/${market}/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,review_note:notes[id]||""})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"সিদ্ধান্ত সংরক্ষণ হয়নি।");setItems(current=>current.filter(item=>item.id!==id));setMessage(status==="approved"?"Seller permission অনুমোদিত হয়েছে।":"আবেদন প্রত্যাখ্যান করা হয়েছে।");}
    catch(error){setMessage(error instanceof Error?error.message:"নেটওয়ার্ক সমস্যা হয়েছে।");}
    finally{setLoading(false);}
  }
  return <section className="mt-6">
    <div className="flex flex-wrap gap-2"><button onClick={()=>setMarket("marketplace")} className={market==="marketplace"?"rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white":"rounded-xl border bg-white px-4 py-3 text-sm font-bold"}>Marketplace আবেদন</button><button onClick={()=>setMarket("plant-market")} className={market==="plant-market"?"rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white":"rounded-xl border bg-white px-4 py-3 text-sm font-bold"}>Plant Market আবেদন</button><button onClick={()=>void load()} disabled={loading} className="rounded-xl border bg-white px-4 py-3 text-sm font-bold">রিফ্রেশ</button></div>
    {message&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
    {loading?<p className="mt-6 text-sm text-slate-600">লোড হচ্ছে…</p>:items.length===0?<p className="mt-6 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">এই মার্কেটে কোনো Pending Seller Application নেই।</p>:<div className="mt-5 space-y-4">{items.map(item=><article key={item.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{item.business_name||item.nursery_name}</h2><p className="mt-1 text-sm text-slate-600">{item.business_type} · {item.contact_phone}</p><p className="mt-1 text-sm text-slate-600">{item.business_address||item.nursery_address}</p>{item.trade_license&&<p className="mt-1 text-xs text-slate-500">লাইসেন্স: {item.trade_license}</p>}<p className="mt-1 text-xs text-slate-400">User ID: {item.user_id} · {new Date(item.created_at).toLocaleString("bn-BD")}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Pending</span></div><label className="mt-4 block text-sm font-bold">পর্যালোচনা নোট (ঐচ্ছিক)<textarea value={notes[item.id]||""} onChange={e=>setNotes(current=>({...current,[item.id]:e.target.value}))} maxLength={1000} rows={2} className="mt-2 w-full rounded-xl border px-3 py-2"/></label><div className="mt-4 flex flex-wrap gap-2"><button disabled={loading} onClick={()=>void review(item.id,"approved")} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">অনুমোদন করুন</button><button disabled={loading} onClick={()=>void review(item.id,"rejected")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-800 disabled:opacity-50">প্রত্যাখ্যান করুন</button></div></article>)}</div>}
  </section>;
}