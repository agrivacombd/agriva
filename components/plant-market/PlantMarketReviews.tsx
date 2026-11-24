"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";

type Review={id:string;rating:number;title:string;body:string;photo_urls:string[];verified_purchase:boolean;created_at:string};
type Distribution={1:number;2:number;3:number;4:number;5:number};
type Filter="all"|"photos"|"1"|"2"|"3"|"4"|"5";
export default function PlantMarketReviews({productId}:{productId:string}){
 const [reviews,setReviews]=useState<Review[]>([]),[count,setCount]=useState(0),[average,setAverage]=useState(0),[distribution,setDistribution]=useState<Distribution>({1:0,2:0,3:0,4:0,5:0});
 const [rating,setRating]=useState(5),[title,setTitle]=useState(""),[body,setBody]=useState(""),[photos,setPhotos]=useState<File[]>([]);
 const [loading,setLoading]=useState(true),[submitting,setSubmitting]=useState(false),[message,setMessage]=useState(""),[filter,setFilter]=useState<Filter>("all");
 async function refresh(){
  setLoading(true);
  try{const res=await fetch("/api/plant-market/reviews?productId="+encodeURIComponent(productId),{cache:"no-store"});const data=await res.json();if(!res.ok)throw new Error(data.error||"Review load failed");setReviews(data.reviews||[]);setCount(data.reviewCount||0);setAverage(data.averageRating||0);setDistribution(data.ratingDistribution||{1:0,2:0,3:0,4:0,5:0});}
  catch(e){setMessage(e instanceof Error?e.message:"Review লোড করা যায়নি।");}finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[productId]);
 const filtered=useMemo(()=>reviews.filter(review=>filter==="all"||(filter==="photos"?review.photo_urls?.length>0:String(review.rating)===filter)),[reviews,filter]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setSubmitting(true);setMessage("");
  const form=new FormData();form.set("productId",productId);form.set("rating",String(rating));form.set("title",title.trim());form.set("body",body.trim());photos.forEach(file=>form.append("photos",file));
  try{const res=await fetch("/api/plant-market/reviews",{method:"POST",body:form});const data=await res.json();if(!res.ok)throw new Error(data.error||"Review জমা হয়নি।");setMessage(data.message||"Review জমা হয়েছে।");setTitle("");setBody("");setPhotos([]);setRating(5);await refresh();}
  catch(e){setMessage(e instanceof Error?e.message:"Review জমা হয়নি।");}finally{setSubmitting(false);}
 }
 return <section id="customer-reviews" className="mt-7 scroll-mt-24 rounded-3xl border border-emerald-950/10 bg-white p-5 sm:p-7">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><p className="text-sm font-bold text-emerald-700">ক্রেতাদের অভিজ্ঞতা</p><h2 className="mt-1 text-2xl font-black text-emerald-950">Customer Reviews</h2></div>
   <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-center"><div className="text-xl font-black text-emerald-900">★ {average.toFixed(1)} / 5</div><div className="text-xs text-emerald-800">{count.toLocaleString("bn-BD")}টি প্রকাশিত review</div></div>
  </div>
  {count>0&&<div className="mt-5 grid gap-4 sm:grid-cols-[150px_1fr]">
   <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f7faf5] p-4"><p className="text-4xl font-black text-emerald-950">{average.toFixed(1)}</p><p className="mt-1 text-amber-500" aria-label={average+" out of 5 stars"}>{"★".repeat(Math.round(average))}{"☆".repeat(5-Math.round(average))}</p><p className="mt-1 text-xs text-slate-600">মোট {count}টি rating</p></div>
   <div className="space-y-1.5">{([5,4,3,2,1] as const).map(star=>{const n=distribution[star]||0;return <button type="button" key={star} onClick={()=>setFilter(String(star) as Filter)} className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-xs hover:bg-emerald-50" aria-label={star+" star review filter"}><span className="w-8 text-right text-slate-600">{star} ★</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-amber-400" style={{width:(count?100*n/count:0)+"%"}}/></span><span className="w-7 text-right tabular-nums text-slate-500">{n}</span></button>})}</div>
  </div>}
  <div className="mt-5 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
   <form onSubmit={submit} className="rounded-2xl border border-emerald-100 bg-[#f7faf5] p-4">
    <h3 className="font-extrabold text-emerald-950">আপনার অভিজ্ঞতা লিখুন</h3>
    <p className="mt-1 text-xs leading-5 text-slate-600">Review যাচাই করে প্রকাশ করা হবে। প্রতি পণ্যে একবার review জমা দিতে পারবেন। Verified purchase চিহ্ন অর্ডার যাচাই চালু হলে দেওয়া হবে।</p>
    <label className="mt-4 block text-sm font-bold">রেটিং</label>
    <div className="mt-1 flex gap-1" role="group" aria-label="রেটিং নির্বাচন">
     {[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>setRating(n)} aria-label={n+" star"} aria-pressed={rating===n} className={"rounded p-1 text-2xl "+(n<=rating?"text-amber-500":"text-slate-300")}>★</button>)}
    </div>
    <label className="mt-3 block text-sm font-bold" htmlFor="pm-review-title">শিরোনাম</label>
    <input id="pm-review-title" value={title} onChange={e=>setTitle(e.target.value)} minLength={3} maxLength={120} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"/>
    <label className="mt-3 block text-sm font-bold" htmlFor="pm-review-body">আপনার অভিজ্ঞতা</label>
    <textarea id="pm-review-body" value={body} onChange={e=>setBody(e.target.value)} minLength={10} maxLength={2000} required rows={4} className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"/>
    <label className="mt-3 block text-sm font-bold" htmlFor="pm-review-photos">ছবি (সর্বোচ্চ ৩টি, প্রতি ছবি ৪ MB)</label>
    <input id="pm-review-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{const selected=Array.from(e.target.files||[]);if(selected.length>3||selected.some(f=>f.size>4*1024*1024)){setMessage("৩টির বেশি অথবা ৪ MB-এর বড় ছবি দেওয়া যাবে না।");e.target.value="";setPhotos([]);return;}setPhotos(selected);}} className="mt-1 w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-bold file:text-emerald-900"/>
    {photos.length>0&&<p className="mt-1 text-xs text-slate-500">{photos.length}টি ছবি নির্বাচিত</p>}
    <button disabled={submitting} className="mt-4 w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60">{submitting?"জমা হচ্ছে…":"Review জমা দিন"}</button>
    {message&&<p role="status" className="mt-3 text-sm leading-6 text-emerald-900">{message}</p>}
   </form>
   <div>
    <div className="mb-3 flex flex-wrap gap-2" aria-label="Review filter">{([{key:"all",label:"সব review"},{key:"photos",label:"ছবি আছে"},{key:"5",label:"5★"},{key:"4",label:"4★"},{key:"3",label:"3★"},{key:"2",label:"2★"},{key:"1",label:"1★"}] as {key:Filter;label:string}[]).map(option=><button type="button" key={option.key} onClick={()=>setFilter(option.key)} aria-pressed={filter===option.key} className={"rounded-full border px-3 py-1.5 text-xs font-bold "+(filter===option.key?"border-emerald-900 bg-emerald-900 text-white":"border-slate-200 bg-white text-slate-700")}>{option.label}</button>)}</div>
    {loading?<p className="text-sm text-slate-500">Review লোড হচ্ছে…</p>:filtered.length===0?<div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">{reviews.length===0?"এখনও প্রকাশিত review নেই। আপনার অভিজ্ঞতা প্রথমে শেয়ার করুন।":"এই filter-এ review পাওয়া যায়নি।"}</div>:<div className="space-y-4">{filtered.map(review=><article key={review.id} className="rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3"><div><div className="text-amber-500" aria-label={review.rating+" out of 5 stars"}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div><h3 className="mt-1 font-extrabold text-slate-900">{review.title}</h3></div><time className="text-xs text-slate-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString("bn-BD")}</time></div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.body}</p>
      {review.verified_purchase&&<span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">Verified purchase</span>}
      {review.photo_urls?.length>0&&<div className="mt-3 flex flex-wrap gap-2">{review.photo_urls.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Review photo open in new tab"><img src={url} alt={review.title+" — customer photo "+(i+1)} loading="lazy" className="h-24 w-24 rounded-xl object-cover"/></a>)}</div>}
     </article>)}</div>}
   </div>
  </div>
 </section>;
}
