"use client";
import { useState } from "react";

export default function ProductForm() {
  const [form, setForm] = useState({ name: "", price: "", stock: "", commission: "10", description: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: string, value: string) => setForm(x => ({ ...x, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    const res = await fetch("/api/farmer/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json(); setLoading(false);
    setMessage(res.ok ? "Product submitted for admin review." : (data.error || "Could not submit product."));
    if (res.ok) setForm({ name: "", price: "", stock: "", commission: "10", description: "" });
  }
  return <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm"><div><label className="text-sm font-bold">Product name</label><input required value={form.name} onChange={e=>set("name",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="e.g. Premium Basmati Rice"/></div><div className="grid gap-5 md:grid-cols-3"><div><label className="text-sm font-bold">Price (৳)</label><input required type="number" min="0" value={form.price} onChange={e=>set("price",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></div><div><label className="text-sm font-bold">Stock</label><input required type="number" min="0" value={form.stock} onChange={e=>set("stock",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></div><div><label className="text-sm font-bold">Reseller commission %</label><input required type="number" min="0" max="100" step="0.01" value={form.commission} onChange={e=>set("commission",e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></div></div><div><label className="text-sm font-bold">Description</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} className="mt-2 min-h-32 w-full rounded-xl border px-4 py-3" placeholder="Describe quality, origin, harvest, packaging..."/></div><button disabled={loading} className="w-full rounded-2xl bg-[#17351f] px-5 py-4 font-black text-white disabled:opacity-50">{loading ? "Submitting..." : "Submit for review"}</button>{message&&<p className="text-sm font-semibold text-[#1f7a45]">{message}</p>}</form>;
}
