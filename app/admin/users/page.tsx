import {
  AdminEmptyState,
  AdminPage as AdminPageLayout,
  AdminPageHeader,
  AdminPanel,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminTableFrame,
} from "@/components/admin/ui/AdminPrimitives";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";

async function requireAdmin(capability: AdminCapability = "users.read") {
  const { supabase, user } = await requireAdminPage(capability);
  return { supabase, userId: user.id };
}

async function changeUserRole(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !["farmer", "reseller"].includes(role)) redirect("/admin/users?notice=invalid");
  const { supabase, userId: adminId } = await requireAdmin("roles.grant");
  if (userId === adminId) redirect("/admin/users?notice=self");
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect(error ? "/admin/users?notice=error" : "/admin/users?notice=saved");
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data: users, error } = await supabase.from("profiles")
    .select("id,full_name,phone,role,created_at")
    .order("created_at", { ascending: false }).limit(100);
  const notice: Record<string, string> = {
    saved: "ব্যবহারকারীর role আপডেট হয়েছে এবং audit log-এ সংরক্ষিত হয়েছে।",
    invalid: "ব্যবহারকারী ও role সঠিকভাবে নির্বাচন করুন।",
    self: "নিজের role পরিবর্তন করা যাবে না।",
    error: "Role পরিবর্তন করা যায়নি। Migration 024 ও admin permissions যাচাই করুন।",
  };
  return <AdminPageLayout className="mx-auto w-full max-w-7xl p-4 sm:p-6">
    <AdminPageHeader
      eyebrow="People & access"
      title="ব্যবহারকারী ব্যবস্থাপনা"
      description="ব্যবহারকারীর পরিচিতি দেখুন এবং Farmer/Reseller role পরিবর্তন করুন। নিরাপত্তার জন্য এই প্যানেল থেকে কাউকে Admin করা বা নিজের role পরিবর্তন করা যায় না।"
    />
    {params?.notice && <div role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${params.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{notice[params.notice] ?? "অপারেশন সম্পন্ন হয়েছে।"}</div>}
    {error && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">ব্যবহারকারী তালিকা পড়া যায়নি। Migration 024 ও admin permissions যাচাই করুন।</div>}
    <AdminPanel className="mt-6">
      <AdminSectionHeader
        title="সাম্প্রতিক ব্যবহারকারী"
        description="সর্বশেষ ১০০টি account · নতুন account আগে দেখানো হয়েছে"
        action={<AdminStatusBadge tone="neutral">{users?.length ?? 0} shown</AdminStatusBadge>}
      />
      {users?.length ? <AdminTableFrame>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead><tr><th className="px-4 py-3">ব্যবহারকারী</th><th className="px-4 py-3">ফোন</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">যোগদান</th><th className="px-4 py-3">পরিবর্তন</th></tr></thead>
          <tbody>{users.map(user => <tr key={user.id} className="border-t border-[var(--admin-border)]">
            <td className="px-4 py-4"><p className="font-bold text-[var(--admin-ink)]">{user.full_name || "নাম দেওয়া হয়নি"}</p><p className="mt-1 break-all font-mono text-[11px] text-[var(--admin-ink-muted)]">{user.id}</p></td>
            <td className="px-4 py-4">{user.phone || "—"}</td>
            <td className="px-4 py-4"><AdminStatusBadge tone={user.role === "admin" ? "warning" : "success"}>{user.role}</AdminStatusBadge></td>
            <td className="px-4 py-4 tabular-nums">{new Date(user.created_at).toLocaleDateString("en-GB")}</td>
            <td className="px-4 py-4">{user.role === "admin" ? <AdminStatusBadge tone="neutral">Protected admin</AdminStatusBadge> : <form action={changeUserRole} className="flex flex-wrap items-center gap-2"><input type="hidden" name="userId" value={user.id}/><label className="sr-only" htmlFor={`role-${user.id}`}>নতুন role</label><select id={`role-${user.id}`} name="role" defaultValue={user.role} className="admin-input min-h-10 rounded-lg px-3 text-xs"><option value="farmer">Farmer</option><option value="reseller">Reseller</option></select><button className="min-h-10 rounded-lg bg-[var(--admin-primary)] px-3 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)] focus-visible:ring-offset-2">Save</button></form>}</td>
          </tr>)}</tbody>
        </table>
      </AdminTableFrame> : !error ? <AdminEmptyState title="কোনো ব্যবহারকারী পাওয়া যায়নি" description="নতুন account তৈরি হলে এখানে দেখা যাবে।"/> : null}
    </AdminPanel>
    <p className="mt-4 text-xs leading-5 text-[var(--admin-ink-muted)]">Role পরিবর্তন হলে dashboard access পরিবর্তিত হতে পারে। Admin promotion আলাদা, নিরাপদ owner-controlled process দিয়ে করতে হবে।</p>
  </AdminPageLayout>;
}
