import Link from "next/link";
import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

export default async function AdminAuditPage() {
  const auth = await authorizePermission("audit.read");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/admin/audit");
    redirect("/dashboard");
  }

  const { data: entries, error } = await auth.supabase.from("admin_audit_log")
    .select("id,admin_id,action,entity_type,entity_id,metadata,created_at")
    .order("created_at", { ascending: false }).limit(100);

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Security & accountability</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
      <p className="mt-7 text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Audit trail</p><h1 className="mt-2 text-3xl font-black">Admin activity log</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">সুপার অ্যাডমিনের গুরুত্বপূর্ণ পরিবর্তনগুলো এখানে দেখা যাবে। আপাতত পণ্য আপডেট ও ব্যবহারকারীর role পরিবর্তন রেকর্ড হয়।</p>
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Audit log পড়া যায়নি। Migration 009 এবং 024 প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#e7ede4] px-5 py-4"><h2 className="font-black">সাম্প্রতিক কার্যক্রম</h2><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{entries?.length ?? 0} shown · max 100</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs uppercase tracking-wide text-[#6d7b6e]"><tr><th className="px-5 py-3">সময়</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Entity</th><th className="px-5 py-3">Admin ID</th><th className="px-5 py-3">Details</th></tr></thead><tbody>{(entries ?? []).map(entry => <tr key={entry.id} className="border-t border-[#edf1ea] align-top"><td className="whitespace-nowrap px-5 py-4">{new Date(entry.created_at).toLocaleString("en-GB")}</td><td className="px-5 py-4"><span className="rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold">{entry.action}</span></td><td className="px-5 py-4"><p className="font-bold">{entry.entity_type}</p><p className="mt-1 text-xs text-[#7b887d]">{entry.entity_id ?? "—"}</p></td><td className="px-5 py-4 text-xs">{entry.admin_id ?? "system / unavailable"}</td><td className="max-w-sm px-5 py-4"><pre className="whitespace-pre-wrap break-words text-xs text-[#536356]">{JSON.stringify(entry.metadata ?? {}, null, 2)}</pre></td></tr>)}</tbody></table>{!entries?.length && !error && <p className="p-8 text-sm text-[#6b786d]">এখনো কোনো admin action log হয়নি।</p>}</div>
      </div>
    </div>
  </main>;
}
