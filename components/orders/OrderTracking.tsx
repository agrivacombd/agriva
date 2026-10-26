"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Order = {
  id: string;
  items: string;
  total: number;
  status: string;
  date: string;
  reseller: string;
  payment: string;
  paymentStatus: string;
};

const steps = ["processing", "shipped", "delivered"];

export default function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [notice, setNotice] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedPayment = params.get("payment");
    if (returnedPayment === "pending") {
      setPaymentNotice("পেমেন্ট গেটওয়ে থেকে ফিরে এসেছেন। পেমেন্ট এখনো যাচাই হচ্ছে—অর্ডারের Payment status দেখে নিশ্চিত হোন। শুধু redirect দেখে পেমেন্ট সফল ধরে নেবেন না।");
    } else if (returnedPayment === "failed") {
      setPaymentNotice("পেমেন্ট সম্পন্ন হয়নি বলে গেটওয়ে জানিয়েছে। নিচে অর্ডারের Payment status যাচাই করুন; ইতিমধ্যে টাকা কাটা হয়ে থাকলে আবার পেমেন্ট না করে সাপোর্টে যোগাযোগ করুন।");
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotice("Please sign in to view your orders.");
        return;
      }
      const { data, error } = await supabase
        .from("marketplace_orders")
        .select("id,total_amount,status,payment_method,payment_status,created_at,attribution_code,products(name),quantity")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setNotice("অর্ডারের তথ্য লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        return;
      }
      setOrders((data || []).map((o: any) => ({
        id: o.id,
        items: `${o.products?.name || "Farm product"} × ${o.quantity}`,
        total: Number(o.total_amount),
        status: o.status,
        date: new Date(o.created_at).toLocaleString(),
        reseller: o.attribution_code ? "Referral attributed" : "Direct order",
        payment: o.payment_method === "cod" ? "Cash on Delivery" : "Online",
        paymentStatus: String(o.payment_status || "pending"),
      })));
    })();
  }, []);

  return (
    <div className="mt-8">
      {paymentNotice && <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">{paymentNotice}</div>}
      {notice && <div className="mb-4 rounded-xl bg-[#eef5ed] p-4 text-sm font-semibold">{notice}</div>}
      {orders.length === 0 && !notice && <div className="rounded-3xl bg-white p-8 text-[#647468]">No orders yet.</div>}
      <div className="space-y-4">
        {orders.map((o) => {
          const current = Math.max(0, steps.indexOf(o.status));
          return (
            <article key={o.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b58b28]">#{o.id.slice(0, 8)}</p>
                  <h2 className="mt-1 text-xl font-black">{o.items}</h2>
                  <p className="mt-1 text-sm text-[#647468]">{o.date} · ৳{o.total.toFixed(2)} · {o.reseller} · {o.payment}</p>
                  <p className="mt-2 text-sm font-semibold">Payment status: <span className="capitalize">{o.paymentStatus}</span></p>
                </div>
                <span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold capitalize">{o.status}</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {steps.map((s, i) => (
                  <div key={s}>
                    <div className={`h-2 rounded-full ${o.status === "cancelled" || o.status === "refunded" ? "bg-red-200" : current >= i ? "bg-[#17351f]" : "bg-[#dce5da]"}`} />
                    <p className="mt-2 text-xs font-semibold capitalize">{s}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelected(o)} className="mt-5 rounded-xl border px-4 py-2 text-sm font-bold">View details</button>
            </article>
          );
        })}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6">
            <div className="flex justify-between gap-4">
              <h2 className="text-2xl font-black">Order #{selected.id.slice(0, 8)}</h2>
              <button onClick={() => setSelected(null)} className="text-xl" aria-label="Close order details">×</button>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <p className="rounded-xl bg-[#f5f7f2] p-4"><b>Items:</b> {selected.items}</p>
              <p className="rounded-xl bg-[#f5f7f2] p-4"><b>Total:</b> ৳{selected.total.toFixed(2)}</p>
              <p className="rounded-xl bg-[#f5f7f2] p-4"><b>Payment:</b> {selected.payment}</p>
              <p className="rounded-xl bg-[#f5f7f2] p-4"><b>Payment status:</b> {selected.paymentStatus}</p>
              <p className="rounded-xl bg-[#f5f7f2] p-4"><b>Referral:</b> {selected.reseller}</p>
              <p className="rounded-xl bg-[#f5f7f2] p-4"><b>Status:</b> {selected.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
