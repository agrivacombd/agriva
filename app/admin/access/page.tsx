import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorizePermission } from "@/lib/auth/server-authorization";

const STAFF_ROLES = [
  "operations",
  "product_moderator",
  "content_seo_manager",
  "marketing_manager",
  "finance_manager",
  "support_agent",
] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

async function requireAccessManager() {
  const auth = await authorizePermission("roles.assign_scoped");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/admin/access");
    redirect("/dashboard");
  }
  if (!auth.roles.includes("admin")) redirect("/dashboard");
  return auth;
}

async function updateStaffRole(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  const enabledRaw = String(formData.get("enabled") ?? "");
  if (!userId || !STAFF_ROLES.includes(role as StaffRole) || !["true", "false"].includes(enabledRaw)) {
    redirect("/admin/access?notice=invalid");
  }
  const auth = await requireAccessManager();
  const { error } = await auth.supabase.rpc("admin_set_staff_role", {
    p_user_id: userId,
    p_role: role,
    p_enabled: enabledRaw === "true",
  });
  revalidatePath("/admin/access");
  revalidatePath("/admin");
  redirect(error ? "/admin/access?notice=error" : "/admin/access?notice=saved");
}

type Profile = { id: string; full_name: string | null; role: string; created_at: string };
type Membership = { user_id: string; role: string };

export default async function StaffAccessPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const auth = await requireAccessManager();
  const { notice } = await searchParams;
  const { data: profiles, error: profilesError } = await auth.supabase
    .from("profiles")
    .select("id,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const profileRows = (profiles ?? []) as Profile[];
  const userIds = profileRows.map((profile) => profile.id);
  const { data: memberships, error: membershipsError } = userIds.length
    ? await auth.supabase.from("user_role_memberships").select("user_id,role").in("user_id", userIds)
    : { data: [], error: null };
  const memberRows = (memberships ?? []) as Membership[];
  const staffByUser = new Map<string, string[]>();
  for (const membership of memberRows) {
    if (!staffByUser.has(membership.user_id)) staffByUser.set(membership.user_id, []);
    staffByUser.get(membership.user_id)?.push(membership.role);
  }
  const notices: Record<string, string> = {
    saved: "Staff role assignment update হয়েছে এবং audit log-এ সংরক্ষিত হয়েছে।",
    error: "Role update করা যায়নি। Database migration ও admin permission যাচাই করুন।",
    invalid: "User ID বা staff role সঠিক নয়।",
  };
  const hasError = Boolean(profilesError || membershipsError);

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#123b27] p-6 text-white">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-100">AGRIVA • Access governance</p><h1 className="mt-2 text-3xl font-black">Staff Access & Roles</h1><p className="mt-2 max-w-2xl text-sm text-emerald-50">প্রয়োজন অনুযায়ী নির্দিষ্ট staff capability দিন। Super Admin role এই তালিকা থেকে grant করা যায় না।</p></div>
          <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold">← Super Admin</Link>
        </header>
        {notice && <p role="status" className={notice === "saved" ? "mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900" : "mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"}>{notices[notice] ?? "অপারেশন সম্পন্ন হয়নি।"}</p>}
        {hasError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Staff directory লোড করা যায়নি। Database permission ও migration যাচাই করুন; access list অসম্পূর্ণ হতে পারে।</p>}
        <div className="mt-7 rounded-2xl border border-[#e1e9df] bg-white p-5">
          <h2 className="text-lg font-black">Role boundaries</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{STAFF_ROLES.map((role) => <div key={role} className="rounded-xl bg-[#f5f7f2] p-3"><p className="font-bold">{role.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-[#647568]">{role === "operations" ? "Operational queues; no staff-role provisioning." : role === "product_moderator" ? "Review, approve, reject, or request product changes." : role === "content_seo_manager" ? "Editorial drafts and approved publishing workflows." : role === "marketing_manager" ? "Campaign tools and aggregated analytics." : role === "finance_manager" ? "Scoped finance review and payout workflow." : "Minimum necessary customer support access."}</p></div>)}</div>
        </div>
        <section className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">User directory</h2><p className="mt-1 text-sm text-[#647568]">সাম্প্রতিক সর্বোচ্চ ১০০টি profile। Role change শুধু server-side RPC দিয়ে হয় এবং audit log-এ লেখা হয়।</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold">{profileRows.length} users</span></div>
          <div className="mt-4 grid gap-4">
            {profileRows.filter((profile) => profile.id !== auth.user.id).map((profile) => {
              const assigned = new Set(staffByUser.get(profile.id) ?? []);
              return <article key={profile.id} className="rounded-2xl border border-[#e1e9df] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{profile.full_name?.trim() || "Unnamed user"}</h3><p className="mt-1 font-mono text-xs text-[#647568]">{profile.id}</p><p className="mt-1 text-xs text-[#647568]">Legacy role: {profile.role}</p></div><div className="flex flex-wrap gap-1.5">{[...assigned].filter((role) => STAFF_ROLES.includes(role as StaffRole)).map((role) => <span key={role} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">{role.replaceAll("_", " ")}</span>)}{![...assigned].some((role) => STAFF_ROLES.includes(role as StaffRole)) && <span className="rounded-full bg-[#f1f3ef] px-2.5 py-1 text-xs text-[#647568]">No scoped staff role</span>}</div></div>
                <form action={updateStaffRole} className="mt-4 flex flex-wrap items-end gap-2"><input type="hidden" name="userId" value={profile.id}/><label className="min-w-48 flex-1 text-xs font-bold text-[#647568]">Staff capability<select name="role" required className="mt-1 block w-full rounded-xl border bg-white px-3 py-3 text-sm font-normal text-[#17351f]">{STAFF_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label><button name="enabled" value="true" className="rounded-xl bg-[#17452c] px-4 py-3 text-sm font-bold text-white">Grant role</button><button name="enabled" value="false" className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-800">Revoke selected</button></form>
              </article>;
            })}
            {!hasError && profileRows.length <= 1 && <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-[#647568]">আর কোনো user profile পাওয়া যায়নি।</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
