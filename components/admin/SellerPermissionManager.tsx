"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminNotice,
  AdminPanel,
  AdminSectionHeader,
  AdminStatusBadge,
} from "@/components/admin/ui/AdminPrimitives";

type Market = "marketplace" | "plant-market";
type Permission = {
  user_id: string;
  scope_id: string | null;
  scope_type: string;
  granted_at: string;
  expires_at: string | null;
  reason: string | null;
};
type Feedback = { tone: "success" | "error"; text: string } | null;
const itemKey = (item: Permission) => item.user_id + ":" + (item.scope_id || "global");

export default function SellerPermissionManager() {
  const [market, setMarket] = useState<Market>("marketplace");
  const [items, setItems] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setLoadFailed(false);
    try {
      const response = await fetch(`/api/admin/seller-permissions/${market}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Permission তালিকা লোড করা যায়নি।");
      setItems(Array.isArray(data.permissions) ? data.permissions : []);
    } catch (error) {
      setItems([]);
      setLoadFailed(true);
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে।" });
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => { void load(); }, [load]);

  async function revoke(item: Permission) {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 500) return;
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/seller-permissions/${market}/${item.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope_id: item.scope_id, reason: trimmedReason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Permission বাতিল করা যায়নি।");
      setItems(current => current.filter(candidate => itemKey(candidate) !== itemKey(item)));
      setConfirming(null);
      setReason("");
      setFeedback({ tone: "success", text: "নির্বাচিত module-এর access বাতিল হয়েছে; কারণ audit log-এ সংরক্ষিত হয়েছে।" });
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "নেটওয়ার্ক সমস্যা হয়েছে।" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPanel className="mt-8">
      <AdminSectionHeader
        title="Seller Module Access"
        description="Active create grants · Marketplace organization-scoped · Plant Market global-scoped"
        action={<AdminStatusBadge tone="neutral">{items.length} active grants</AdminStatusBadge>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={market === "marketplace"} onClick={() => { setMarket("marketplace"); setConfirming(null); setReason(""); }} className={market === "marketplace" ? "min-h-10 rounded-lg bg-[var(--admin-primary)] px-4 text-sm font-bold text-white" : "min-h-10 rounded-lg border border-[var(--admin-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--admin-ink)]"}>Marketplace</button>
        <button type="button" aria-pressed={market === "plant-market"} onClick={() => { setMarket("plant-market"); setConfirming(null); setReason(""); }} className={market === "plant-market" ? "min-h-10 rounded-lg bg-[var(--admin-primary)] px-4 text-sm font-bold text-white" : "min-h-10 rounded-lg border border-[var(--admin-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--admin-ink)]"}>Plant Market</button>
        <button type="button" onClick={() => void load()} disabled={loading} className="min-h-10 rounded-lg border border-[var(--admin-border-strong)] bg-white px-4 text-sm font-semibold disabled:opacity-50">Refresh</button>
      </div>

      {feedback && <div className="mb-4"><AdminNotice tone={feedback.tone === "success" ? "success" : "danger"}>{feedback.text}</AdminNotice></div>}
      {loading && <AdminLoadingState label="Seller permission records লোড হচ্ছে…"/>}
      {!loading && loadFailed && <AdminErrorState title="Permission তালিকা লোড করা যায়নি" description="Authorization service, API response এবং database access যাচাই করুন।" action={<button type="button" onClick={() => void load()} className="min-h-10 rounded-lg border border-rose-300 bg-white px-4 text-sm font-bold text-rose-900">আবার চেষ্টা করুন</button>}/>}
      {!loading && !loadFailed && items.length === 0 && <AdminEmptyState title="কোনো active create grant নেই" description="এই module-এ বর্তমানে revoke করার মতো active seller permission পাওয়া যায়নি।"/>}

      {!loading && !loadFailed && items.length > 0 && <div className="space-y-3">
        {items.map(item => {
          const key = itemKey(item);
          return <article key={key} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all font-mono text-sm font-bold text-[var(--admin-ink)]">{item.user_id}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <AdminStatusBadge tone="success">Active · create</AdminStatusBadge>
                  <AdminStatusBadge tone="neutral">{item.scope_type === "organization" ? "Organization scope" : "Global scope"}</AdminStatusBadge>
                </div>
                <p className="mt-2 break-all text-xs text-[var(--admin-ink-muted)]">{item.scope_id ? `Scope: ${item.scope_id} · ` : ""}Granted {new Date(item.granted_at).toLocaleString("en-GB")}</p>
                {item.expires_at && <p className="mt-1 text-xs text-[var(--admin-ink-muted)]">Expires {new Date(item.expires_at).toLocaleString("en-GB")}</p>}
                {item.reason && <p className="mt-2 text-xs text-[var(--admin-ink-muted)]">Grant reason: {item.reason}</p>}
              </div>
              <button type="button" disabled={loading} onClick={() => { setConfirming(key); setReason(""); }} className="min-h-10 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-800 hover:bg-rose-50 disabled:opacity-50">এই মার্কেটের Permission বাতিল</button>
            </div>
            {confirming === key && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="font-bold text-rose-950">এই seller-এর {market === "marketplace" ? "Marketplace" : "Plant Market"} access বাতিল করবেন?</p>
              <p className="mt-1 text-xs leading-5 text-rose-800">শুধু নির্বাচিত module ও scope-এর grant বাতিল হবে। অন্য module-এর access পরিবর্তন হবে না। এই action audit log-এ রেকর্ড হবে।</p>
              <label className="mt-3 block text-sm font-semibold text-rose-950">Permission বাতিলের কারণ (১০–৫০০ অক্ষর)
                <textarea value={reason} onChange={event => setReason(event.target.value)} minLength={10} maxLength={500} rows={3} className="mt-2 w-full rounded-lg border border-rose-200 bg-white p-3 text-sm text-slate-900" placeholder="কেন এই seller-এর access বাতিল করা হচ্ছে তা লিখুন"/>
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={loading || reason.trim().length < 10} onClick={() => void revoke(item)} className="min-h-10 rounded-lg bg-rose-800 px-4 text-sm font-bold text-white disabled:opacity-50">কারণসহ বাতিল নিশ্চিত করুন</button>
                <button type="button" disabled={loading} onClick={() => { setConfirming(null); setReason(""); }} className="min-h-10 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-900">Cancel</button>
              </div>
            </div>}
          </article>;
        })}
      </div>}
    </AdminPanel>
  );
}
