"use client";
import { useState } from "react";
type Props = { market: "marketplace" | "plant-market" };
const ENDPOINTS = { marketplace: "/api/seller/applications", "plant-market": "/api/plant-seller/applications" };
export default function SellerApplicationForm({ market }: Props) {
  const [form,setForm] = useState({ business_name:"", business_type:"", contact_phone:"", business_address:"", trade_license:"" });
  const [message,setMessage] = useState(""); const [loading,setLoading] = useState(false); const plant = market === "plant-market";
  function set(key:keyof typeof form,value:string){setForm(current=>({...current,[key]:value}));}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setMessage("");
    try{const response=await fetch(ENDPOINTS[market],{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"আবেদন জমা দেওয়া যায়নি।");setMessage("আপনার আবেদন জমা হয়েছে। অ্যাডমিন যাচাই ও অনুমোদন না দেওয়া পর্যন্ত পণ্য যোগ করা যাবে না।");setForm({business_name:"",business_type:"",contact_phone:"",business_address:"",trade_license:""});}
    catch(error){setMessage(error instanceof Error?error.message:"নেটওয়ার্ক সমস্যা হয়েছে।");}finally{setLoading(false);}
  }
  const field="mt-2 w-full rounded-xl border px-4 py-3";
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm">
    <label className="block text-sm font-bold">{plant?"নার্সারি / প্রতিষ্ঠানের নাম":"ব্যবসার নাম"}<input required minLength={2} maxLength={160} value={form.business_name} onChange={e=>set("business_name",e.target.value)} className={field}/></label>
    <label className="block text-sm font-bold">ব্যবসার ধরন<input required minLength={2} maxLength={80} value={form.business_type} onChange={e=>set("business_type",e.target.value)} placeholder={plant?"যেমন: নার্সারি, ফলের চারা উৎপাদন":"যেমন: বীজ, সার, কৃষি যন্ত্রপাতি"} className={field}/></label>
    <label className="block text-sm font-bold">যোগাযোগের ফোন<input required minLength={6} maxLength={30} value={form.contact_phone} onChange={e=>set("contact_phone",e.target.value)} className={field}/></label>
    <label className="block text-sm font-bold">ব্যবসার ঠিকানা<textarea required minLength={5} maxLength={500} value={form.business_address} onChange={e=>set("business_address",e.target.value)} className={field}/></label>
    <label className="block text-sm font-bold">ট্রেড লাইসেন্স / নিবন্ধন নম্বর (ঐচ্ছিক)<input maxLength={120} value={form.trade_license} onChange={e=>set("trade_license",e.target.value)} className={field}/></label>
    <button disabled={loading} className="min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-extrabold text-white disabled:opacity-60">{loading?"জমা হচ্ছে…":"আবেদন জমা দিন"}</button>
    {message&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">{message}</p>}
  </form>;
}