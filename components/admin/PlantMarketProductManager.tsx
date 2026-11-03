"use client";

import { useState } from "react";

export type PlantMarketAdminProduct = {
  id: string;
  seller_id: string;
  name: string;
  slug: string;
  scientific_name: string | null;
  category: string;
  description: string | null;
  price: number | string;
  stock: number | string;
  unit: string;
  plant_size: string | null;
  pot_size: string | null;
  plant_age: string | null;
  sunlight: string | null;
  watering: string | null;
  flowering_season: string | null;
  delivery_area: string | null;
  image_url: string | null;
  images: string[];
  status: string;
  updated_at: string;
};

export default function PlantMarketProductManager({ initialProducts }: { initialProducts: PlantMarketAdminProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function saveProduct(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setSavingId(id);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/plant-market-products/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id, price: Number(values.price), stock: Number(values.stock) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "পণ্য সংরক্ষণ করা যায়নি।");
      setProducts(current => current.map(product => product.id === id
        ? { ...product, ...values, price: Number(values.price), stock: Number(values.stock), updated_at: result.product.updated_at }
        : product));
      setNotice({ kind: "success", text: "Plant Market পণ্যের তথ্য সংরক্ষিত হয়েছে।" });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে।" });
    } finally {
      setSavingId(null);
    }
  }

  return <section className="mt-6">
    {notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`mb-4 rounded-xl border p-3 text-sm ${notice.kind === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice.text}</p>}
    {products.length === 0 ? <p className="rounded-2xl border border-dashed border-[#d9e3d5] bg-white p-8 text-center text-sm text-[#647466]">এই filter-এ কোনো Plant Market পণ্য পাওয়া যায়নি।</p> :
      <div className="space-y-4">{products.map(product => <form key={product.id} onSubmit={event => void saveProduct(event, product.id)} className="rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ea] pb-4">
          <div className="min-w-0"><h2 className="text-lg font-black">{product.name}</h2><p className="mt-1 break-all text-xs text-[#7b887d]">/{product.slug} · Seller {product.seller_id.slice(0, 8)}</p><p className="mt-1 text-xs text-[#7b887d]">Updated {new Date(product.updated_at).toLocaleDateString("en-GB")}</p></div>
          <span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{product.status}</span>
        </div>
        <input type="hidden" name="id" value={product.id}/>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-semibold">পণ্যের নাম<input name="name" required minLength={2} maxLength={160} defaultValue={product.name} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">বৈজ্ঞানিক নাম<input name="scientific_name" maxLength={160} defaultValue={product.scientific_name ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">ক্যাটাগরি<input name="category" required maxLength={100} defaultValue={product.category} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">মূল্য (৳)<input name="price" type="number" min="0" max="100000000" step="0.01" required defaultValue={product.price} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">স্টক<input name="stock" type="number" min="0" max="100000000" step="0.01" required defaultValue={product.stock} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">একক<input name="unit" required maxLength={40} defaultValue={product.unit} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">গাছের আকার<input name="plant_size" maxLength={100} defaultValue={product.plant_size ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">টবের আকার<input name="pot_size" maxLength={100} defaultValue={product.pot_size ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">গাছের বয়স<input name="plant_age" maxLength={100} defaultValue={product.plant_age ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">সূর্যালোক<input name="sunlight" maxLength={500} defaultValue={product.sunlight ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">পানি দেওয়ার নিয়ম<input name="watering" maxLength={500} defaultValue={product.watering ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold">ফুলের মৌসুম<input name="flowering_season" maxLength={160} defaultValue={product.flowering_season ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold sm:col-span-2 xl:col-span-3">ডেলিভারি এলাকা<input name="delivery_area" maxLength={500} defaultValue={product.delivery_area ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
          <label className="text-sm font-semibold sm:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} defaultValue={product.description ?? ""} className="mt-1.5 w-full rounded-xl border border-[#d9e3d5] px-3 py-2 font-normal"/></label>
          {product.image_url && <div className="sm:col-span-2 xl:col-span-3"><p className="text-xs font-bold text-[#526456]">Primary image · read only</p><a href={product.image_url} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-xs text-emerald-800 underline">Open current image</a></div>}
        </div>
        {product.images?.length > 0 && <div className="mt-4 rounded-xl bg-[#f7faf5] p-3"><p className="text-xs font-bold text-[#526456]">Additional gallery · read only</p><div className="mt-2 flex flex-wrap gap-2">{product.images.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="break-all text-xs text-emerald-800 underline">Image {index + 1}</a>)}</div></div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#7b887d]">Slug ও publication status আলাদা moderation workflow-এ থাকবে। Image upload ও URL পরিবর্তন এখনো বন্ধ; existing media read-only।</p><button type="submit" disabled={savingId !== null} className="min-h-11 rounded-xl bg-[#17452c] px-5 text-sm font-bold text-white disabled:opacity-50">{savingId === product.id ? "সংরক্ষণ হচ্ছে…" : "পরিবর্তন সংরক্ষণ"}</button></div>
      </form>)}</div>}
  </section>;
}
