"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft,FileUp,LoaderCircle,ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import BrandLogo from "@/components/BrandLogo";
type Module="plant_market"|"marketplace"|"employer"|"transport"|"sell_harvest";
type Application={id:string;module:Module;status:string;review_note:string|null;created_at:string};
const statusLabel:Record<string,string>={pending:"পর্যালোচনার অপেক্ষায়",under_review:"পর্যালোচনা চলছে",approved:"অনুমোদিত",rejected:"সংশোধন প্রয়োজন",withdrawn:"প্রত্যাহার করা হয়েছে"};
export default function IdentityVerificationPage(){
 const [module,setModule]=useState<Module>("plant_market"),[applications,setApplications]=useState<Application[]>([]);
 const [files,setFiles]=useState<File[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [message,setMessage]=useState(""),[error,setError]=useState(false);
 const load=useCallback(async()=>{
  const response=await fetch("/api/identity/applications",{cache:"no-store"});
  if(response.status===401){window.location.href="/login?next=/account/verification";return;}
  const data=await response.json();if(!response.ok)throw new Error(data.error||"আবেদন লোড করা যায়নি");
  setApplications(data.applications||[]);
 },[]);
 useEffect(()=>{load().catch(e=>{setError(true);setMessage(e.message)}).finally(()=>setLoading(false));},[load]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const formElement=event.currentTarget;setBusy(true);setError(false);setMessage("");
  const form=new FormData(formElement);
  if(files.length>5){setBusy(false);setError(true);setMessage("সর্বোচ্চ ৫টি প্রমাণপত্র আপলোড করতে পারবেন।");return;}
  let supabaseClient:ReturnType<typeof createSupabaseBrowserClient>|undefined;
  const uploadedPaths:string[]=[];
  try{
   const supabase=supabaseClient=createSupabaseBrowserClient(),auth=await supabase.auth.getUser();
   if(auth.error||!auth.data.user){window.location.href="/login?next=/account/verification";return;}
   const evidencePaths:string[]=[];
   for(const file of files){
    const ext=file.name.toLowerCase().split(".").pop()||"";
    if(!["jpg","jpeg","png","pdf"].includes(ext)||file.size>5*1024*1024)throw new Error("প্রতি ফাইল JPG, PNG বা PDF হতে হবে এবং ৫ MB-এর মধ্যে হতে হবে।");
    const path=auth.data.user.id+"/"+crypto.randomUUID()+"."+ext;
    const uploaded=await supabase.storage.from("identity-verification").upload(path,file,{upsert:false,contentType:file.type});
    if(uploaded.error){
     const statusValue=(uploaded.error as unknown as {statusCode?:string|number}).statusCode;
     const status=statusValue?String(statusValue):"unknown";
     const code="error" in uploaded.error&&typeof uploaded.error.error==="string"?uploaded.error.error:"";
     throw new Error("Storage upload ব্যর্থ (HTTP "+status+(code?", "+code:"")+"): "+uploaded.error.message);
    }
    uploadedPaths.push(path);
    evidencePaths.push(path);
   }
   const payload:Record<string,unknown>={module,evidencePaths};
   if(module==="plant_market")Object.assign(payload,{district:form.get("district"),gardeningTypes:[form.get("gardeningType")],experienceNote:form.get("experienceNote")});
   if(module==="employer")Object.assign(payload,{organizationName:form.get("organizationName"),organizationType:form.get("organizationType"),tradeLicense:form.get("tradeLicense"),businessAddress:form.get("businessAddress"),website:form.get("website"),contactName:form.get("contactName"),contactPhone:form.get("contactPhone"),industry:form.get("industry")});
   if(module==="transport")Object.assign(payload,{providerName:form.get("providerName"),contactPhone:form.get("contactPhone"),district:form.get("district"),serviceArea:form.get("serviceArea"),vehicleTypes:form.get("vehicleTypes"),licenseNumber:form.get("licenseNumber"),experienceNote:form.get("experienceNote")});
   if(module==="sell_harvest")Object.assign(payload,{district:form.get("district"),upazila:form.get("upazila"),farmingTypes:[form.get("farmingType")],farmDescription:form.get("farmDescription")});
   if(module==="marketplace")Object.assign(payload,{organizationName:form.get("organizationName"),organizationType:form.get("organizationType"),tradeLicense:form.get("tradeLicense"),businessAddress:form.get("businessAddress"),website:form.get("website")});
   const response=await fetch("/api/identity/applications",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"আবেদন জমা হয়নি");
   uploadedPaths.length=0;
   setFiles([]);formElement.reset();
   setMessage("আপনার আবেদন জমা হয়েছে। Admin review শেষ না হওয়া পর্যন্ত বিক্রির অনুমতি সক্রিয় হবে না।");await load();
  }catch(e){
   if(supabaseClient&&uploadedPaths.length){
    const cleanup=await supabaseClient.storage.from("identity-verification").remove(uploadedPaths);
    if(cleanup.error)console.error("Identity evidence cleanup failed:",cleanup.error.message);
   }
   setError(true);setMessage(e instanceof Error?e.message:"আবেদন জমা হয়নি");
  }
  finally{setBusy(false);}
 }
 const hasOpen=applications.some(a=>a.module===module&&["pending","under_review","approved"].includes(a.status));
 return <main className="min-h-screen bg-[#f5f8f2] text-[#173b2d]">
  <header className="border-b border-[#e1e9df] bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"><BrandLogo href="/dashboard" imageClassName="h-10 w-40"/><Link href="/dashboard" className="text-sm font-bold text-[#126b4f]">Dashboard</Link></div></header>
  <section className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
   <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#52705d]"><ArrowLeft size={16}/> ড্যাশবোর্ডে ফিরুন</Link>
   <div className="mt-6 rounded-[2rem] border border-[#e1e9df] bg-white p-5 shadow-sm sm:p-9">
    <div className="flex items-center gap-3"><span className="rounded-2xl bg-[#eaf4eb] p-3 text-[#126b4f]"><ShieldCheck size={25}/></span><div><p className="text-xs font-bold uppercase tracking-widest text-[#a67f25]">Identity & Seller Access</p><h1 className="mt-1 text-3xl font-black">পরিচয় যাচাই ও বিক্রেতা অনুমোদন</h1></div></div>
    <p className="mt-4 text-sm leading-7 text-[#637568]">একটি account-এ একাধিক পরিচয় থাকতে পারে। যে module-এ বিক্রি করতে চান সেটির জন্য আলাদা আবেদন করুন। role নির্বাচন বা profile পরিবর্তন করে বিক্রির অনুমতি পাওয়া যাবে না। অনুমোদন না পাওয়া পর্যন্ত সংশ্লিষ্ট বিক্রির সুবিধা বন্ধ থাকবে।</p>
    {loading?<div className="py-8 text-sm text-slate-500"><LoaderCircle className="mr-2 inline animate-spin" size={17}/>আবেদন লোড হচ্ছে…</div>:<>
     <div className="mt-7 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={()=>setModule("plant_market")} className={"rounded-xl border p-4 text-left "+(module==="plant_market"?"border-[#167453] bg-[#eef7ef]":"border-slate-200")}><b>🪴 Plant Market</b><span className="mt-1 block text-xs text-slate-500">শখের / ornamental gardener</span></button>
      <button type="button" onClick={()=>setModule("marketplace")} className={"rounded-xl border p-4 text-left "+(module==="marketplace"?"border-[#167453] bg-[#eef7ef]":"border-slate-200")}><b>🏪 Marketplace</b><span className="mt-1 block text-xs text-slate-500">কোম্পানি / দোকান / ডিলার</span></button>
      
     </div>
     {applications.length>0&&<div className="mt-6 rounded-xl border border-[#e5ece2] p-4"><h2 className="font-bold">আপনার আবেদনের অবস্থা</h2><div className="mt-3 space-y-2">{applications.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f8faf6] p-3 text-sm"><span>{a.module==="plant_market"?"Plant Market":a.module==="marketplace"?"Marketplace":a.module==="employer"?"নিয়োগদাতা (পুরোনো আবেদন)":a.module==="transport"?"পরিবহন সেবাদাতা (পুরোনো আবেদন)":"Sell Harvest"}</span><span className="rounded-full bg-[#eaf4eb] px-3 py-1 text-xs font-bold">{statusLabel[a.status]||a.status}</span>{a.review_note&&<p className="w-full text-xs text-[#8b4a35]">Admin note: {a.review_note}</p>}</div>)}</div></div>}
     {hasOpen?<p className="mt-6 rounded-xl bg-[#f7faf5] p-4 text-sm text-[#647568]">এই module-এর জন্য ইতিমধ্যে আবেদন জমা আছে অথবা অনুমোদিত। rejected হলে review note সংশোধন করে পুনরায় আবেদন করতে পারবেন।</p>:<form onSubmit={submit} className="mt-7 space-y-4">
      <h2 className="text-xl font-black">{module==="plant_market"?"Gardener পরিচয়":module==="marketplace"?"ব্যবসা / প্রতিষ্ঠানের পরিচয়":module==="employer"?"নিয়োগদাতার পরিচয়":"পরিবহন সেবাদাতার পরিচয়"}</h2>
      {module==="plant_market"&&<><label className="block text-sm font-semibold">জেলা<input name="district" required maxLength={80} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">বাগানের ধরন<select name="gardeningType" required className="mt-2 w-full rounded-xl border p-3"><option value="indoor">Indoor plants</option><option value="outdoor">Outdoor / ornamental plants</option><option value="nursery_hobby">Home nursery / hobby propagation</option></select></label><label className="block text-sm font-semibold">আপনার বাগান ও গাছের পরিচর্যার অভিজ্ঞতা<textarea name="experienceNote" required minLength={20} maxLength={2000} className="mt-2 w-full rounded-xl border p-3" rows={4}/></label></>}
      
      {(module==="marketplace"||module==="employer")&&<><label className="block text-sm font-semibold">প্রতিষ্ঠান / দোকানের নাম<input name="organizationName" required maxLength={180} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">ব্যবসার ধরন<select name="organizationType" className="mt-2 w-full rounded-xl border p-3"><option value="company">কোম্পানি</option><option value="shop">দোকান</option><option value="dealer">ডিলার</option><option value="cooperative">সমবায়</option><option value="other">অন্যান্য</option></select></label><label className="block text-sm font-semibold">Trade License / নিবন্ধন নম্বর (যদি থাকে)<input name="tradeLicense" maxLength={100} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">ব্যবসার ঠিকানা<input name="businessAddress" required maxLength={300} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">Website / ব্যবসায়িক পেজ (ঐচ্ছিক)<input name="website" type="url" maxLength={300} className="mt-2 w-full rounded-xl border p-3"/></label>{module==="employer"&&<><label className="block text-sm font-semibold">যোগাযোগকারীর নাম<input name="contactName" required maxLength={120} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">যোগাযোগ নম্বর<input name="contactPhone" required maxLength={30} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">প্রতিষ্ঠানের খাত / Industry<input name="industry" required maxLength={120} className="mt-2 w-full rounded-xl border p-3"/></label></>}</>}
      {module==="transport"&&<><label className="block text-sm font-semibold">সেবাদাতার / প্রতিষ্ঠানের নাম<input name="providerName" required maxLength={180} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">যোগাযোগ নম্বর<input name="contactPhone" required maxLength={30} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">জেলা<input name="district" required maxLength={80} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">উপজেলা / এলাকা<input name="serviceArea" required maxLength={160} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">যানবাহনের ধরন<input name="vehicleTypes" required placeholder="ট্রাক, পিকআপ, কাভার্ড ভ্যান..." maxLength={200} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">লাইসেন্স / নিবন্ধন নম্বর (যদি থাকে)<input name="licenseNumber" maxLength={100} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">অভিজ্ঞতা ও সেবার বিবরণ<textarea name="experienceNote" required minLength={20} maxLength={2000} rows={4} className="mt-2 w-full rounded-xl border p-3"/></label></>}
      <label className="block rounded-xl border border-dashed border-[#b8cbb7] bg-[#f8faf6] p-4 text-sm font-semibold"><span className="flex items-center gap-2"><FileUp size={18}/> পরিচয়ের সহায়ক প্রমাণপত্র (সর্বোচ্চ ৫টি, প্রতিটি ৫ MB)</span><input type="file" required multiple accept=".jpg,.jpeg,.png,.pdf" onChange={e=>setFiles(Array.from(e.target.files||[]))} className="mt-3 block w-full text-xs"/><span className="mt-2 block text-xs font-normal text-slate-500">ফাইল private storage-এ থাকবে; public URL তৈরি করা হবে না।</span></label>
      <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-3 font-bold text-white disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={18}/>:<ShieldCheck size={18}/>} আবেদন জমা দিন</button>
     </form>}
    </>}
    {message&&<p role="status" className={"mt-4 rounded-xl p-3 text-sm "+(error?"bg-red-50 text-red-700":"bg-emerald-50 text-emerald-800")}>{message}</p>}
   </div>
  </section>
 </main>;
}
