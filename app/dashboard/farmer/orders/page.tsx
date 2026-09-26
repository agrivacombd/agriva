import type { Metadata } from "next";
import FarmerOrders from "@/components/dashboard/FarmerOrders";
export const metadata: Metadata={title:"Farmer Orders | AGRIVA",description:"Manage incoming AGRIVA marketplace orders, confirm processing and delivery status.",robots:{index:false,follow:false}};
export const dynamic = "force-dynamic";
export default function Page(){return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer</p><h1 className="mt-3 text-4xl font-black">Order Management</h1><p className="mt-3 text-[#647468]">Review incoming orders and move them through the fulfillment workflow.</p><FarmerOrders/></section></main>}
