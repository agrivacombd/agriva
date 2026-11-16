"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {Download,Share2,Copy,Check} from "lucide-react";
import {diseaseCaseUrl,diseaseSlug,type DiseaseCase} from "@/lib/learn/plant-disease-cases";

const WIDTH=1080,HEIGHT=1350;
const FACE='"Noto Sans Bengali","Hind Siliguri","Nirmala UI",sans-serif';
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function wrapped(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,maxLines:number){
  const output:string[]=[];let line="";
  for(const word of text.split(/\s+/u).filter(Boolean)){
    const full=line?line+" "+word:word;
    if(ctx.measureText(full).width<=maxWidth){line=full;continue;}
    if(line){output.push(line);line="";}
    if(output.length>=maxLines)break;
    if(ctx.measureText(word).width<=maxWidth){line=word;continue;}
    let chunk="";
    for(const character of Array.from(word)){
      if(ctx.measureText(chunk+character).width>maxWidth&&chunk){
        output.push(chunk);chunk="";
        if(output.length>=maxLines)break;
      }
      chunk+=character;
    }
    line=chunk;
    if(output.length>=maxLines)break;
  }
  if(output.length<maxLines&&line)output.push(line);
  if(output.length===maxLines&&text.length>output.join(" ").length){
    const last=output.length-1;
    while(output[last]&&ctx.measureText(output[last]+"…").width>maxWidth)output[last]=output[last].slice(0,-1);
    output[last]+="…";
  }
  return output;
}
function drawText(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,width:number,leading:number,maxLines:number){
  const items=wrapped(ctx,value,width,maxLines);
  items.forEach((item,i)=>ctx.fillText(item,x,y+i*leading));
  return y+items.length*leading;
}
function bullet(ctx:CanvasRenderingContext2D,value:string,y:number){
  ctx.fillStyle="#08745a";ctx.beginPath();ctx.arc(91,y+13,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#193a2b";ctx.font="500 25px "+FACE;
  return drawText(ctx,value,115,y,852,39,2)+8;
}
function renderCard(ctx:CanvasRenderingContext2D,item:DiseaseCase){
  ctx.textBaseline="top";
  ctx.fillStyle="#f5f8f2";ctx.fillRect(0,0,WIDTH,HEIGHT);
  const gradient=ctx.createLinearGradient(0,0,WIDTH,155);
  gradient.addColorStop(0,"#064e3b");gradient.addColorStop(1,"#08745a");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,WIDTH,155);
  ctx.fillStyle="#c7e89e";ctx.beginPath();ctx.ellipse(93,77,22,43,-0.45,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#edffdc";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(83,108);ctx.lineTo(110,42);ctx.stroke();
  ctx.fillStyle="#fff";ctx.font="800 55px "+FACE;ctx.fillText("AGRIVA",145,32);
  ctx.fillStyle="#defce9";ctx.font="600 21px "+FACE;ctx.fillText("স্মার্ট কৃষি • নির্ভরযোগ্য তথ্য",146,99);
  ctx.fillStyle="#c9a44e";ctx.fillRect(0,151,WIDTH,6);
  ctx.fillStyle="#deefe2";rounded(ctx,63,181,300,52,23);ctx.fill();
  ctx.fillStyle="#07553c";ctx.font="700 25px "+FACE;ctx.fillText("ফসল: "+item.cropBn,84,191,270);
  ctx.fillStyle="#123c2b";ctx.font="800 49px "+FACE;
  drawText(ctx,item.diseaseBn,67,257,946,60,2);
  ctx.fillStyle="#547464";ctx.font="600 23px "+FACE;drawText(ctx,item.cause,69,380,939,34,2);
  function section(y:number,h:number,title:string,content:string[],color:string){
    ctx.fillStyle=color;rounded(ctx,62,y,956,h,23);ctx.fill();
    ctx.fillStyle="#0b5d41";ctx.font="800 29px "+FACE;ctx.fillText(title,87,y+20);
    let cy=y+75;
    for(const entry of content)cy=bullet(ctx,entry,cy);
  }
  section(458,238,"প্রধান লক্ষণ",item.signs.slice(0,2),"#eaf4e9");
  section(718,245,"প্রাথমিক করণীয়",item.action.slice(0,2),"#ffffff");
  section(985,156,"প্রতিরোধ",item.prevention.slice(0,1),"#e7f3ef");
  ctx.fillStyle="#85571e";ctx.font="600 21px "+FACE;
  drawText(ctx,"শুধু লক্ষণ দেখে রোগ নিশ্চিত নয়। স্থানীয় কৃষি কর্মকর্তা বা বিশেষজ্ঞের পরামর্শ নিন।",70,1166,942,33,2);
  ctx.fillStyle="#064e3b";ctx.fillRect(0,1243,WIDTH,107);
  ctx.fillStyle="#d7f9df";ctx.font="700 22px "+FACE;ctx.fillText("AGRIVA.COM.BD  •  সম্পূর্ণ গাইড পড়ুন",65,1255);
  ctx.fillStyle="#ffffff";ctx.font="600 22px "+FACE;ctx.fillText("agriva.com.bd/learn/plant-disease/",65,1286);
  ctx.font="700 23px "+FACE;ctx.fillText(diseaseSlug(item),65,1315,944);
}
export default function DiseaseShareCard({disease}:{disease:DiseaseCase}){
  const element=useRef<HTMLCanvasElement>(null),png=useRef<Blob|null>(null);
  const [ready,setReady]=useState(false),[message,setMessage]=useState(""),[copied,setCopied]=useState(false);
  const slug=diseaseSlug(disease),url=diseaseCaseUrl(disease),title=disease.diseaseBn+" | AGRIVA";
  useEffect(()=>{
    let closed=false;png.current=null;setReady(false);setMessage("");setCopied(false);
    async function draw(){
      if(document.fonts?.ready)await document.fonts.ready;
      if(closed||!element.current)return;
      const canvas=element.current;canvas.width=WIDTH;canvas.height=HEIGHT;
      const ctx=canvas.getContext("2d");
      if(!ctx){setMessage("এখানে ছবি তৈরি করা যাচ্ছে না। লিংক শেয়ার করতে পারবেন।");return;}
      renderCard(ctx,disease);
      canvas.toBlob(value=>{if(closed)return;png.current=value;setReady(Boolean(value));if(!value)setMessage("PNG তৈরি হয়নি। লিংক শেয়ার করতে পারবেন।");},"image/png");
    }
    void draw();
    return()=>{closed=true};
  },[disease,slug]);
  function save(){
    if(!png.current){setMessage("কার্ড তৈরি হচ্ছে।");return;}
    const local=URL.createObjectURL(png.current);
    const anchor=document.createElement("a");anchor.href=local;anchor.download="agriva-"+slug+".png";
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(local),4000);
    setMessage("PNG সেভ করার জন্য পাঠানো হয়েছে। Downloads বা Gallery দেখুন।");
  }
  function share(){
    const blob=png.current;
    const text=disease.diseaseBn+" — লক্ষণ ও প্রাথমিক করণীয়। বিস্তারিত: "+url;
    // Share is invoked synchronously by user action: Web Share needs transient activation.
    if(blob&&typeof navigator.share==="function"&&typeof navigator.canShare==="function"){
      const file=new File([blob],"agriva-"+slug+".png",{type:"image/png"});
      if(navigator.canShare({files:[file]})){
        void navigator.share({files:[file],title,text}).then(()=>setMessage("কার্ড Share মেনুতে পাঠানো হয়েছে।")).catch(error=>{
          if(error instanceof DOMException&&error.name==="AbortError")return;
          setMessage("ছবি পাঠানো যায়নি। PNG সেভ করে অ্যাপে পাঠান।");
        });
        return;
      }
    }
    if(typeof navigator.share==="function"){
      void navigator.share({title,text,url}).then(()=>setMessage("লিংক Share মেনুতে পাঠানো হয়েছে।")).catch(error=>{
        if(error instanceof DOMException&&error.name==="AbortError")return;
        setMessage("শেয়ার হয়নি। চাইলে লিংক কপি করুন।");
      });
    }else setMessage("এই ব্রাউজারে সরাসরি Share নেই। PNG সেভ বা লিংক কপি করুন।");
  }
  async function copy(){
    try{await navigator.clipboard.writeText(url);setCopied(true);setMessage("রোগের লিংক কপি হয়েছে।");}
    catch{setMessage("নিচের লিংক বক্স থেকে নির্বাচন করে কপি করুন।");}
  }
  const description=disease.diseaseBn+" — রোগের লক্ষণ ও করণীয় | AGRIVA "+url;
  return <section aria-label="AGRIVA রোগের শেয়ার কার্ড" className="mt-5 min-w-0 rounded-2xl border border-emerald-200 bg-[#f5faf5] p-3 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black text-emerald-950">📲 কৃষকের Share Card</h3><p className="mt-1 text-xs leading-6 text-slate-600">AGRIVA ব্র্যান্ড ও রোগের নিজস্ব URL-সহ ছবি। ফোনে সেভ বা সরাসরি শেয়ার করুন।</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800">PNG · 1080×1350</span></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-[430px]"><canvas ref={element} role="img" aria-label={disease.diseaseBn+" ব্র্যান্ডেড শেয়ার কার্ডের প্রিভিউ"} className="block aspect-[4/5] w-full rounded-xl border border-emerald-100 bg-emerald-950 shadow-sm"/><p className="mt-2 text-center text-[11px] text-slate-500">কার্ডে সংক্ষিপ্ত তথ্য; পূর্ণ নির্দেশনা লিংকে।</p></div>
      <div className="flex min-w-0 flex-col justify-center gap-3">
        <button type="button" disabled={!ready} onClick={share} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50"><Share2 size={17}/> ছবি সরাসরি শেয়ার</button>
        <button type="button" disabled={!ready} onClick={save} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-emerald-800 bg-white px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"><Download size={17}/> PNG সেভ করুন</button>
        <button type="button" onClick={()=>void copy()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800">{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"লিংক কপি হয়েছে":"লিংক কপি করুন"}</button>
        <div className="min-w-0 rounded-xl border bg-white p-3"><p className="text-xs font-bold text-slate-500">স্থায়ী রোগের লিংক</p><Link href={"/learn/plant-disease/"+slug} className="mt-1 block break-all text-xs font-bold leading-6 text-emerald-800 underline">{url}</Link><input readOnly value={url} aria-label="শেয়ার করার লিংক" onFocus={event=>event.currentTarget.select()} className="mt-2 w-full rounded-lg border bg-slate-50 p-2 text-xs"/></div>
        <p className="text-xs font-bold text-slate-600">লিংক আলাদাভাবে শেয়ার করুন</p>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <a target="_blank" rel="noopener noreferrer" href={"https://wa.me/?text="+encodeURIComponent(description)} className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-emerald-800">WhatsApp</a>
          <a target="_blank" rel="noopener noreferrer" href={"https://t.me/share/url?url="+encodeURIComponent(url)+"&text="+encodeURIComponent(disease.diseaseBn)} className="rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sky-800">Telegram</a>
          <a target="_blank" rel="noopener noreferrer" href={"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(url)} className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-blue-800">Facebook</a>
          <a target="_blank" rel="noopener noreferrer" href={"https://twitter.com/intent/tweet?text="+encodeURIComponent(disease.diseaseBn)+"&url="+encodeURIComponent(url)} className="rounded-lg border bg-white px-3 py-2.5 text-slate-700">X</a>
        </div>
        {message&&<p role="status" aria-live="polite" className="rounded-lg bg-white p-3 text-xs text-emerald-900">{message}</p>}
        <p className="text-xs leading-5 text-slate-500">কোন অ্যাপে ছবিসহ শেয়ার হবে তা ব্রাউজারের সমর্থনের ওপর নির্ভর করে। কোনো পোস্ট স্বয়ংক্রিয়ভাবে করা হয় না।</p>
      </div>
    </div>
  </section>;
}
