"use client";
import {useRef, type MouseEvent} from "react";

type Action=(formData:FormData)=>Promise<void>;
export default function ProductRemovalControls({id,slug,trashed,action}:{id:string;slug:string;trashed:boolean;action:Action}){
 const confirmation=useRef<HTMLInputElement>(null);
 function confirmPermanent(e:MouseEvent<HTMLButtonElement>){
   if(confirmation.current) confirmation.current.value="";
   const entered=window.prompt("This product will be permanently deleted and cannot be restored.\n\nType the exact product slug to confirm:\n"+slug);
   if(entered!==slug){e.preventDefault();return;}
   if(!window.confirm("Final confirmation: permanently delete this product?")){e.preventDefault();return;}
   if(confirmation.current) confirmation.current.value=entered;
 }
 return <>
   <input type="hidden" name="confirmSlug" ref={confirmation}/>
   {trashed?<><button formAction={action} name="intent" value="restore" formNoValidate className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800" onClick={e=>{if(!window.confirm("Restore this product from Trash?"))e.preventDefault();}}>Restore</button><button formAction={action} name="intent" value="permanent" formNoValidate onClick={confirmPermanent} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Permanently delete</button></>:<button formAction={action} name="intent" value="trash" formNoValidate onClick={e=>{if(!window.confirm("Move this product to Trash?"))e.preventDefault();}} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Move to Trash</button>}
 </>;
}
