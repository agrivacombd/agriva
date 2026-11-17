"use client";
import { useState } from "react";
import ProductNameAutocomplete from "@/components/bulk-rfq/ProductNameAutocomplete";
import {CUSTOM_UNIT_VALUE,STANDARD_BULK_UNITS,isStandardBulkUnit} from "@/lib/bulk-rfq/units";
type Item={name:string;quantity:string;unit:string;specification:string;customUnit?:boolean};
export type OrderDraft={buyer_type:string;visibility:string;district:string;upazila:string;items:Item[]};
const blank=():Item=>({name:"",quantity:"",unit:"kg",specification:""});
const css="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-600";
export default function MultiOrderForm({initial,action,marketplaceNames=[]}:{initial:OrderDraft;action:(form:FormData)=>void|Promise<void>;marketplaceNames?:string[]}){
 const [items,setItems]=useState<Item[]>(()=>(initial.items?.length?initial.items:[blank()]).map(item=>({...item,customUnit:!isStandardBulkUnit(item.unit)})));
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
     <div className="text-sm font-semibold">
      <label htmlFor={`unit-select-${i}`}>একক</label>
      <select id={`unit-select-${i}`} className={css} value={it.customUnit?CUSTOM_UNIT_VALUE:it.unit}
        onChange={e=>setItems(prev=>prev.map((x,n)=>n===i?{
         ...x,unit:e.target.value===CUSTOM_UNIT_VALUE?"":e.target.value,
         customUnit:e.target.value===CUSTOM_UNIT_VALUE
        }:x))}>
       {STANDARD_BULK_UNITS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
       <option value={CUSTOM_UNIT_VALUE}>অন্যান্য — নিজের একক লিখুন</option>
      </select>
      {it.customUnit&&<label className="mt-2 block text-xs font-semibold text-emerald-900" htmlFor={`custom-unit-${i}`}>
       আপনার একক (আবশ্যক)
       <input id={`custom-unit-${i}`} required minLength={1} maxLength={30} value={it.unit}
        placeholder="যেমন: পাত্র, গুচ্ছ, কুইন্টাল"
        onChange={e=>update(i,"unit",e.target.value)}
        className={css}/>
      </label>}
     </div>
    </div>
    <label className="block text-sm font-semibold">জাত, মান ও বিশেষ শর্ত (ঐচ্ছিক)<textarea maxLength={2000} className={css} rows={2} value={it.specification} onChange={e=>update(i,"specification",e.target.value)}/></label>
   </fieldset>)}
  <input type="hidden" name="items_json" value={JSON.stringify(items.map(({name,quantity,unit,specification})=>({name,quantity,unit,specification})))}/>
  <section aria-labelledby="delivery-heading" className="space-y-3 border-t border-emerald-100 pt-6">
   <h3 id="delivery-heading" className="text-lg font-bold">ডেলিভারি এলাকা (ঐচ্ছিক)</h3>
   <p className="text-sm font-normal text-slate-600">সব পণ্য যোগ করার পর এখানে একবারই ডেলিভারির এলাকা লিখুন। পরে নির্ধারণ করলেও চলবে।</p>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-semibold">জেলা (ঐচ্ছিক)<input maxLength={80} className={css} name="district" placeholder="যেমন: ঢাকা" defaultValue={initial.district}/></label>
    <label className="text-sm font-semibold">উপজেলা (ঐচ্ছিক)<input maxLength={80} className={css} name="upazila" placeholder="যেমন: সাভার" defaultValue={initial.upazila}/></label>
   </div>
  </section>
  <fieldset className="space-y-2"><legend className="font-bold">প্রকাশের ধরন</legend>
   <label className="flex items-start gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="visibility" value="public" defaultChecked={initial.visibility!=="private"} className="mt-1"/><span><strong>Public:</strong> Admin অনুমোদনের পরে পণ্যের চাহিদা প্রকাশ হবে, ব্যক্তিগত তথ্য নয়।</span></label>
   <label className="flex items-start gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="visibility" value="private" defaultChecked={initial.visibility==="private"} className="mt-1"/><span><strong>Private:</strong> শুধুমাত্র Admin ও আমন্ত্রিত পাইকার দেখবেন।</span></label>
  </fieldset>
  <p className="text-xs text-slate-600">পাইকাররা প্রতিটি পণ্যে আলাদা অফার দেবেন। আপনি পণ্যভেদে ভিন্ন পাইকার বেছে নিতে পারবেন। অর্ডার জমা মানেই পেমেন্ট নয়।</p>
  <button className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">সব পণ্যের জন্য কোটেশন চান</button>
 </form>;
}
