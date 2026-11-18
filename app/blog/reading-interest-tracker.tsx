"use client";

import {useEffect} from "react";
import {recordReaderVisit} from "@/lib/blog/reader-interests";

/** On-device activity tracking only after the reader explicitly opts in on /blog. */
export default function ReadingInterestTracker({slug,title,category}:{slug:string;title:string;category:string}){
  useEffect(()=>{
    if(!slug || !/^[a-z0-9][a-z0-9-]{0,160}$/.test(slug))return;
    // A short, intentional read—not merely link prefetch or a server request.
    const timeout=window.setTimeout(()=>{
      if(document.visibilityState==="visible"){
        recordReaderVisit("/blog/"+slug,category,title);
      }
    },5000);
    return ()=>window.clearTimeout(timeout);
  },[slug,title,category]);
  return null;
}
