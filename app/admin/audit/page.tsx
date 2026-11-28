import {
  AdminEmptyState,
  AdminPage as AdminPageLayout,
  AdminPageHeader,
  AdminPanel,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminTableFrame,
} from "@/components/admin/ui/AdminPrimitives";
import { requireAdminPage } from "@/lib/admin/authz";

export default async function AdminAuditPage() {
  const { supabase } = await requireAdminPage("audit.read");

  const { data: entries, error } = await supabase.from("admin_audit_log")
    .select("id,admin_id,action,entity_type,entity_id,metadata,created_at")
    .order("created_at", { ascending: false }).limit(100);

  return <AdminPageLayout className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-7xl p-4 sm:p-6">
    <AdminPageHeader
      eyebrow="Security & accountability"
      title="Admin activity log"
      description="সাম্প্রতিক privileged পরিবর্তন, সংশ্লিষ্ট entity এবং audit metadata পর্যালোচনা করুন। তালিকাটি সর্বশেষ ১০০টি event দেখায়।"
    />
    {error && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Audit log পড়া যায়নি। Database access ও migration status যাচাই করুন।</div>}
    <AdminPanel className="mt-6">
      <AdminSectionHeader
        title="সাম্প্রতিক কার্যক্রম"
        description="নতুন event আগে · read-only audit history"
        action={<AdminStatusBadge tone="neutral">{entries?.length ?? 0} shown · max 100</AdminStatusBadge>}
      />
      {entries?.length ? <AdminTableFrame>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead><tr><th className="px-4 py-3">সময়</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Admin ID</th><th className="px-4 py-3">Details</th></tr></thead>
          <tbody>{entries.map(entry => <tr key={entry.id} className="border-t border-[var(--admin-border)] align-top">
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{new Date(entry.created_at).toLocaleString("en-GB")}</td>
            <td className="px-4 py-4"><AdminStatusBadge tone="info">{entry.action}</AdminStatusBadge></td>
            <td className="px-4 py-4"><p className="font-bold text-[var(--admin-ink)]">{entry.entity_type}</p><p className="mt-1 break-all font-mono text-xs text-[var(--admin-ink-muted)]">{entry.entity_id ?? "—"}</p></td>
            <td className="px-4 py-4 break-all font-mono text-xs">{entry.admin_id ?? "system / unavailable"}</td>
            <td className="max-w-md px-4 py-4"><pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--admin-surface-muted)] p-3 text-xs text-[var(--admin-ink-muted)]">{JSON.stringify(entry.metadata ?? {}, null, 2)}</pre></td>
          </tr>)}</tbody>
        </table>
      </AdminTableFrame> : !error ? <AdminEmptyState title="এখনো কোনো admin action log হয়নি" description="নতুন privileged action সম্পন্ন হলে তার audit event এখানে দেখা যাবে।"/> : null}
    </AdminPanel>
  </AdminPageLayout>;
}
