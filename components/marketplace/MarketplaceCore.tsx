"use client";

import { useMemo, useState } from "react";

type Product = { id: number; name: string; farmer: string; price: number; commission: number };
type Referral = { productId: number; code: string; expires: string; clicks: number };

const initialProducts: Product[] = [
  { id: 1, name: "নমুনা: ভালো মানের ধান", farmer: "AGRIVA Farmer", price: 72, commission: 8 },
  { id: 2, name: "নমুনা: তাজা আলু", farmer: "AGRIVA Farmer", price: 38, commission: 10 },
  { id: 3, name: "নমুনা: মৌসুমি পেঁয়াজ", farmer: "AGRIVA Farmer", price: 55, commission: 7 },
];

const money = (value: number) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);

export default function MarketplaceCore() {
  const [role, setRole] = useState<"farmer" | "reseller">("farmer");
  const [products, setProducts] = useState(initialProducts);
  const [selected, setSelected] = useState<Product | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("10");
  const [formError, setFormError] = useState("");
  const totalPotential = useMemo(() => referrals.length, [referrals]);

  function addProduct() {
    const parsedPrice = Number(price);
    const parsedCommission = Number(commission);
    if (!name.trim()) {
      setFormError("পণ্যের নাম লিখুন।");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError("সঠিক বিক্রয়মূল্য লিখুন।");
      return;
    }
    if (!Number.isFinite(parsedCommission) || parsedCommission < 0 || parsedCommission > 100) {
      setFormError("কমিশন ০ থেকে ১০০ শতাংশের মধ্যে দিন।");
      return;
    }
    setProducts((current) => [
      { id: Date.now(), name: name.trim(), farmer: "আপনি", price: parsedPrice, commission: parsedCommission },
      ...current,
    ]);
    setName("");
    setPrice("");
    setCommission("10");
    setFormError("");
    setNotice("এই preview-তে পণ্যটি তালিকায় যোগ হয়েছে।");
  }

  function getReferral(product: Product) {
    const code = `AGRIVA-${product.id}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const expires = new Date(Date.now() + 15 * 86400000).toISOString();
    setReferrals((current) => [{ productId: product.id, code, expires, clicks: 1 }, ...current]);
    setSelected(product);
    setNotice("Preview referral তৈরি হয়েছে। Attribution window: ১৫ দিন।");
    if (typeof document !== "undefined") {
      document.cookie = `agriva_ref=${code}; Max-Age=${15 * 86400}; Path=/; SameSite=Lax`;
    }
  }

  const tabClass = (active: boolean) =>
    `min-h-11 flex-1 rounded-xl px-4 py-3 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 sm:flex-none ${active ? "bg-emerald-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-emerald-50"}`;

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-[#eaf3e7] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="px-2 py-1">
          <p className="text-sm font-extrabold">কোন ভূমিকায় কাজ করবেন?</p>
          <p className="mt-1 text-xs text-slate-600">প্যানেল বেছে নিন</p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Marketplace role">
          <button type="button" role="tab" aria-selected={role === "farmer"} onClick={() => { setRole("farmer"); setNotice(""); }} className={tabClass(role === "farmer")}>🧑‍🌾 কৃষক প্যানেল</button>
          <button type="button" role="tab" aria-selected={role === "reseller"} onClick={() => { setRole("reseller"); setNotice(""); }} className={tabClass(role === "reseller")}>🤝 রিসেলার প্যানেল</button>
        </div>
      </div>

      {notice && (
        <div role="status" className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
          <span aria-hidden="true">✓</span><p>{notice}</p>
        </div>
      )}

      {role === "farmer" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl" aria-hidden="true">🌾</span>
              <div><h2 className="text-lg font-black">নতুন পণ্য তালিকা</h2><p className="mt-1 text-sm leading-5 text-slate-500">পণ্যের তথ্য দিয়ে শুরু করুন</p></div>
            </div>
            <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); addProduct(); }}>
              <label className="block text-sm font-bold text-slate-700">পণ্যের নাম
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="যেমন: উন্নত জাতের ধান" maxLength={120} required />
              </label>
              <label className="block text-sm font-bold text-slate-700">বিক্রয়মূল্য (৳)
                <input type="number" inputMode="decimal" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="যেমন: ৭৫০" required />
              </label>
              <label className="block text-sm font-bold text-slate-700">রিসেলার কমিশন (%)
                <input type="number" inputMode="decimal" min="0" max="100" step="0.5" value={commission} onChange={(event) => setCommission(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" required />
              </label>
              {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{formError}</p>}
              <button type="submit" className="min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">+ পণ্য তালিকায় যোগ করুন</button>
              <p className="text-xs leading-5 text-slate-500">এটি preview: এই তালিকা এখনো ডেটাবেসে সংরক্ষণ হয় না।</p>
            </form>
          </div>

          <div className="min-w-0 rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-black">পণ্যের তালিকা</h2><p className="mt-1 text-sm text-slate-500">এই preview-তে দেখানো পণ্য</p></div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">{money(products.length)}টি</span>
            </div>
            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <article key={product.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-extrabold text-slate-900">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.farmer}</p>
                    <p className="mt-2 text-sm font-bold text-emerald-900">৳{money(product.price)} <span className="font-normal text-slate-500">/ একক</span></p>
                    <p className="mt-1 text-xs text-slate-500">রিসেলার কমিশন {money(product.commission)}%</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Preview</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
          <div className="min-w-0 rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl" aria-hidden="true">🤝</span>
              <div><h2 className="text-lg font-black">রিসেলার পণ্য বোর্ড</h2><p className="mt-1 text-sm text-slate-500">পণ্য বেছে preview referral তৈরি করুন</p></div>
            </div>
            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <article key={product.id} className="rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><h3 className="break-words font-extrabold text-slate-900">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.farmer}</p><p className="mt-2 text-sm font-bold text-emerald-900">৳{money(product.price)} <span className="font-normal text-slate-500">/ একক</span></p><p className="mt-1 text-xs text-slate-500">সম্ভাব্য কমিশন {money(product.commission)}%</p></div>
                    <button type="button" onClick={() => getReferral(product)} className="min-h-11 shrink-0 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">রেফারেল তৈরি</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-200">রিসেলার সারাংশ · Preview</p>
            <h2 className="mt-3 text-3xl font-black">{money(totalPotential)}টি</h2><p className="mt-1 text-sm text-emerald-100/70">এই সেশনে তৈরি referral</p>
            {selected && (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-semibold text-emerald-100/70">নির্বাচিত পণ্য</p><p className="mt-1 break-words font-extrabold">{selected.name}</p>
                <p className="mt-3 text-sm text-emerald-100/80">কমিশন: {money(selected.commission)}%</p><p className="mt-1 text-sm text-emerald-100/80">Attribution window: ১৫ দিন</p>
                <p className="mt-3 text-xs text-emerald-100/60">রেফারেল কোড</p><code className="mt-1 block break-all rounded-lg bg-black/20 p-2 text-sm">{referrals[0]?.code}</code>
                <button type="button" onClick={() => { const code = referrals[0]?.code; if (code && typeof navigator !== "undefined" && navigator.clipboard) { void navigator.clipboard.writeText(code).then(() => setNotice("রেফারেল কোড কপি হয়েছে।")).catch(() => setNotice("কোডটি নির্বাচন করে কপি করুন।")); } }} className="mt-3 min-h-10 w-full rounded-lg border border-white/20 px-3 py-2 text-sm font-bold transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">কোড কপি করুন</button>
              </div>
            )}
            <p className="mt-5 rounded-xl bg-white/10 p-4 text-xs leading-5 text-emerald-100/70">এটি browser-side preview। প্রকৃত অর্ডার, ১৫ দিনের attribution ও commission payout-এর জন্য server-side verification আবশ্যক।</p>
          </aside>
        </div>
      )}
    </section>
  );
}
