"use client";
import { useCallback, useEffect, useState } from "react";

type Market = "marketplace" | "plant-market";
type Permission = { user_id: string; scope_id: string | null; scope_type: string; granted_at: string; expires_at: string | null; reason: string | null };
const itemKey = (item: Permission) => item.user_id + ":" + (item.scope_id || "global");

export default function SellerPermissionManager() {
  const [market, setMarket] = useState<Market>("marketplace");
  const [items, setItems] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/seller-permissions/${market}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Permission তালিকা লোড করা যায়নি।");
      setItems(data.permissions || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => { void load(); }, [load]);

  async function revoke(item: Permission) {
    if (reason.trim().length < 10 || reason.trim().length > 500) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/seller-permissions/${market}/${item.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope_id: item.scope_id, reason: reason.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Permission বাতিল করা যায়নি।");
      setItems(current => current.filter(x => itemKey(x) !== itemKey(item)));
      setConfirming(null);
      setReason("");
      setMessage("নির্বাচিত module-এর access বাতিল হয়েছে; কারণ audit log-এ সংরক্ষিত হয়েছে।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return <section className="mt-10">
    <h2 className="text-2xl font-black">Seller Module Access</h2>
    <p className="mt-2 text-sm text-slate-600">Permission existing user_module_grants থেকে পড়া হয়। Marketplace grant organization-scoped, Plant Market grant global-scoped।</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => { setMarket("marketplace"); setConfirming(null); }} className={market === "marketplace" ? "rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white" : "rounded-xl border bg-white px-4 py-3 text-sm font-bold"}>Marketplace</button>
      <button type="button" onClick={() => { setMarket("plant-market"); setConfirming(null); }} className={market === "plant-market" ? "rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white" : "rounded-xl border bg-white px-4 py-3 text-sm font-bold"}>Plant Market</button>
      <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border bg-white px-4 py-3 text-sm font-bold">রিফ্রেশ</button>
    </div>
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
    {loading ? <p className="mt-5 text-sm text-slate-600">লোড হচ্ছে…</p> : items.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">এই মার্কেটে কোনো active create grant নেই।</p> :
      <div className="mt-5 space-y-2">
        {items.map(item => {
          const key = itemKey(item);
          return <article key={key} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-bold">{item.user_id}</p><p className="mt-1 text-xs text-slate-500">{item.scope_type === "organization" ? "Organization: " + item.scope_id : "Global Plant Market access"} · {new Date(item.granted_at).toLocaleString("bn-BD")}</p>{item.expires_at && <p className="mt-1 text-xs text-slate-500">মেয়াদ: {new Date(item.expires_at).toLocaleDateString("bn-BD")}</p>}</div>
              <button type="button" disabled={loading} onClick={() => { setConfirming(key); setReason(""); }} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-800 disabled:opacity-50">এই মার্কেটের Permission বাতিল</button>
            </div>
            {confirming === key && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <label className="block text-sm font-semibold text-red-950">Permission বাতিলের কারণ (১০–৫০০ অক্ষর)
                <textarea value={reason} onChange={event => setReason(event.target.value)} minLength={10} maxLength={500} rows={3} className="mt-2 w-full rounded-lg border border-red-200 bg-white p-3 text-sm text-slate-900" placeholder="কেন এই seller-এর access বাতিল করা হচ্ছে তা লিখুন" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={loading || reason.trim().length < 10} onClick={() => void revoke(item)} className="rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">কারণসহ বাতিল নিশ্চিত করুন</button>
                <button type="button" disabled={loading} onClick={() => { setConfirming(null); setReason(""); }} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-900">বাতিল করুন</button>
              </div>
            </div>}
          </article>;
        })}
      </div>}
  </section>;
}
