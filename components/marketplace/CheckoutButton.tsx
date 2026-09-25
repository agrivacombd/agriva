"use client";

import { useState } from "react";

export default function CheckoutButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function checkout() {
    setLoading(true); setMessage("");
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1 }) });
    const data = await res.json();
    if (!res.ok) setMessage(data.error || "Checkout failed");
    else setMessage(`Order created: ${data.orderId}. Total ৳${Number(data.total).toLocaleString()}${data.resellerAttributed ? ` • Reseller commission ৳${Number(data.commission).toLocaleString()}` : ""}`);
    setLoading(false);
  }
  return <div className="mt-8"><button disabled={disabled || loading} onClick={checkout} className="w-full rounded-2xl bg-[#17351f] px-6 py-4 font-black text-white disabled:opacity-50">{loading ? "Creating order..." : disabled ? "Out of stock" : "Buy now"}</button>{message && <p className="mt-3 text-sm text-[#647468]">{message}</p>}</div>;
}
