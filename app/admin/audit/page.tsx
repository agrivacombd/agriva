import { requireAdminPage } from "@/lib/admin/authz";

export default async function AdminAuditPage() {
  const { supabase } = await requireAdminPage("audit.read");

  const { data: entries, error } = await supabase.from("admin_audit_log")
    .select("id,admin_id,action,entity_type,entity_id,metadata,created_at")
    .order("created_at", { ascending: false }).limit(100);

  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white sm:p-8"><div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5"/><div className="relative"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · SYSTEM & SECURITY</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Admin activity log</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">বর্তমানে সীমিত কিছু admin mutation-এর audit trail দেখানো হয়; সব sensitive action-এর coverage নিশ্চিত নয়।</p></div></header>
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Audit log পড়া যায়নি। Migration 009 এবং 024 প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#e7ede4] px-5 py-4"><h2 className="font-black">সাম্প্রতিক কার্যক্রম</h2><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{entries?.length ?? 0} shown · max 100</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs uppercase tracking-wide text-[#6d7b6e]"><tr><th className="px-5 py-3">সময়</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Entity</th><th className="px-5 py-3">Admin ID</th><th className="px-5 py-3">Details</th></tr></thead><tbody>{(entries ?? []).map(entry => <tr key={entry.id} className="border-t border-[#edf1ea] align-top"><td className="whitespace-nowrap px-5 py-4">{new Date(entry.created_at).toLocaleString("en-GB")}</td><td className="px-5 py-4"><span className="rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold">{entry.action}</span></td><td className="px-5 py-4"><p className="font-bold">{entry.entity_type}</p><p className="mt-1 text-xs text-[#7b887d]">{entry.entity_id ?? "—"}</p></td><td className="px-5 py-4 text-xs">{entry.admin_id ?? "system / unavailable"}</td><td className="max-w-sm px-5 py-4"><pre className="whitespace-pre-wrap break-words text-xs text-[#536356]">{JSON.stringify(entry.metadata ?? {}, null, 2)}</pre></td></tr>)}</tbody></table>{!entries?.length && !error && <p className="p-8 text-sm text-[#6b786d]">এখনো কোনো admin action log হয়নি।</p>}</div>
      </div>
    </div>
  </main>;
}
