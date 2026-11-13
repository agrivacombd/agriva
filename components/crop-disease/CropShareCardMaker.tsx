"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

const BASE = "https://agriva.com.bd";
type Props = { initialCrop?: string; initialDisease?: string; initialDistrict?: string; initialImageUrl?: string; shareUrl?: string };

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "", lines = 0;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight); lines++;
      if (lines >= maxLines) return;
      line = word;
    } else line = test;
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}
export default function CropShareCardMaker({initialCrop="",initialDisease="",initialDistrict="",initialImageUrl,shareUrl}: Props) {
  const [crop,setCrop]=useState(initialCrop);
  const [disease,setDisease]=useState(initialDisease);
  const [district,setDistrict]=useState(initialDistrict);
  const [note,setNote]=useState("");
  const [name,setName]=useState("");
  const [photo,setPhoto]=useState<string | null>(null);
  const [layout,setLayout]=useState<"square"|"landscape"|"portrait">("landscape");
  const [status,setStatus]=useState("");
  const canvas=useRef<HTMLCanvasElement>(null);
  const [image,setImage]=useState<HTMLImageElement|null>(null);
  const [revision,setRevision]=useState(0);

  useEffect(()=>{
    if (!photo && !initialImageUrl) {setImage(null);return;}
    const img=new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>setImage(img);
    img.onerror=()=>{setImage(null);setStatus("ছবি লোড হয়নি। নিজের ছবি আপলোড করুন।");};
    img.src=photo || initialImageUrl || "";
  },[photo,initialImageUrl]);

  useEffect(()=>{
    const el=canvas.current;
    if (!el)return;
    const ctx=el.getContext("2d");
    if (!ctx)return;
    const [w,h]=layout==="square"?[1080,1080]:layout==="portrait"?[1080,1350]:[1200,630];
    el.width=w;el.height=h;
    const grad=ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,"#064e3b");grad.addColorStop(1,"#0f766e");
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    ctx.fillStyle="rgba(255,255,255,0.09)";ctx.beginPath();ctx.arc(w-80,0,310,0,Math.PI*2);ctx.fill();
    const margin=layout==="landscape"?56:72;
    ctx.fillStyle="#a7f3d0";ctx.font="bold 30px sans-serif";ctx.fillText("AGRIVA",margin,margin+15);
    ctx.font="21px sans-serif";ctx.fillStyle="#d1fae5";ctx.fillText("CROP HEALTH  •  কৃষি সহায়তা",margin,margin+52);
    const pictureY=layout==="landscape"?138:170;
    const pictureH=layout==="landscape"?350:layout==="square"?470:660;
    const pictureW=layout==="landscape"?480:w-margin*2;
    if(image) {
      ctx.save();rounded(ctx,margin,pictureY,pictureW,pictureH,24);ctx.clip();
      ctx.fillStyle="#e5e7eb";ctx.fillRect(margin,pictureY,pictureW,pictureH);
      const scale=Math.max(pictureW/image.width,pictureH/image.height);
      ctx.drawImage(image,margin+(pictureW-image.width*scale)/2,pictureY+(pictureH-image.height*scale)/2,image.width*scale,image.height*scale);
      ctx.restore();
    } else {
      ctx.fillStyle="#047857";rounded(ctx,margin,pictureY,pictureW,pictureH,24);ctx.fill();
      ctx.font="bold 34px sans-serif";ctx.fillStyle="#d1fae5";ctx.fillText("ফসলের ছবি",margin+42,pictureY+pictureH/2);
    }
    const tx=layout==="landscape"?margin+pictureW+40:margin;
    const ty=layout==="landscape"?pictureY+28:pictureY+pictureH+66;
    ctx.fillStyle="#d1fae5";ctx.font="bold 28px sans-serif";wrap(ctx,crop||"ফসলের তথ্য",tx,ty,w-tx-margin,40,2);
    ctx.fillStyle="#ffffff";ctx.font="bold 40px sans-serif";
    wrap(ctx,disease||"সম্ভাব্য ফসলের সমস্যা",tx,ty+60,w-tx-margin,53,3);
    ctx.fillStyle="#a7f3d0";ctx.font="25px sans-serif";
    if(district)wrap(ctx,"জেলা: "+district,tx,ty+225,w-tx-margin,34,1);
    if(note) {ctx.fillStyle="#e5f9ef";ctx.font="23px sans-serif";wrap(ctx,note,tx,ty+280,w-tx-margin,32,2);}
    if(name){ctx.fillStyle="#d1fae5";ctx.font="22px sans-serif";wrap(ctx,"প্রস্তুত করেছেন: "+name,margin,h-110,w-margin*2,30,1);}
    ctx.fillStyle="rgba(255,255,255,0.9)";ctx.font="20px sans-serif";
    ctx.fillText("প্রাথমিক তথ্য • নিশ্চিত রোগ নির্ণয় নয়",margin,h-65);
    ctx.font="bold 22px sans-serif";ctx.textAlign="right";ctx.fillText("agriva.com.bd",w-margin,h-65);ctx.textAlign="left";
  },[crop,disease,district,note,name,layout,image,revision]);

  function selectPhoto(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){setStatus("JPG, PNG বা WebP ছবি দিন (সর্বোচ্চ ৫ MB)।");return;}
    if(photo)URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));setStatus("");
  }
  async function exportCard(share:boolean){
    const el=canvas.current;if(!el)return;
    const blob=await new Promise<Blob|null>((resolve)=>el.toBlob(resolve,"image/png"));
    if(!blob){setStatus("কার্ড তৈরি করা যায়নি।");return;}
    const file=new File([blob],"agriva-crop-health.png",{type:"image/png"});
    if(share && navigator.share && navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:"AGRIVA Crop Health",text:"ফসলের তথ্য • AGRIVA",...(shareUrl?{url:shareUrl}:{})});return;}catch{return;}
    }
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");anchor.href=url;anchor.download=file.name;anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    setStatus(share?"শেয়ারিং সমর্থিত নয়, তাই কার্ড ডাউনলোড হয়েছে।":"PNG কার্ড ডাউনলোড হয়েছে।");
  }
  return <section className="mt-8 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
    <h2 className="text-2xl font-black text-slate-900">AGRIVA Social Sharing Card Maker</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">AI ছাড়াই নিজের ছবি ও তথ্য দিয়ে শেয়ারিং কার্ড তৈরি করুন। কোনো তথ্য স্বয়ংক্রিয়ভাবে Public Feed-এ প্রকাশ হয় না।</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm font-semibold">ফসলের নাম<input value={crop} maxLength={80} onChange={e=>setCrop(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="ধান" /></label>
        <label className="block text-sm font-semibold">সম্ভাব্য রোগ / শিরোনাম<input value={disease} maxLength={120} onChange={e=>setDisease(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="পাতায় বাদামি দাগ" /></label>
        <label className="block text-sm font-semibold">জেলা (ঐচ্ছিক)<input value={district} maxLength={80} onChange={e=>setDistrict(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="block text-sm font-semibold">সংক্ষিপ্ত তথ্য (ঐচ্ছিক)<textarea value={note} maxLength={180} onChange={e=>setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="block text-sm font-semibold">কার্ডে নাম (ঐচ্ছিক)<input value={name} maxLength={60} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="block text-sm font-semibold">নিজের ছবি<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="mt-1 block w-full rounded-xl border p-3 text-sm" /></label>
        <label className="block text-sm font-semibold">কার্ডের সাইজ<select value={layout} onChange={e=>setLayout(e.target.value as typeof layout)} className="mt-1 w-full rounded-xl border bg-white p-3"><option value="landscape">Landscape · 1200×630 (Facebook / X)</option><option value="square">Square · 1080×1080</option><option value="portrait">Portrait · 1080×1350</option></select></label>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-emerald-800">লাইভ প্রিভিউ</p>
        <canvas ref={canvas} className="w-full rounded-xl border border-emerald-100 shadow-sm" aria-label="AGRIVA sharing card preview" />
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>void exportCard(false)} className="rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white">PNG ডাউনলোড</button><button type="button" onClick={()=>void exportCard(true)} className="rounded-xl border border-emerald-700 px-4 py-3 font-bold text-emerald-800">শেয়ার করুন</button></div>
        {shareUrl && <a href={shareUrl} className="mt-3 inline-block text-sm font-semibold text-emerald-800 underline">প্রকাশিত বিশ্লেষণের লিংক</a>}
        {status && <p role="status" className="mt-2 text-sm text-slate-700">{status}</p>}
        <p className="mt-3 text-xs leading-5 text-slate-500">ম্যানুয়ালি দেওয়া তথ্য ব্যবহারকারীর দায়িত্বে। এটি চিকিৎসা বা কৃষি বিশেষজ্ঞের নিশ্চিত রোগ নির্ণয় নয়।</p>
      </div>
    </div>
  </section>;
}
