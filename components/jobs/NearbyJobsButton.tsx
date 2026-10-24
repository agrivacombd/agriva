"use client";

import { useState } from "react";

export default function NearbyJobsButton() {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  function locate(){
    if(!navigator.geolocation){setError("এই ব্রাউজারে লোকেশন সুবিধা নেই।");return;}
    setBusy(true);setError("");
    navigator.geolocation.getCurrentPosition(
      position=>{const p=new URLSearchParams({lat:String(position.coords.latitude),lon:String(position.coords.longitude),radius:"25"});window.location.assign("/jobs?"+p.toString()+"#job-search");},
      ()=>{setBusy(false);setError("লোকেশন পাওয়া যায়নি। ব্রাউজারের location permission দিন বা জেলা/উপজেলা দিয়ে খুঁজুন।");},
      {enableHighAccuracy:false,timeout:10000,maximumAge:300000}
    );
  }
  return <div className="mt-4"><button type="button" onClick={locate} disabled={busy} className="inline-flex min-h-11 items-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/20 disabled:opacity-60">{busy?"লোকেশন খোঁজা হচ্ছে…":"⌖ আমার কাছের কাজ খুঁজুন (২৫ কিমি)"}</button>{error&&<p role="status" className="mt-2 text-xs text-amber-100">{error}</p>}</div>;
}
