"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {RotateCcw,Trash2,ShieldAlert} from "lucide-react";

type Props={id:string;slug:string;title:string;trashed:boolean;onDone?:()=>void;compact?:boolean};
type Action="trash"|"restore"|"permanent";

export default function ContentRemovalActions({id,slug,title,trashed,onDone,compact=false}:Props){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function run(action:Action){
    if(busy)return;
    const base={id,action};
    let payload:Record<string,unknown>={...base};
    if(action==="trash"){
      if(!window.confirm("এই পোস্টটি Trash-এ সরাবেন?\n"+title+"\n\nপ্রকাশিত থাকলে এটি public Blog থেকে সরবে।"))return;
      payload={...base,confirm:true};
    }else if(action==="restore"){
      if(!window.confirm("পোস্টটি Draft হিসেবে ফিরিয়ে আনবেন?\n"+title+"\n\nএটি নিজে থেকে Publish হবে না।"))return;
      payload={...base,confirm:true};
    }else{
      const typed=window.prompt("PERMANENT DELETE — পোস্ট, কনটেন্ট ও revision history মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।\n\nনিশ্চিত করতে নিচের slug হুবহু লিখুন:\n"+slug);
      if(typed!==slug){if(typed!==null)setError("Slug মেলেনি। কোনো তথ্য মুছে ফেলা হয়নি।");return;}
      if(!window.confirm("শেষ নিশ্চিতকরণ: '"+title+"' স্থায়ীভাবে মুছে ফেলবেন? এটি Undo করা যাবে না।"))return;
      payload={...base,confirmSlug:slug,confirmPermanent:true};
    }
    setBusy(true);setError("");
    try{
      const res=await fetch("/admin/content-drafts/trash",{method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(typeof data.error==="string"?data.error:"Action failed.");
      onDone?.();
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Could not update content.");}
    finally{setBusy(false);}
  }
  return <div className={"flex min-w-0 flex-wrap items-center gap-2 "+(compact?"text-xs":"text-sm")}>
    {!trashed?<button type="button" disabled={busy} onClick={()=>void run("trash")}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 font-bold text-rose-800 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={15}/> Trash</button>:<>
      <button type="button" disabled={busy} onClick={()=>void run("restore")}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"><RotateCcw size={15}/> Restore as Draft</button>
      <button type="button" disabled={busy} onClick={()=>void run("permanent")}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-rose-700 px-3 py-2 font-bold text-white hover:bg-rose-800 disabled:opacity-50"><ShieldAlert size={15}/> Permanently Delete</button>
    </>}
    {error&&<p role="alert" className="w-full text-xs font-bold leading-5 text-rose-700">{error}</p>}
  </div>;
}
