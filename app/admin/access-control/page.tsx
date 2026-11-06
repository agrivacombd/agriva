import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/authz";
import { checkAdminPermission } from "@/lib/admin/permission-service";

type RoleRow = {
  id: string;
  role_key: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
};

const capabilityGroups: Record<string, string> = {
  "dashboard.read": "ড্যাশবোর্ড",
  "users.read": "ব্যবহারকারী দেখা",
  "users.verify": "ব্যবহারকারী যাচাই",
  "roles.grant": "Admin role পরিচালনা",
  "plant_market.moderate": "Plant Market moderation",
  "marketplace.moderate": "Marketplace moderation",
  "harvest.moderate": "ফসলের পোস্ট moderation",
  "transport.moderate": "পরিবহন যাচাই",
  "farms.manage": "Farm পরিচালনা",
  "payments.read": "পেমেন্ট দেখা",
  "payments.reconcile": "পেমেন্ট reconciliation",
  "commissions.approve": "কমিশন অনুমোদন",
  "payouts.approve": "পেআউট অনুমোদন",
  "payouts.complete": "পেআউট সম্পন্ন",
  "audit.read": "Audit log দেখা",
  "settings.manage": "সিস্টেম সেটিংস",
  "system.recovery": "System recovery",
};

export default async function AdminAccessControlPage() {
  const permission = await checkAdminPermission("roles.grant");
  if (!permission.allowed) {
    if (permission.reason === "unauthenticated") redirect("/login");
    redirect("/dashboard?notice=forbidden");
  }

  const { supabase } = await requireAdminPage("dashboard.read");
  const [rolesResult, permissionsResult, assignmentsResult] = await Promise.all([
    supabase.from("admin_roles").select("id,role_key,display_name,description,is_system").order("role_key"),
    supabase.from("admin_role_permissions").select("role_id,capability").order("capability"),
    supabase.from("admin_user_roles").select("id,user_id,role_id,scope_type,scope_id,granted_at,expires_at").order("granted_at", { ascending: false }),
  ]);

  const roles = (rolesResult.data ?? []) as RoleRow[];
  const permissions = permissionsResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const roleIds = new Set(roles.map((role) => role.id));
  const activeAssignments = assignments.filter((item) => roleIds.has(item.role_id) && (!item.expires_at || new Date(item.expires_at).getTime() > Date.now()));
  const userIds = [...new Set(activeAssignments.map((item) => item.user_id))];
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
    : { data: [], error: null };
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const hasError = Boolean(rolesResult.error || permissionsResult.error || assignmentsResult.error || profilesResult.error);
  const permissionsByRole = new Map<string, string[]>();
  for (const item of permissions) {
    permissionsByRole.set(item.role_id, [...(permissionsByRole.get(item.role_id) ?? []), item.capability]);
  }
  const rolesById = new Map(roles.map((role) => [role.id, role]));

  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Security & governance</p><h1 className="mt-2 text-2xl font-black">Admin Access Control</h1><p className="mt-1 text-sm text-emerald-100">কার কোন প্রশাসনিক ক্ষমতা আছে—এক জায়গায় পর্যালোচনা করুন।</p></div>
          <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">← Admin dashboard</Link>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Configured roles</p><p className="mt-2 text-3xl font-black">{hasError ? "—" : roles.length}</p></div>
          <div className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Active assignments</p><p className="mt-2 text-3xl font-black">{hasError ? "—" : activeAssignments.length}</p></div>
          <div className="rounded-2xl border border-[#dfe8dc] bg-white p-5"><p className="text-sm text-[#6b786d]">Granted capabilities</p><p className="mt-2 text-3xl font-black">{hasError ? "—" : permissions.length}</p></div>
        </section>

        {hasError || profilesResult.error ? <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Access-control তথ্য সম্পূর্ণভাবে লোড হয়নি। কোনো role বা permission পরিবর্তন করবেন না; database policy ও query error যাচাই করুন।</div> : null}

        <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-black">Role catalogue</h2><p className="mt-1 text-sm text-[#718072]">প্রতিটি role-এর অনুমোদিত capability ও system status</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">Read-only review</span></div>
          <div className="mt-4 space-y-4">
            {roles.map((role) => {
              const rolePermissions = permissionsByRole.get(role.id) ?? [];
              return <article key={role.id} className="rounded-xl border border-[#e4ebe1] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{role.display_name}</h3><p className="mt-1 text-xs text-[#758176]">{role.role_key} · {role.description ?? "No description"}</p></div><span className={role.is_system ? "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900" : "rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold text-[#28633c]"}>{role.is_system ? "System role" : "Custom role"}</span></div>
                <p className="mt-3 text-xs font-bold text-[#647366]">{rolePermissions.length} capabilities</p>
                <div className="mt-2 flex flex-wrap gap-2">{rolePermissions.map((capability) => <span key={capability} title={capability} className="rounded-lg bg-[#f3f7f1] px-2.5 py-1.5 text-xs text-[#315b3c]">{capabilityGroups[capability] ?? capability}</span>)}</div>
              </article>;
            })}
            {!hasError && roles.length === 0 ? <p className="rounded-xl bg-[#f7faf5] p-5 text-sm text-[#718072]">এখনো কোনো admin role configured নেই।</p> : null}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5">
          <h2 className="text-xl font-black">Active role assignments</h2>
          <p className="mt-1 text-sm text-[#718072]">মেয়াদোত্তীর্ণ assignment বাদ দিয়ে বর্তমান access দেখানো হচ্ছে।</p>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs text-[#6d7b6e]"><tr><th className="px-3 py-3">Admin</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Scope</th><th className="px-3 py-3">Granted</th><th className="px-3 py-3">Expires</th></tr></thead><tbody>{activeAssignments.map((assignment) => {
            const profile = profiles.get(assignment.user_id);
            const role = rolesById.get(assignment.role_id);
            return <tr key={assignment.id} className="border-t border-[#edf1ea]"><td className="px-3 py-3"><p className="font-semibold">{profile?.full_name || "Unnamed admin"}</p><p className="text-xs text-[#7b887d]">{assignment.user_id.slice(0, 8) + "…"}</p></td><td className="px-3 py-3 font-semibold">{role?.display_name ?? "Unknown role"}</td><td className="px-3 py-3">{assignment.scope_type}{assignment.scope_id ? " · " + assignment.scope_id.slice(0, 8) : ""}</td><td className="px-3 py-3">{new Date(assignment.granted_at).toLocaleDateString("en-GB")}</td><td className="px-3 py-3">{assignment.expires_at ? new Date(assignment.expires_at).toLocaleDateString("en-GB") : "No expiry"}</td></tr>;
          })}</tbody></table>{!hasError && !activeAssignments.length ? <p className="p-5 text-sm text-[#718072]">কোনো active role assignment নেই।</p> : null}</div>
        </section>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>নিরাপত্তা নোট:</strong> এই পেজটি বর্তমানে read-only। নিরাপদ grant/revoke workflow, privilege-escalation protection, expiry validation এবং audit RPC যাচাই না হওয়া পর্যন্ত এখান থেকে কাউকে নতুন admin access দেওয়া বা সরানো যাবে না। Finance approval ও payout completion আলাদা capability হিসেবেই থাকবে।</div>
      </div>
    </main>
  );
}
