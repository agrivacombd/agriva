"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { productDescriptionToText } from "@/lib/marketplace/product-description";
import AdminProductDescriptionEditor from "@/components/admin/AdminProductDescriptionEditor";

type Product = {
  id:string;seller_id:string;name:string;slug:string;scientific_name:string|null;category:string;category_slug:string;
  description:string|null;price:number|string;stock:number;unit:string;image_url:string|null;status:string;
  created_at:string;updated_at:string;plant_size:string|null;pot_size:string|null;plant_age:string|null;
  sunlight:string|null;watering:string|null;flowering_season:string|null;delivery_area:string|null;
  seo_title:string|null;seo_description:string|null;focus_keyword:string|null;image_alt:string|null;
  usage_instructions:string|null;moderation_note:string|null;
};
const STATUSES = [
  ["all","সব পণ্য"],["draft","Draft / Review"],["active","Published"],["paused","Paused"],
  ["rejected","Rejected"],["suspended","Suspended"]
] as const;
const EDIT_FIELDS = [
  ["name","পণ্যের নাম"],["scientific_name","বৈজ্ঞানিক নাম"],["plant_size","গাছের উচ্চতা"],
  ["pot_size","টবের আকার"],["plant_age","গাছের বয়স"],["sunlight","সূর্যালোক"],
  ["watering","পানি দেওয়ার নিয়ম"],["flowering_season","ফুলের মৌসুম"],
  ["delivery_area","সরবরাহ এলাকা"],["seo_title","SEO Title"],["seo_description","SEO Meta Description"],
  ["focus_keyword","Focus Keyword"],["image_alt","ছবির Alt Text"]
] as const;
export default function PlantMarketProductReview() {
  const [items,setItems]=useState<Product[]>([]);
  const [status,setStatus]=useState("all"),[query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState("");
  const [page,setPage]=useState(1),[total,setTotal]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[message,setMessage]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);
    try {
      const params=new URLSearchParams({status,q:appliedQuery,page:String(page)});
      const response=await fetch("/api/admin/plant-market-products?"+params,{cache:"no-store"});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"পণ্য তালিকা লোড করা যায়নি।");
      setItems(result.products||[]);setTotal(result.total||0);
    }catch(error){setMessage(error instanceof Error?error.message:"সংযোগ সমস্যা হয়েছে।");}
    finally{setLoading(false);}
  },[page,status,appliedQuery]);
  useEffect(()=>{void load();},[load]);
  async function moderate(product:Product,next:string) {
    const note=(notes[product.id]??product.moderation_note??"").trim();
    if(["rejected","suspended"].includes(next)&&!note){setMessage("Reject বা Suspend করার কারণ লিখুন।");return;}
    if(!window.confirm(`"${product.name}" এর status ${next} করবেন?`))return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/plant-market-products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:product.id,action:"moderate",status:next,moderation_note:note})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"Status update failed");
      setMessage("পণ্যের status আপডেট হয়েছে।");await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Status update failed");}
    finally{setBusy(false);}
  }
  async function save(event:FormEvent<HTMLFormElement>,product:Product) {
    event.preventDefault();setBusy(true);setMessage("");
    const data=new FormData(event.currentTarget);
    const body:Record<string,string|number>={id:product.id,action:"edit"};
    for(const [key] of EDIT_FIELDS)body[key]=String(data.get(key)??"");
    for(const key of ["price","stock"])body[key]=Number(data.get(key));
    body.description=String(data.get("description")??"");
    body.usage_instructions=String(data.get("usage_instructions")??"");
    try{
      const response=await fetch("/api/admin/plant-market-products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"Edit failed");
      setMessage("পণ্যের তথ্য সফলভাবে আপডেট হয়েছে।");setSelected(null);await load();
    }catch(error){setMessage(error instanceof Error?error.message:"পণ্য সংরক্ষণ করা যায়নি।");}
    finally{setBusy(false);}
  }
  return <section className="mt-6 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      ["সব মিলিয়ে",total],["এই পেজে",items.length],["পেজ",page],["প্রতি পেজ",20]
    ].map(([title,value])=><div key={title} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{title}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div>
    <form onSubmit={e=>{e.preventDefault();setPage(1);setAppliedQuery(query.trim());}} className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row">
      <input aria-label="পণ্যের নাম বা slug খুঁজুন" value={query} onChange={e=>setQuery(e.target.value)} placeholder="নাম বা Slug দিয়ে খুঁজুন" className="min-h-11 flex-1 rounded-xl border px-3"/>
      <select aria-label="পণ্যের status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);setSelected(null);}} className="min-h-11 rounded-xl border bg-white px-3">{STATUSES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <button type="submit" className="min-h-11 rounded-xl bg-emerald-900 px-5 font-bold text-white">Search / Filter</button>
      <button type="button" onClick={()=>{setQuery("");setAppliedQuery("");setStatus("all");setPage(1);setSelected(null);}} className="rounded-xl border px-4 font-bold">Reset</button>
    </form>
    {message&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
    {loading?<p className="rounded-xl bg-white p-6">পণ্য লোড হচ্ছে…</p>:items.length===0?<p className="rounded-xl border bg-white p-8 text-center">এই Filter-এ কোনো Plant Market পণ্য নেই।</p>:<div className="space-y-4">{items.map(product=><article key={product.id} className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-emerald-50">{product.image_url?<img src={product.image_url} alt={product.name} className="h-full w-full object-contain"/>:<div className="grid h-full place-items-center text-4xl">🪴</div>}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-black">{product.name}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">{product.status}</span></div>
          <p className="mt-1 text-xs text-slate-500">{product.category} · {product.scientific_name||"—"}</p>
          <p className="mt-1 font-black text-emerald-900">৳{Number(product.price).toLocaleString("bn-BD")} · স্টক {product.stock} {product.unit}</p>
          <p className="mt-1 text-xs text-slate-500">Seller: {product.seller_id.slice(0,8)} · Updated: {new Date(product.updated_at).toLocaleDateString("bn-BD")}</p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{productDescriptionToText(product.description||"")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={()=>setSelected(selected===product.id?null:product.id)} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-900">{selected===product.id?"Close Editor":"Edit Product"}</button>
            {product.status==="active"&&<Link href={"/plant-market/"+encodeURIComponent(product.slug)} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-2 text-xs font-bold">View Product</Link>}
          </div>
        </div>
      </div>
      {selected===product.id&&<div className="mt-5 border-t pt-5">
        <form onSubmit={e=>void save(e,product)} className="space-y-4">
          <p className="text-sm font-bold text-amber-800">Slug ও Seller পরিবর্তন এখানে বন্ধ রাখা হয়েছে, যাতে পুরোনো URL বা অর্ডার ক্ষতিগ্রস্ত না হয়।</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {EDIT_FIELDS.map(([key,label])=><label key={key} className="text-xs font-bold">{label}<input name={key} defaultValue={product[key]??""} required={key==="name"} maxLength={key==="seo_title"?70:key==="seo_description"?200:300} className="mt-1 block min-h-11 w-full rounded-xl border px-3 text-sm font-normal"/></label>)}
            <label className="text-xs font-bold">মূল্য (৳)<input name="price" type="number" min="0.01" step="0.01" required defaultValue={product.price} className="mt-1 block min-h-11 w-full rounded-xl border px-3"/></label>
            <label className="text-xs font-bold">স্টক<input name="stock" type="number" min="0" step="1" required defaultValue={product.stock} className="mt-1 block min-h-11 w-full rounded-xl border px-3"/></label>
          </div>
          <AdminProductDescriptionEditor key={product.id} value={product.description||""} productName={product.name} variant="plant" focusKeyword={product.focus_keyword||""} previewPath={"/plant-market/"+encodeURIComponent(product.slug)} maxHtmlLength={5000}/>
          <label className="block text-xs font-bold">পরিচর্যার নির্দেশনা<textarea name="usage_instructions" rows={4} maxLength={2000} defaultValue={product.usage_instructions||""} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
          <button disabled={busy} className="rounded-xl bg-emerald-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Save Changes</button>
        </form>
      </div>}
      <div className="mt-4 flex flex-col gap-3 border-t pt-4">
        <label className="text-xs font-bold">Moderation Note (Reject/Suspend করতে প্রয়োজন)<textarea maxLength={1000} rows={2} value={notes[product.id]??product.moderation_note??""} onChange={e=>setNotes(prev=>({...prev,[product.id]:e.target.value}))} className="mt-1 block w-full rounded-xl border p-3 font-normal"/></label>
        <div className="flex flex-wrap gap-2">
          {product.status!=="active"&&<button type="button" disabled={busy} onClick={()=>void moderate(product,"active")} className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Approve / Publish</button>}
          {product.status!=="paused"&&<button type="button" disabled={busy} onClick={()=>void moderate(product,"paused")} className="rounded-lg border px-4 py-2 text-xs font-bold disabled:opacity-50">Pause</button>}
          {product.status!=="suspended"&&<button type="button" disabled={busy} onClick={()=>void moderate(product,"suspended")} className="rounded-lg border border-amber-300 px-4 py-2 text-xs font-bold text-amber-800 disabled:opacity-50">Suspend</button>}
          {product.status!=="rejected"&&<button type="button" disabled={busy} onClick={()=>void moderate(product,"rejected")} className="rounded-lg border border-red-300 px-4 py-2 text-xs font-bold text-red-800 disabled:opacity-50">Reject</button>}
          {product.status!=="draft"&&<button type="button" disabled={busy} onClick={()=>void moderate(product,"draft")} className="rounded-lg border px-4 py-2 text-xs font-bold disabled:opacity-50">Return to Review</button>}
        </div>
      </div>
    </article>)}</div>}
    <nav aria-label="পণ্যের পেজ" className="flex items-center justify-between gap-3">
      <button disabled={page===1||loading} onClick={()=>{setPage(v=>v-1);setSelected(null);}} className="rounded-xl border px-5 py-2 text-sm font-bold disabled:opacity-40">← Previous</button>
      <span className="text-sm text-slate-600">Page {page} / {Math.max(1,Math.ceil(total/20))} · Total {total}</span>
      <button disabled={page*20>=total||loading} onClick={()=>{setPage(v=>v+1);setSelected(null);}} className="rounded-xl border px-5 py-2 text-sm font-bold disabled:opacity-40">Next →</button>
    </nav>
  </section>;
}
