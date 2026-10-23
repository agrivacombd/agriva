"use client";

import { useState } from "react";

type ProductFormState = {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const initialForm: ProductFormState = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

export default function ProductForm({ seoStudioEnabled = false }: { seoStudioEnabled?: boolean }) {
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof ProductFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/farmer/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          seo_title: form.seoTitle,
          seo_description: form.seoDescription,
          seo_keywords: form.seoKeywords,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error || "Could not submit product.");
        return;
      }

      setForm(initialForm);
      setMessage("Product submitted for admin review.");
    } catch {
      setIsError(true);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-white p-6 shadow-sm sm:p-7">
      <div>
        <label htmlFor="product-name" className="text-sm font-bold">Product name</label>
        <input id="product-name" required maxLength={160} value={form.name} onChange={(event) => set("name", event.target.value)} className={inputClass} placeholder="e.g. Premium Basmati Rice" />
      </div>

      <div>
        <label htmlFor="product-category" className="text-sm font-bold">Category</label>
        <input id="product-category" maxLength={120} value={form.category} onChange={(event) => set("category", event.target.value)} className={inputClass} placeholder="e.g. Rice & Grains" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="product-price" className="text-sm font-bold">Retail price (৳)</label>
          <input id="product-price" required type="number" min="0" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="product-stock" className="text-sm font-bold">Stock quantity</label>
          <input id="product-stock" required type="number" min="0" step="1" value={form.stock} onChange={(event) => set("stock", event.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="product-description" className="text-sm font-bold">Description</label>
        <textarea id="product-description" maxLength={5000} value={form.description} onChange={(event) => set("description", event.target.value)} className={`${inputClass} min-h-32`} placeholder="Describe quality, origin, harvest, and packaging..." />
      </div>

      {seoStudioEnabled && (
        <fieldset className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <legend className="px-2 text-sm font-black">SEO Studio</legend>
          <div>
            <label htmlFor="seo-title" className="text-sm font-bold">SEO title</label>
            <input id="seo-title" maxLength={70} value={form.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} className={inputClass} placeholder="Up to 70 characters" />
          </div>
          <div>
            <label htmlFor="seo-description" className="text-sm font-bold">SEO description</label>
            <textarea id="seo-description" maxLength={170} value={form.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} className={inputClass} placeholder="Up to 170 characters" />
          </div>
          <div>
            <label htmlFor="seo-keywords" className="text-sm font-bold">SEO keywords (optional)</label>
            <input id="seo-keywords" maxLength={500} value={form.seoKeywords} onChange={(event) => set("seoKeywords", event.target.value)} className={inputClass} placeholder="Comma-separated relevant terms" />
          </div>
        </fieldset>
      )}

      <p className="text-xs leading-5 text-slate-500">Products are saved as drafts for review. Advanced SEO and image options will appear only when enabled for your account by an authorized administrator.</p>

      <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[#17351f] px-5 py-4 font-black text-white disabled:opacity-50">
        {loading ? "Submitting..." : "Submit for review"}
      </button>
      {message && <p role="status" aria-live="polite" className={`text-sm font-semibold ${isError ? "text-red-700" : "text-emerald-700"}`}>{message}</p>}
    </form>
  );
}
