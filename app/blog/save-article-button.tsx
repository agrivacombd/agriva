"use client";
import {useEffect,useState} from "react";
import {BOOKMARK_KEY,readBookmarks,READER_EVENT,toggleBookmark} from "@/lib/blog/reader-interests";

export default function SaveArticleButton({href}:{href:string}){
  const [saved,setSaved]=useState(false);
  useEffect(()=>{
    const refresh=()=>setSaved(readBookmarks().includes(href));
    refresh();
    window.addEventListener(READER_EVENT,refresh);
    const onStorage=(event:StorageEvent)=>{if(event.key===BOOKMARK_KEY || event.key===null)refresh();};
    window.addEventListener("storage",onStorage);
    return ()=>{window.removeEventListener(READER_EVENT,refresh);window.removeEventListener("storage",onStorage);};
  },[href]);
  return <button type="button" aria-pressed={saved} onClick={()=>toggleBookmark(href)}
    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
    {saved?"✓ পড়ার তালিকায় সংরক্ষিত":"☆ পরে পড়ার জন্য রাখুন"}
  </button>;
}
