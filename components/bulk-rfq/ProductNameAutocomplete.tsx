"use client";
import {useId,useState} from "react";
import {BD_CROP_SUGGESTIONS,cropSearchKey,suggestCrops,type CropSuggestion} from "@/lib/bulk-rfq/bangladesh-crop-suggestions";

export default function ProductNameAutocomplete({
 value,onChange,marketplaceNames=[]
}:{
 value:string;
 onChange:(name:string)=>void;
 marketplaceNames?:readonly string[];
}){
 const id=useId();
 const [isOpen,setIsOpen]=useState(false);
 const [active,setActive]=useState(-1);
 const external:CropSuggestion[]=marketplaceNames
  .filter(x=>typeof x==="string" && x.trim().length>1)
  .slice(0,250)
  .map(name=>({name,category:"বীজ" as const}));
 const catalog=[...external,...BD_CROP_SUGGESTIONS];
 const suggestions=suggestCrops(value,catalog,12).filter((x,i,arr)=>
   arr.findIndex(z=>cropSearchKey(z.name)===cropSearchKey(x.name))===i);
 const visible=isOpen && value.trim().length>0 && suggestions.length>0;
 const pick=(name:string)=>{onChange(name);setActive(-1);setIsOpen(false);};
 return <div className="relative">
  <input
   id={id}
   required
   minLength={2}
   maxLength={120}
   autoComplete="off"
   role="combobox"
   aria-label="পণ্যের নাম"
   aria-autocomplete="list"
   aria-haspopup="listbox"
   aria-expanded={visible}
   aria-controls={`${id}-suggestions`}
   aria-activedescendant={visible && active>=0 && active<suggestions.length?`${id}-option-${active}`:undefined}
   className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
   placeholder="যেমন: ধান বীজ, টমেটো বীজ, কালো ধান..."
   value={value}
   onFocus={()=>setIsOpen(true)}
   onChange={e=>{onChange(e.target.value);setIsOpen(true);setActive(-1);}}
   onBlur={e=>{
    if(!e.currentTarget.parentElement?.contains(e.relatedTarget as Node))setIsOpen(false);
   }}
   onKeyDown={e=>{
    if(e.key==="Escape"){setIsOpen(false);setActive(-1);return;}
    if(!visible && e.key==="ArrowDown"){setIsOpen(true);return;}
    if(!visible)return;
    if(e.key==="ArrowDown"){e.preventDefault();setActive(i=>(i+1)%suggestions.length);}
    if(e.key==="ArrowUp"){e.preventDefault();setActive(i=>i<=0?suggestions.length-1:i-1);}
    if(e.key==="Enter" && active>=0 && suggestions[active]){
      e.preventDefault();pick(suggestions[active].name);
    }
   }}
  />
  <p className="mt-1 text-xs text-slate-500">নাম লিখতে থাকুন—মিল থাকা পণ্য দেখাবে। ক্যাটালগের নাম মানে বর্তমান স্টক নিশ্চিত নয়; তালিকায় না থাকলেও নিজের নাম লিখে অর্ডার করা যাবে।</p>
  {visible&&<div id={`${id}-suggestions`} role="listbox" aria-label="পণ্যের নামের সাজেশন"
    className="absolute left-0 right-0 top-[49px] z-30 max-h-64 overflow-y-auto rounded-xl border border-emerald-200 bg-white py-1 shadow-xl">
    {suggestions.map((s,i)=><button
      type="button" role="option" aria-selected={active===i}
      id={`${id}-option-${i}`}
      key={`${s.name}-${i}`}
      tabIndex={-1}
      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-emerald-50 ${active===i?"bg-emerald-100":""}`}
      onMouseDown={e=>e.preventDefault()}
      onClick={()=>pick(s.name)}>
      <span className="min-w-0 break-words font-semibold text-slate-900">{s.name}</span>
      <span className="shrink-0 text-xs text-emerald-700">{marketplaceNames.includes(s.name)?"AGRIVA":s.supplier?`${s.supplier} · ক্যাটালগ`:s.category}</span>
    </button>)}
  </div>}
 </div>;
}
