import type { Metadata } from "next";
import OrderTracking from "@/components/orders/OrderTracking";
export const metadata: Metadata={title:"My Orders | AGRIVA",description:"Track AGRIVA farm product orders and delivery status.",robots:{index:false,follow:false}};
export const dynamic = "force-dynamic";
export default function OrdersPage(){return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-5xl px-6 py-12"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Orders</p><h1 className="mt-3 text-4xl font-black">My Orders</h1><p className="mt-3 text-[#647468]">Track order status, items and reseller attribution from one place.</p><OrderTracking/></section></main>}
