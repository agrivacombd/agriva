"use client";
import { useState } from "react";
import ProductNameAutocomplete from "@/components/bulk-rfq/ProductNameAutocomplete";
type Item={name:string;quantity:string;unit:string;specification:string};
export type OrderDraft={buyer_type:string;visibility:string;district:string;upazila:string;items:Item[]};
const blank=():Item=>({name:"",quantity:"",unit:"kg",specification:""});
const css="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-600";
export default function MultiOrderForm({initial,action,marketplaceNames=[]}:{initial:OrderDraft;action:(form:FormData)=>void|Promise<void>;marketplaceNames?:string[]}){
 const [items,setItems]=useState<Item[]>(initial.items?.length?initial.items:[blank()]);
 const update=(i:number,k:keyof Item,v:string)=>setItems(prev=>prev.map((x,n)=>n===i?{...x,[k]:v}:x));
 return <form action={action} className="space-y-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
  <label className="block text-sm font-semibold">ক্রেতার ধরন
   <select className={css} name="buyer_type" defaultValue={initial.buyer_type}><option value="business">ব্যবসা / B2B</option><option value="individual">ব্যক্তিগত / B2C</option></select>
  </label>
  <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">পণ্যের তালিকা ({items.length}/২০)</h3>
   <button type="button" disabled={items.length>=20} onClick={()=>setItems(x=>[...x,blank()])} className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-900 disabled:opacity-40">+ আরেকটি পণ্য</button>
  </div>
  {items.map((it,i)=><fieldset key={i} className="space-y-3 rounded-xl border border-slate-200 p-4">
    <legend className="px-2 font-semibold">পণ্য {i+1}</legend>
    <div className="flex justify-end">{items.length>1&&<button type="button" onClick={()=>setItems(x=>x.filter((_,n)=>n!==i))} className="text-sm font-bold text-red-700">পণ্যটি সরান</button>}</div>
    <div className="block text-sm font-semibold"><span>পণ্যের নাম</span>
     <ProductNameAutocomplete value={it.name} onChange={name=>update(i,"name",name)} marketplaceNames={marketplaceNames}/>
    </div>
    <div className="grid grid-cols-2 gap-3">
     <label className="text-sm font-semibold">পরিমাণ<input required type="number" min="0.001" max="1000000" step="0.001" className={css} value={it.quantity} onChange={e=>update(i,"quantity",e.target.value)}/></label>
     <label className="text-sm font-semibold">একক<select className={css} value={it.unit} onChange={e=>update(i,"unit",e.target.value)}>{[["kg","কেজি"],["ton","টন"],["maund","মণ"],["bag","বস্তা"],["packet","প্যাকেট"]].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
    </div>
    <label className="block text-sm font-semibold">জাত, মান ও বিশেষ শর্ত (ঐচ্ছিক)<textarea maxLength={2000} className={css} rows={2} value={it.specification} onChange={e=>update(i,"specification",e.target.value)}/></label>
   </fieldset>)}
  <input type="hidden" name="items_json" value={JSON.stringify(items)}/>
  <div className="grid grid-cols-2 gap-3">
   <label className="text-sm font-semibold">ডেলিভারির জেলা<input required maxLength={80} className={css} name="district" defaultValue={initial.district}/></label>
   <label className="text-sm font-semibold">উপজেলা (ঐচ্ছিক)<input maxLength={80} className={css} name="upazila" defaultValue={initial.upazila}/></label>
  </div>
  <fieldset className="space-y-2"><legend className="font-bold">প্রকাশের ধরন</legend>
   <label className="flex items-start gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="visibility" value="public" defaultChecked={initial.visibility!=="private"} className="mt-1"/><span><strong>Public:</strong> Admin অনুমোদনের পরে পণ্যের চাহিদা প্রকাশ হবে, ব্যক্তিগত তথ্য নয়।</span></label>
   <label className="flex items-start gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="visibility" value="private" defaultChecked={initial.visibility==="private"} className="mt-1"/><span><strong>Private:</strong> শুধুমাত্র Admin ও আমন্ত্রিত পাইকার দেখবেন।</span></label>
  </fieldset>
  <p className="text-xs text-slate-600">পাইকাররা প্রতিটি পণ্যে আলাদা অফার দেবেন। আপনি পণ্যভেদে ভিন্ন পাইকার বেছে নিতে পারবেন। অর্ডার জমা মানেই পেমেন্ট নয়।</p>
  <button className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">সব পণ্যের জন্য কোটেশন চান</button>
 </form>;
}
