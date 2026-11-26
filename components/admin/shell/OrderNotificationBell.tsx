"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {Bell,BellRing,CheckCheck,X} from "lucide-react";
import {sortedLatest,unreadOrders,type RecentAdminOrder} from "@/lib/admin/order-notifications";
const POLL_MS=30_000;
type Payload={userId:string;observedAt:string;orders:RecentAdminOrder[]};
const getLocal=(key:string)=>{try{return localStorage.getItem(key)}catch{return null}};
const setLocal=(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{}};
export default function OrderNotificationBell(){
  const path=usePathname(),router=useRouter();
  const [open,setOpen]=useState(false),[orders,setOrders]=useState<RecentAdminOrder[]>([]);
  const [unread,setUnread]=useState(0),[error,setError]=useState(""),[permission,setPermission]=useState<NotificationPermission|"unavailable">("unavailable");
  const [browserAlert,setBrowserAlert]=useState(false);
  const cursor=useRef(""),cursorKey=useRef(""),notificationKey=useRef(""),latest=useRef("");
  const running=useRef(false),isFirst=useRef(true),pathname=useRef(path),refresh=useRef(router),fetchedAt=useRef("");
  useEffect(()=>{pathname.current=path;refresh.current=router},[path,router]);
  useEffect(()=>{
    let disposed=false;
    if("Notification" in window)setPermission(Notification.permission);
    async function poll(){
      if(disposed||running.current)return;
      running.current=true;
      try{
        const response=await fetch("/api/admin/recent-orders",{cache:"no-store",credentials:"same-origin"});
        if(!response.ok)throw Error("feed");
        const payload=await response.json() as Payload;
        if(disposed||!payload?.userId||!Array.isArray(payload.orders))return;
        const items=sortedLatest(payload.orders).filter(row=>typeof row.id==="string"&&Number.isFinite(Date.parse(row.created_at)));
        const current=items[0]?.created_at||payload.observedAt;
        fetchedAt.current=payload.observedAt;
        const key="agriva:admin:orders:seen:"+payload.userId;
        const notifyKey="agriva:admin:orders:alerted:"+payload.userId;
        const alertKey="agriva:admin:orders:browser-alerts:"+payload.userId;
        if(key!==cursorKey.current){
          cursorKey.current=key;notificationKey.current=notifyKey;
          const previous=getLocal(key);
          cursor.current=previous&&Number.isFinite(Date.parse(previous))?previous:current;
          if(!previous)setLocal(key,current);
          latest.current=current;
          isFirst.current=true;
        }
        const incoming=unreadOrders(items,cursor.current);
        const alreadyAlerted=getLocal(notifyKey);
        const newForAlert=unreadOrders(items,alreadyAlerted||current);
        const alertsOn=getLocal(alertKey)==="on";
        setBrowserAlert(alertsOn);setUnread(incoming.length);setOrders(items);setError("");
        if(!isFirst.current&&Date.parse(current)>Date.parse(latest.current)&&pathname.current==="/admin/orders"){
          refresh.current.refresh();
        }
        if(!isFirst.current&&newForAlert.length&&alertsOn&&"Notification" in window&&Notification.permission==="granted"){
          const popup=new Notification("AGRIVA · নতুন অর্ডার",{body:newForAlert.length+"টি নতুন অর্ডার এসেছে।",tag:"agriva-new-orders"});
          popup.onclick=()=>{window.focus();router.push("/admin/orders");popup.close()};
        }
        if(!isFirst.current&&newForAlert.length)setLocal(notifyKey,current);
        else if(isFirst.current&&!alreadyAlerted)setLocal(notifyKey,current);
        latest.current=current;isFirst.current=false;
      }catch{if(!disposed)setError("অর্ডার নোটিফিকেশন পাওয়া যায়নি।")}
      finally{running.current=false}
    }
    void poll();
    const timer=window.setInterval(()=>{if(!document.hidden)void poll()},POLL_MS);
    const focus=()=>void poll(),visible=()=>{if(!document.hidden)void poll()};
    window.addEventListener("focus",focus);document.addEventListener("visibilitychange",visible);
    return()=>{disposed=true;window.clearInterval(timer);window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",visible)};
  },[router]);
  const markRead=()=>{
    const value=orders[0]?.created_at||fetchedAt.current||new Date().toISOString();
    cursor.current=value;if(cursorKey.current)setLocal(cursorKey.current,value);setUnread(0);
  };
  const getBrowserKey=()=>cursorKey.current.replace(":seen:",":browser-alerts:");
  const enableBrowser=async()=>{
    if(!("Notification" in window))return;
    try{
      const result=await Notification.requestPermission();
      setPermission(result);
      if(result==="granted"){setLocal(getBrowserKey(),"on");setBrowserAlert(true)}
    }catch{setError("Browser notification permission দেওয়া যায়নি।")}
  };
  const toggleBrowser=()=>{
    setLocal(getBrowserKey(),browserAlert?"off":"on");setBrowserAlert(v=>!v);
  };
  return <div className="relative shrink-0">
    <button type="button" aria-label={unread?unread+" unread orders":"Order notifications"} aria-haspopup="dialog" aria-expanded={open}
      onClick={()=>setOpen(v=>!v)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dbe7db] bg-white text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
      {unread>0?<BellRing size={19} aria-hidden="true"/>:<Bell size={19} aria-hidden="true"/>}
      {unread>0&&<span aria-hidden="true" className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">{unread>29?"29+":unread}</span>}
    </button>
    <span className="sr-only" aria-live="polite">{unread>0?unread+" new orders waiting":""}</span>
    {open&&<div role="dialog" aria-label="Order notifications" className="absolute right-0 top-12 z-50 w-[min(92vw,370px)] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-3">
        <div><p className="text-sm font-black text-emerald-950">নতুন অর্ডার</p><p className="text-xs text-slate-600">{unread?unread+"টি অপঠিত":"সাম্প্রতিক অর্ডার"}</p></div>
        <button type="button" aria-label="Close order notifications" onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><X size={17}/></button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto">
        {error&&<p role="alert" className="p-3 text-xs text-rose-700">{error}</p>}
        {!error&&!orders.length&&<p className="p-4 text-sm text-slate-600">এখনো কোনো অর্ডার নেই।</p>}
        {orders.map(order=><Link key={order.id} href={"/admin/orders#order-"+encodeURIComponent(order.id)}
          onClick={()=>{markRead();setOpen(false)}} className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 p-3 transition hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none">
          <span className="min-w-0"><span className="block text-sm font-extrabold text-emerald-950">অর্ডার #{order.id.slice(0,8)}</span><span className="mt-1 block text-xs text-slate-600">{new Date(order.created_at).toLocaleString("bn-BD",{timeZone:"Asia/Dhaka"})} · {order.status}</span></span>
          <span className="shrink-0 text-sm font-black text-emerald-900">৳{Number(order.total_amount||0).toLocaleString("bn-BD")}</span>
        </Link>)}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
        <button type="button" disabled={unread===0} onClick={markRead} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-200 px-3 text-xs font-bold text-emerald-900 disabled:opacity-50"><CheckCheck size={15}/> সব পড়া হয়েছে</button>
        <Link href="/admin/orders" onClick={()=>{markRead();setOpen(false)}} className="inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white">সব অর্ডার দেখুন</Link>
        {permission==="default"&&<button type="button" onClick={()=>void enableBrowser()} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold">Browser alert চালু</button>}
        {permission==="granted"&&<button type="button" onClick={toggleBrowser} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold">{browserAlert?"Browser alert বন্ধ":"Browser alert চালু"}</button>}
      </div>
      <p className="px-3 pb-3 text-[11px] leading-4 text-slate-500">Admin Panel খোলা থাকলে প্রতি ৩০ সেকেন্ডে চেক হয়। বন্ধ থাকলে এটি Push Notification নয়।</p>
    </div>}
  </div>;
}
