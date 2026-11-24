"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
type Item={id:string;name:string;slug:string;price:number|string;stock:number;unit:string|null;image_url:string|null};
export default function PlantMarketComboOffer({current,related}:{current:Item;related:Item[]}){
 const options=related.filter(p=>Number(p.stock)>0&&p.id!==current.id);
 const [selected,setSelected]=useState<string[]>(options.slice(0,2).map(p=>p.id));
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[login,setLogin]=useState(false);
 const router=useRouter();
 const bundle=[current,...options.filter(p=>selected.includes(p.id))];
 const total=useMemo(()=>bundle.reduce((sum,p)=>sum+Number(p.price||0),0),[bundle]);
 async function add(){
  if(busy)return;setBusy(true);setMessage("");setLogin(false);let added=0;
  try{
   for(const item of bundle){
    const response=await fetch("/api/plant-market/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:item.id,quantity:1})});
    const data=await response.json().catch(()=>({}));
    if(response.status===401){setLogin(true);throw new Error("কার্টে যোগ করতে লগইন করুন।");}
    if(!response.ok)throw new Error(data.error||item.name+" কার্টে যোগ হয়নি।");
    added++;
   }
   setMessage(bundle.length+"টি পণ্য কার্টে যোগ হয়েছে।");router.refresh();
  }catch(e){setMessage(added>0?added+"টি পণ্য যোগ হয়েছে; বাকি পণ্য যোগ হয়নি। "+(e instanceof Error?e.message:"আবার চেষ্টা করুন।"):(e instanceof Error?e.message:"কার্টে যোগ করা যায়নি।"));}
  finally{setBusy(false);}
 }
 if(options.length===0||Number(current.stock)<1)return null;
 return <section className="mt-7 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-7" aria-label="Plant combo suggestions">
  <div><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Plant Market Combo</p><h2 className="mt-1 text-xl font-black text-emerald-950">একসাথে বেছে নিন আপনার গাছের সেট</h2><p className="mt-1 text-sm text-slate-600">এই পণ্যের সঙ্গে আরও কিছু একই ক্যাটাগরির পণ্য যোগ করুন। এখনো combo discount নেই—নিয়মিত মূল্যই যোগ হবে।</p></div>
  <div className="mt-4 space-y-2">{options.map(item=><label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-3">
   <input type="checkbox" checked={selected.includes(item.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,item.id]:old.filter(id=>id!==item.id))} className="h-4 w-4 accent-emerald-800"/>
   <div className="h-14 w-14 shrink-0 rounded-xl bg-emerald-50">{item.image_url?<img src={item.image_url} alt={item.name} className="h-full w-full rounded-xl object-contain"/>:<span className="grid h-full place-items-center text-2xl">🪴</span>}</div>
   <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">স্টকে আছে</p></div>
   <span className="whitespace-nowrap text-sm font-black text-emerald-900">৳{Number(item.price).toLocaleString("bn-BD")}</span>
  </label>)}</div>
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-900 p-4 text-white"><div><p className="text-xs text-emerald-100">Combo-তে {bundle.length}টি পণ্য</p><p className="text-xl font-black">৳{total.toLocaleString("bn-BD")}</p></div><button onClick={()=>void add()} disabled={busy} className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-emerald-950 disabled:opacity-60">{busy?"কার্টে যোগ হচ্ছে…":"সবগুলো কার্টে যোগ করুন"}</button></div>
  {message&&<p role="status" className="mt-3 text-sm font-semibold text-emerald-900">{message}{login&&<Link href={"/login?next="+encodeURIComponent("/plant-market/"+current.slug)} className="ml-2 underline">লগইন করুন</Link>}</p>}
 </section>;
}
