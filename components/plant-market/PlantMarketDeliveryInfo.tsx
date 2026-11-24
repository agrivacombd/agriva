"use client";
import {useState} from "react";
type Zone="dhaka"|"district"|"remote";
const ranges:Record<Zone,{label:string;range:string;description:string}>={dhaka:{label:"ঢাকা শহর",range:"১–৩ কর্মদিবস",description:"Dhaka metropolitan delivery"},district:{label:"জেলা শহর / অন্যান্য এলাকা",range:"৩–৫ কর্মদিবস",description:"Other district and city delivery"},remote:{label:"দূরবর্তী / উপজেলা এলাকা",range:"৪–৭ কর্মদিবস",description:"Remote and upazila delivery"}};
export default function PlantMarketDeliveryInfo({deliveryArea}:{deliveryArea:string|null}){
 const [zone,setZone]=useState<Zone>("dhaka");const estimate=ranges[zone];
 return <section className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4" aria-label="Delivery estimate">
  <div className="flex gap-3"><span className="text-xl" aria-hidden="true">🚚</span><div className="min-w-0 flex-1"><h2 className="font-extrabold text-slate-900">ডেলিভারি তথ্য ও আনুমানিক সময়</h2>
  {deliveryArea&&<p className="mt-1 text-sm text-slate-600">Seller-এর উল্লেখ করা delivery area: {deliveryArea}</p>}
  <label className="mt-3 block text-sm font-bold text-slate-700" htmlFor="plant-delivery-zone">আপনার এলাকা বেছে নিন</label>
  <select id="plant-delivery-zone" value={zone} onChange={e=>setZone(e.target.value as Zone)} className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
   {Object.entries(ranges).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}
  </select>
  <p className="mt-3 text-lg font-black text-sky-950">সম্ভাব্য সময়: {estimate.range}</p>
  <p className="mt-1 text-xs leading-5 text-slate-600">এটি সাধারণ ধারণা মাত্র—কুরিয়ার/সেলার নিশ্চিত করা ETA নয়। গাছের ধরন, আবহাওয়া, প্যাকিং ও ঠিকানার কারণে সময় পরিবর্তিত হতে পারে। ডেলিভারি চার্জ checkout-এর মোটে অন্তর্ভুক্ত নয়; সেলার অর্ডার নিশ্চিত করার সময় আলাদাভাবে জানাবেন।</p>
  </div></div>
 </section>;
}
