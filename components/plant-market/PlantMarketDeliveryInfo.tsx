"use client";
import {useState} from "react";
type Zone="dhaka"|"district"|"remote";
const ranges:Record<Zone,{label:string;range:string;description:string}>={dhaka:{label:"ঢাকা মহানগর",range:"১–৩ কর্মদিবস",description:"Dhaka metropolitan delivery"},district:{label:"জেলা শহর / অন্যান্য এলাকা",range:"৩–৫ কর্মদিবস",description:"Other district and city delivery"},remote:{label:"দূরবর্তী / উপজেলা এলাকা",range:"৪–৭ কর্মদিবস",description:"Remote and upazila delivery"}};
export default function PlantMarketDeliveryInfo({deliveryArea}:{deliveryArea:string|null}){
 const [zone,setZone]=useState<Zone|null>(null);const estimate=zone?ranges[zone]:null;
 return <section className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4" aria-label="Delivery estimate">
  <div className="flex gap-3"><span className="text-xl" aria-hidden="true">🚚</span><div className="min-w-0 flex-1"><h2 className="font-extrabold text-slate-900">ডেলিভারি তথ্য ও আনুমানিক সময়</h2>
  {deliveryArea&&<p className="mt-1 text-sm text-slate-600">Seller-এর উল্লেখ করা delivery area: {deliveryArea}</p>}
  <label className="mt-3 block text-sm font-bold text-slate-700" htmlFor="plant-delivery-zone">আপনার এলাকার ধরন বেছে নিন</label>
  <select id="plant-delivery-zone" value={zone||""} onChange={e=>setZone((e.target.value||null) as Zone|null)} className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
   <option value="">এলাকা নির্বাচন করুন</option>
   {Object.entries(ranges).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}
  </select>
  {estimate&&<p className="mt-3 text-lg font-black text-sky-950">সম্ভাব্য সময়: {estimate.range}</p>}
  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-extrabold text-amber-950">ডেলিভারি চার্জ এখনই হিসাব করা যাচ্ছে না</p><p className="mt-1 text-xs leading-5 text-amber-900">আপনার সঠিক ঠিকানা, গাছের প্যাকিং/আকার ও সেলার-কুরিয়ার অনুযায়ী চার্জ নির্ধারিত হবে। Checkout-এর মোটে delivery fee যোগ হয়নি—অর্ডার নিশ্চিত করার আগে সেলার থেকে fee জেনে নিন।</p></div>
  <p className="mt-2 text-xs leading-5 text-slate-600">সময়টি সাধারণ ধারণা, নিশ্চিত courier ETA নয়। আবহাওয়া, প্যাকিং, গাছের ধরন ও ঠিকানার কারণে পরিবর্তন হতে পারে।</p>
  </div></div>
 </section>;
}
