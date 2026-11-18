"use client";
import { useState } from "react";

type Props = {
  articleId:string;
  status:string;
  initialUrl:string | null;
  initialAlt:string | null;
  onUploaded:(url:string,alt:string,status:string,body:string)=>void;

};
export default function EditorialImageUpload({articleId,status,initialUrl,initialAlt,onUploaded}:Props) {
  const [file,setFile]=useState<File|null>(null);
  const [alt,setAlt]=useState(initialAlt||"");
  const [rights,setRights]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [url,setUrl]=useState(initialUrl||"");
  const locked=status==="published"||status==="trash";
  async function upload(){
    if(busy||locked)return;
    if(!file){setError("প্রথমে একটি ছবি নির্বাচন করুন।");return;}
    if(alt.trim().length<5){setError("অর্থবহ Alt Text লিখুন।");return;}
    if(!rights){setError("ছবিটি ব্যবহারের অনুমতি নিশ্চিত করুন।");return;}
    setBusy(true);setError("");
    const form=new FormData();
    form.set("file",file);form.set("id",articleId);form.set("alt",alt.trim());form.set("rights","confirmed");
    try {
      const response=await fetch("/api/admin/content-drafts/upload-image",{method:"POST",body:form,credentials:"same-origin"});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Image upload failed.");
      setUrl(data.url);onUploaded(data.url,data.alt,data.status,data.body_markdown);setFile(null);setRights(false);
    } catch(e){setError(e instanceof Error?e.message:"Image upload failed.");}
    finally{setBusy(false);}
  }
  return <section id="article-image-upload" aria-label="Article image upload" className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5">
    <h3 className="text-base font-black">Upload Article Image · Hero + Post</h3>
    <p className="mt-1 text-xs leading-6 text-slate-600">একবার আপলোড করলেই Hero Image, নিবন্ধের মধ্যে ছবি এবং Social Preview (1200×630) তৈরি হবে। আগে অন্য লেখার পরিবর্তন Save Draft করুন। JPG, PNG, WebP · সর্বোচ্চ ৬ MB। মূল JPG/PNG/WebP ফাইলটি কোনো crop, resize বা re-encode ছাড়াই Hero ও Blog-এ সংরক্ষণ হবে। Social Preview আলাদা তৈরি হবে। আগে থেকেই কাটা থাকলে সম্পূর্ণ original ফাইলটি আবার দিন।</p>
    {url&&<div className="mt-3 max-w-xl"><img src={url} alt={alt||"বর্তমান নিবন্ধের ছবি"} className="block h-auto w-full max-w-full rounded-xl border object-contain" /><p className="mt-1 text-xs text-emerald-800">Current hero image · সম্পূর্ণ ছবি (কোনো Crop নয়)</p></div>}
    {locked?<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">Published নিবন্ধে ছবি বদলাতে আগে “Unpublish & Edit” ব্যবহার করুন। এরপর Review এবং Publish করতে হবে।</p>:<>
      <label className="mt-3 block text-sm font-bold">ছবি নির্বাচন
        <input id="article-image-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block w-full rounded-xl border p-2 text-sm"/>
      </label>
      <label className="mt-3 block text-sm font-bold">Alt Text
        <input value={alt} maxLength={250} onChange={e=>setAlt(e.target.value)} placeholder="যেমন: কালো ধানের শীষ ও কালো চালের দানা" className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm font-normal"/>
      </label>
      <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700">
        <input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)} className="mt-1 size-4"/>
        ছবিটি ব্যবহার ও প্রকাশের প্রয়োজনীয় অধিকার বা অনুমতি আমার রয়েছে।
      </label>
      <button type="button" disabled={busy||!file||!rights} onClick={()=>void upload()} className="mt-3 min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white disabled:opacity-50">{busy?"Uploading…":"Upload & Add to Hero + Post"}</button>
    </>}
    
    {error&&<p role="alert" className="mt-2 text-sm font-bold text-red-700">{error}</p>}
  </section>;
}
