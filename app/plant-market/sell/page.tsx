"use client";
import Link from "next/link";
import {useState} from "react";
import type {FormEvent} from "react";
import {ArrowLeft,LoaderCircle,PlusCircle} from "lucide-react";
export default function PlantMarketSellPage(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setMessage("");setError(false);
  const payload={name:data.get("name"),categorySlug:data.get("categorySlug"),price:data.get("price"),stock:data.get("stock"),unit:data.get("unit"),description:data.get("description")};
  try{const response=await fetch("/api/plant-market/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||"পণ্য জমা হয়নি");form.reset();setMessage("পণ্যটি review queue-তে জমা হয়েছে। Admin অনুমোদনের আগে এটি প্রকাশিত হবে না।");}
  catch(e){setError(true);setMessage(e instanceof Error?e.message:"পণ্য জমা হয়নি");}finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-[#f5f8f2] px-4 py-10 text-[#173b2d]"><div className="mx-auto max-w-2xl">
  <Link href="/plant-market" className="inline-flex items-center gap-2 text-sm font-bold text-[#126b4f]"><ArrowLeft size={16}/> Plant Market</Link>
  <section className="mt-5 rounded-3xl border border-[#e1e9df] bg-white p-6 shadow-sm sm:p-9"><p className="text-xs font-bold uppercase tracking-widest text-[#a67f25]">Verified gardener seller</p><h1 className="mt-2 text-3xl font-black">Plant Market-এ পণ্য যোগ করুন</h1><p className="mt-3 text-sm leading-6 text-[#637568]">শুধু অনুমোদিত gardener account গাছ, চারা ও বাগানের উপকরণ জমা দিতে পারবেন। প্রতিটি পণ্য Admin review-এর পর প্রকাশিত হবে।</p>
   <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-bold">ক্যাটাগরি<select name="categorySlug" required className="mt-2 w-full rounded-xl border p-3"><option value="indoor-plants">Indoor plants</option><option value="outdoor-plants">Outdoor / ornamental plants</option><option value="seedlings">চারা ও seedlings</option><option value="seeds">বীজ</option><option value="pots">টব ও planter</option><option value="soil-compost">মাটি ও compost</option><option value="gardening-tools">বাগানের সরঞ্জাম</option><option value="fertilizer">জৈব সার ও plant food</option></select></label><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0.01" step="0.01" required className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm font-bold">মজুত<input name="stock" type="number" min="0" step="1" required className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm font-bold">একক<select name="unit" className="mt-2 w-full rounded-xl border p-3"><option value="piece">piece</option><option value="pack">pack</option><option value="kg">kg</option><option value="g">g</option><option value="bag">bag</option><option value="liter">liter</option></select></label></div><label className="block text-sm font-bold">বিবরণ<textarea name="description" maxLength={3000} rows={4} className="mt-2 w-full rounded-xl border p-3"/></label><button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-3 font-bold text-white disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={18}/>:<PlusCircle size={18}/>} Review-এর জন্য জমা দিন</button></form>
   {message&&<p role="status" className={"mt-4 rounded-xl p-3 text-sm "+(error?"bg-red-50 text-red-700":"bg-emerald-50 text-emerald-800")}>{message}</p>}
  </section>
 </div></main>;
}
