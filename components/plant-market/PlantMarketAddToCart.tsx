"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function PlantMarketAddToCart({productId,disabled=false}:{productId:string;disabled?:boolean}){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const router=useRouter();
 async function add(){if(busy||disabled)return;setBusy(true);setMessage("");try{const response=await fetch("/api/plant-market/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,quantity:1})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"কার্টে যোগ করা যায়নি।");setMessage("কার্টে যোগ হয়েছে।");router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"আবার চেষ্টা করুন।");}finally{setBusy(false);}}
 return <div className="mt-6"><div className="flex flex-wrap gap-3"><button type="button" onClick={add} disabled={busy||disabled} className="min-h-12 rounded-xl bg-emerald-900 px-6 py-3 font-extrabold text-white disabled:opacity-50">{busy?"যোগ হচ্ছে…":"কার্টে যোগ করুন"}</button><a href="/plant-market/cart" className="inline-flex min-h-12 items-center rounded-xl border border-emerald-900/20 px-5 py-3 font-bold text-emerald-950">Plant Market Cart</a></div>{message&&<p role="status" className="mt-3 text-sm text-emerald-800">{message}</p>}</div>;
}