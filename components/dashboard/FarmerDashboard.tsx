"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Product={id:string;name:string;price:number;stock:number;reseller_commission_percent:number;status:string};
type Diary={id:string;activity:string;entry_date:string};

export default function FarmerDashboard(){
  const [tab,setTab]=useState("overview");
  const [userId,setUserId]=useState<string|null>(null);
  const [farm,setFarm]=useState<{id:string;name:string;district:string|null}|null>(null);
  const [products,setProducts]=useState<Product[]>([]);
  const [diary,setDiary]=useState<Diary[]>([]);
  const [ordersCount,setOrdersCount]=useState(0);
  const [pendingPayout,setPendingPayout]=useState(0);
  const [selectedProduct,setSelectedProduct]=useState("");
  const [commission,setCommission]=useState("0");
  const [activity,setActivity]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  async function load(){
    setLoading(true);setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setUserId(null);setLoading(false);setMessage("Please sign in to view your farmer dashboard.");return;}
    setUserId(user.id);
    const [{data:farmData},{data:productData},{data:orders},{data:commissions},{data:diaryData}]=await Promise.all([
      supabase.from("farms").select("id,name,district").eq("owner_id",user.id).order("created_at",{ascending:true}).limit(1).maybeSingle(),
      supabase.from("products").select("id,name,price,stock,reseller_commission_percent,status").eq("farmer_id",user.id).order("created_at",{ascending:false}),
      supabase.from("orders").select("id",{count:"exact",head:true}).eq("product_id","") ,
      supabase.from("commissions").select("commission_amount").eq("reseller_id",user.id).eq("status","pending"),
      supabase.from("farm_diary").select("id,activity,entry_date").eq("owner_id",user.id).order("entry_date",{ascending:false}).order("created_at",{ascending:false}).limit(20)
    ]);
    // Farmer orders are linked to products, so fetch order count through the farmer's product ids.
    const productIds=(productData??[]).map(p=>p.id);
    if(productIds.length){const {count}=await supabase.from("orders").select("id",{count:"exact",head:true}).in("product_id",productIds);setOrdersCount(count??0);}else setOrdersCount(0);
    setFarm(farmData??null);setProducts((productData??[]) as Product[]);setDiary((diaryData??[]) as Diary[]);
    setPendingPayout((commissions??[]).reduce((s,c)=>s+Number(c.commission_amount||0),0));
    const first=(productData??[])[0];if(first){setSelectedProduct(first.id);setCommission(String(first.reseller_commission_percent));}
    setLoading(false);
  }
  useEffect(()=>{load()},[]);

  async function saveCommission(){
    if(!selectedProduct)return;setSaving(true);setMessage("");
    const value=Number(commission);if(value<0||value>100){setMessage("Commission must be between 0 and 100%.");setSaving(false);return;}
    const {error}=await supabase.from("products").update({reseller_commission_percent:value}).eq("id",selectedProduct).eq("farmer_id",userId);
    setMessage(error?error.message:"Commission saved successfully.");setSaving(false);if(!error)load();
  }
  async function addDiary(){
    if(!activity.trim()||!farm||!userId)return;setSaving(true);
    const {error}=await supabase.from("farm_diary").insert({farm_id:farm.id,owner_id:userId,activity:activity.trim()});
    setMessage(error?error.message:"Farm diary entry saved.");setActivity("");setSaving(false);if(!error)load();
  }

  const totalStock=products.reduce((s,p)=>s+Number(p.stock||0),0);
  if(loading)return <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">Loading your farmer data…</div>;
  if(!userId)return <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">{message}</div>;

  return <div className="mt-8">
    {message&&<div className="mb-4 rounded-xl bg-[#eef5ed] p-4 text-sm font-semibold">{message}</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-[#647468]">Products</p><p className="mt-2 text-3xl font-black">{products.length}</p></div><div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-[#647468]">Stock units</p><p className="mt-2 text-3xl font-black">{totalStock}</p></div><div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-[#647468]">Orders</p><p className="mt-2 text-3xl font-black">{ordersCount}</p></div><div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-[#647468]">Pending commission</p><p className="mt-2 text-3xl font-black">৳{pendingPayout.toFixed(2)}</p></div></div>
    <div className="mt-6 flex flex-wrap gap-2">{[["overview","Overview"],["products","Products"],["commission","Commission"],["diary","Farm Diary"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab===k?"bg-[#17351f] text-white":"bg-white"}`}>{l}</button>)}</div>
    {tab==="overview"&&<div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Farm overview</h2><div className="mt-5 space-y-3 text-sm"><p className="rounded-xl bg-[#eef5ed] p-4"><b>Farm:</b> {farm?.name??"No farm profile yet"}</p><p className="rounded-xl bg-[#eef5ed] p-4"><b>Location:</b> {farm?.district??"Not set"}</p><p className="rounded-xl bg-[#eef5ed] p-4"><b>Marketplace:</b> {products.filter(p=>p.status==="active").length} active listings</p></div></section><section className="rounded-3xl bg-[#17351f] p-6 text-white"><p className="text-xs uppercase tracking-wider text-white/50">AGRIVA Intelligence</p><h2 className="mt-2 text-2xl font-black">Your farm context</h2><p className="mt-3 text-sm leading-6 text-white/65">Your saved farm and diary data can be passed to the AI Farm Assistant only through authenticated, permission-aware server workflows.</p></section></div>}
    {tab==="products"&&<section className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Your products</h2><div className="mt-5 space-y-3">{products.length?products.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-3 rounded-2xl border p-4"><div><b>{p.name}</b><p className="text-sm text-[#647468]">৳{Number(p.price).toFixed(2)} · Stock {p.stock} · Reseller {p.reseller_commission_percent}%</p></div><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{p.status}</span></div>):<p className="rounded-2xl bg-[#eef5ed] p-4 text-sm">No products found. Add a product from the marketplace flow.</p>}</div></section>}
    {tab==="commission"&&<section className="mt-6 max-w-2xl rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Product reseller commission</h2><p className="mt-2 text-sm text-[#647468]">Set the commission for a specific product. This is saved in Supabase and protected by the farmer ownership policy.</p><label className="mt-5 block text-sm font-bold">Product<select value={selectedProduct} onChange={e=>{setSelectedProduct(e.target.value);const p=products.find(x=>x.id===e.target.value);if(p)setCommission(String(p.reseller_commission_percent))}} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal">{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="mt-4 block text-sm font-bold">Commission %<input type="number" min="0" max="100" value={commission} onChange={e=>setCommission(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/></label><button disabled={saving||!selectedProduct} onClick={saveCommission} className="mt-4 rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">{saving?"Saving…":"Save commission"}</button></section>}
    {tab==="diary"&&<section className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Farm Diary</h2><div className="mt-5 flex gap-2"><input value={activity} onChange={e=>setActivity(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDiary()} placeholder="e.g. Irrigated rice field" className="min-w-0 flex-1 rounded-xl border px-4 py-3"/><button disabled={saving||!farm} onClick={addDiary} className="rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">Add</button></div><div className="mt-5 space-y-3">{diary.length?diary.map(d=><div key={d.id} className="rounded-2xl border p-4"><b>{d.activity}</b><p className="mt-1 text-xs text-[#647468]">{d.entry_date}</p></div>):<p className="rounded-2xl bg-[#eef5ed] p-4 text-sm text-[#647468]">No diary entries yet.</p>}</div></section>}
  </div>
}
