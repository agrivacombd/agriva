"use client";
import { useEffect, useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import ProductSeoEditor from "@/components/seller/ProductSeoEditor";

const INITIAL_FORM = { name:"",price:"",stock:"",unit:"kg",description:"",category_slug:"premium-food-grains",subcategory_slug:"edible-seeds",seo_title:"",seo_description:"",focus_keyword:"",related_keywords:"",brand:"",origin:"",highlights:"",usage_instructions:"",image_alt:"" };
const MAX_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = ["image/jpeg","image/png","image/webp"];
const UNIT_OPTIONS=[{value:"kg",label:"কেজি (kg)"},{value:"g",label:"গ্রাম (g)"},{value:"piece",label:"পিস (piece)"},{value:"pack",label:"প্যাকেট (pack)"},{value:"liter",label:"লিটার (liter)"},{value:"bag",label:"বস্তা (bag)"}];
export default function ProductForm(){
 const [form,setForm]=useState(INITIAL_FORM),[images,setImages]=useState<File[]>([]),[previews,setPreviews]=useState<string[]>([]),[message,setMessage]=useState(""),[loading,setLoading]=useState(false);
 const selectedCategory=MARKETPLACE_CATEGORIES.find(category=>category.slug===form.category_slug);
 const set=(key:keyof typeof INITIAL_FORM,value:string)=>setForm(current=>({...current,[key]:value}));
 useEffect(()=>{const urls=images.map(file=>URL.createObjectURL(file));setPreviews(urls);return()=>urls.forEach(url=>URL.revokeObjectURL(url));},[images]);
 function chooseImages(files:FileList|null){setMessage("");const selected=Array.from(files??[]);if(selected.length>MAX_IMAGES){setImages([]);setMessage("সর্বোচ্চ ৪টি ছবি নির্বাচন করুন।");return;}const invalid=selected.find(file=>!ALLOWED_IMAGE_TYPES.includes(file.type));if(invalid){setImages([]);setMessage("শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।");return;}setImages(selected);}
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setMessage("");const supabase=createSupabaseBrowserClient();const uploadedPaths:string[]=[];
  try{const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error("ছবি আপলোড করতে আবার লগইন করুন।");const imageUrls:string[]=[];
   for(const image of images){const extension=image.type==="image/png"?"png":image.type==="image/webp"?"webp":"jpg";const path=`${user.id}/${crypto.randomUUID()}.${extension}`;const {error:uploadError}=await supabase.storage.from("product-images").upload(path,image,{contentType:image.type,cacheControl:"3600",upsert:false});if(uploadError){console.error("Product image upload failed",uploadError.message);throw new Error("ছবি আপলোড করা যায়নি। Storage-এর সর্বোচ্চ ফাইল সাইজ ও seller policy যাচাই করুন।");}uploadedPaths.push(path);imageUrls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);}
   const res=await fetch("/api/seller/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,image_url:imageUrls[0]??null,image_urls:imageUrls})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"পণ্য জমা দেওয়া যায়নি।");
   uploadedPaths.length=0;setMessage("পণ্যটি অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের আগে এটি মার্কেটপ্লেসে দেখাবে না।");setForm(INITIAL_FORM);setImages([]);
  }catch(error){if(uploadedPaths.length){const {error:cleanupError}=await supabase.storage.from("product-images").remove(uploadedPaths);if(cleanupError)console.warn("Could not clean up rejected product images",cleanupError.message);}setMessage(error instanceof Error?error.message:"নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");}finally{setLoading(false);}
 }
 return <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm">
  <div><label className="text-sm font-bold">পণ্যের নাম<input required maxLength={160} value={form.name} onChange={e=>set("name",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="যেমন: Premium Basmati Rice / Chia Seed 250g"/></label></div>
  <div className="grid gap-5 md:grid-cols-2">
   <label className="text-sm font-bold">ক্যাটাগরি<select required value={form.category_slug} onChange={e=>{const next=MARKETPLACE_CATEGORIES.find(c=>c.slug===e.target.value);setForm(current=>({...current,category_slug:e.target.value,subcategory_slug:next?.subcategories[0]?.slug||""}));}} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">{MARKETPLACE_CATEGORIES.map(category=><option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
   <label className="text-sm font-bold">সাব-ক্যাটাগরি<select required value={form.subcategory_slug} onChange={e=>set("subcategory_slug",e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">{(selectedCategory?.subcategories??[]).map(sub=><option key={sub.slug} value={sub.slug}>{sub.name}</option>)}</select></label>
  </div>
  <div className="grid gap-5 md:grid-cols-3">
   <label className="text-sm font-bold">বিক্রয় একক<select required value={form.unit} onChange={e=>set("unit",e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3">{UNIT_OPTIONS.map(unit=><option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
   <label className="text-sm font-bold">প্রতি এককের মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
   <label className="text-sm font-bold">স্টক (একক অনুযায়ী)<input required type="number" min="0" step="1" value={form.stock} onChange={e=>set("stock",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>
  </div>
  <p className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">আপনার নির্বাচিত একক অনুযায়ী মূল্য ও স্টক গণনা হবে। যেমন: ৳500 / কেজি এবং স্টক 100 কেজি।</p>
  <div className="space-y-2"><label className="block text-sm font-bold" htmlFor="product-images">পণ্যের ছবি <span className="font-normal text-[#748074]">(ঐচ্ছিক, সর্বোচ্চ ৪টি)</span></label><input id="product-images" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={loading} onChange={e=>chooseImages(e.target.files)} className="block w-full rounded-xl border px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf4e9] file:px-3 file:py-2 file:font-bold"/><p className="text-xs text-[#748074]">JPG, PNG বা WebP। Supabase project-এর global upload limit প্রযোজ্য।</p>{previews.length>0&&<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{previews.map((src,index)=><div key={src} className="space-y-1"><img src={src} alt={`পণ্যের ছবির preview ${index+1}`} className="h-28 w-full rounded-xl border object-cover"/><p className="text-xs text-[#748074]">ছবি {index+1}</p></div>)}</div>}{images.length>0&&<button type="button" disabled={loading} onClick={()=>setImages([])} className="text-sm font-bold text-red-700">সব ছবি সরান</button>}</div>
  <div><label className="text-sm font-bold">সম্পূর্ণ পণ্যের বিবরণ<textarea maxLength={5000} value={form.description} onChange={e=>set("description",e.target.value)} className="mt-2 min-h-36 w-full rounded-xl border px-4 py-3" placeholder="পণ্যের উপাদান, পরিমাণ, গুণমান, প্যাকেজিং, উৎস, ব্যবহার ও সংরক্ষণের তথ্য লিখুন..."/></label></div>
  <ProductSeoEditor value={form} onChange={set} productName={form.name} description={form.description} previewPath="/marketplace/your-product-slug"/>
  <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">শুধু যাচাইযোগ্য তথ্য দিন। বিভ্রান্তিকর keyword, ভুয়া certification বা অপ্রমাণিত দাবি ব্যবহার করবেন না। পণ্য অ্যাডমিন অনুমোদনের পরেই প্রকাশিত হবে।</p>
  <button disabled={loading} className="w-full rounded-2xl bg-[#17351f] px-5 py-4 font-black text-white disabled:opacity-50">{loading?"জমা হচ্ছে...":"SEO details-সহ পর্যালোচনার জন্য জমা দিন"}</button>
  {message&&<p role="status" className="text-sm font-semibold text-[#1f7a45]">{message}</p>}
 </form>;
}
