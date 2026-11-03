import Link from "next/link";
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

export default async function AdminUsersPage({ searchParams }: { searchParams?: { notice?: string; q?: string; role?: string } }) {
  const { supabase } = await requireAdmin();
  const search = String(searchParams?.q ?? "").trim().slice(0, 80).replace(/[%_]/g, "");
  const roleFilter = ["farmer", "reseller", "buyer", "seller", "admin"].includes(searchParams?.role ?? "") ? searchParams?.role ?? "" : "";
  let usersQuery = supabase.from("profiles").select("id,full_name,phone,role,created_at");
  if (search) usersQuery = usersQuery.ilike("full_name", `%${search}%`);
  if (roleFilter) usersQuery = usersQuery.eq("role", roleFilter);
  const { data: users, error } = await usersQuery.order("created_at", { ascending: false }).limit(100);
  const notice: Record<string, string> = {
    saved: "ব্যবহারকারীর role আপডেট হয়েছে এবং audit log-এ সংরক্ষিত হয়েছে।",
    invalid: "ব্যবহারকারী ও role সঠিকভাবে নির্বাচন করুন।",
    self: "নিজের role পরিবর্তন করা যাবে না।",
    error: "Role পরিবর্তন করা যায়নি। Migration 024 ও admin permissions যাচাই করুন।",
  };
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">User management</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
      <div className="mt-7"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">People & access</p><h1 className="mt-2 text-3xl font-black">ব্যবহারকারী ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">ব্যবহারকারীর পরিচিতি দেখুন এবং Farmer/Reseller role পরিবর্তন করুন। নিরাপত্তার জন্য এই প্যানেল থেকে কাউকে Admin করা বা নিজের role পরিবর্তন করা যায় না।</p></div>
      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{notice[searchParams.notice] ?? "অপারেশন সম্পন্ন হয়েছে।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">ব্যবহারকারী তালিকা পড়া যায়নি। Migration 024 প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
      <form method="get" className="mt-6 grid gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_200px_auto_auto] sm:items-end">
        <label className="text-sm font-bold">নাম দিয়ে খুঁজুন<input name="q" type="search" maxLength={80} defaultValue={search} placeholder="ব্যবহারকারীর নাম..." className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
        <label className="text-sm font-bold">Role<select name="role" defaultValue={roleFilter} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 font-normal"><option value="">সব role</option><option value="farmer">Farmer</option><option value="reseller">Reseller</option><option value="buyer">Buyer</option><option value="seller">Seller</option><option value="admin">Admin</option></select></label>
        <button type="submit" className="min-h-11 rounded-xl bg-[#17452c] px-5 text-sm font-bold text-white">Filter</button>
        <Link href="/admin/users" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9e3d5] px-4 text-sm font-bold">Clear</Link>
      </form>
      <p className="mt-3 text-xs text-[#748074]">সর্বশেষ ১০০টি matching profile। Search ও role filter server-side; Admin role এই panel থেকে পরিবর্তন করা যায় না।</p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7ede4] px-5 py-4"><h2 className="text-lg font-black">ব্যবহারকারী</h2><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{error ? "—" : users?.length ?? 0} shown · max 100</span></div>
        {error ? <p role="alert" className="p-5 text-sm text-red-800">ব্যবহারকারী তালিকা পড়া যায়নি। Database permission বা profile schema যাচাই করুন।</p> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f7faf5] text-xs uppercase tracking-wide text-[#6d7b6e]"><tr><th className="px-5 py-3">ব্যবহারকারী</th><th className="px-5 py-3">ফোন</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">যোগদান</th><th className="px-5 py-3">পরিবর্তন</th></tr></thead><tbody>{(users ?? []).map(user => <tr key={user.id} className="border-t border-[#edf1ea]"><td className="px-5 py-4"><p className="font-bold">{user.full_name || "নাম দেওয়া হয়নি"}</p><p className="mt-1 text-xs text-[#7b887d]">ID: {user.id.slice(0,8)}…</p></td><td className="px-5 py-4">{user.phone || "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.role === "admin" ? "bg-amber-100 text-amber-900" : "bg-[#edf4e9] text-[#28623b]"}`}>{user.role}</span></td><td className="px-5 py-4">{new Date(user.created_at).toLocaleDateString("en-GB")}</td><td className="px-5 py-4">{user.role === "admin" ? <span className="text-xs text-[#7b887d]">Protected admin</span> : <form action={changeUserRole} className="flex items-center gap-2"><input type="hidden" name="userId" value={user.id}/><select name="role" defaultValue={user.role} aria-label={`Change role for ${user.full_name || user.id.slice(0,8)}`} className="min-h-10 rounded-lg border border-[#d9e3d5] bg-white px-2 py-2 text-xs"><option value="farmer">Farmer</option><option value="reseller">Reseller</option></select><button className="min-h-10 rounded-lg bg-[#17452c] px-3 py-2 text-xs font-bold text-white">Save</button></form>}</td></tr>)}</tbody></table></div>
          <div className="divide-y divide-[#edf1ea] md:hidden">{(users ?? []).map(user => <article key={user.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{user.full_name || "নাম দেওয়া হয়নি"}</p><p className="mt-1 text-xs text-[#7b887d]">ID: {user.id.slice(0,8)}… · {new Date(user.created_at).toLocaleDateString("en-GB")}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${user.role === "admin" ? "bg-amber-100 text-amber-900" : "bg-[#edf4e9] text-[#28623b]"}`}>{user.role}</span></div><p className="text-sm text-[#637266]">{user.phone || "ফোন দেওয়া হয়নি"}</p>{user.role === "admin" ? <p className="text-xs text-[#7b887d]">Protected admin account</p> : <form action={changeUserRole} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><input type="hidden" name="userId" value={user.id}/><select name="role" defaultValue={user.role} aria-label={`Change role for ${user.full_name || user.id.slice(0,8)}`} className="min-h-11 min-w-0 rounded-xl border border-[#d9e3d5] bg-white px-3 text-sm"><option value="farmer">Farmer</option><option value="reseller">Reseller</option></select><button className="min-h-11 rounded-xl bg-[#17452c] px-4 text-sm font-bold text-white">Save</button></form>}</article>)}</div>
          {!users?.length && <p className="p-8 text-sm text-[#6b786d]">এই filter-এ কোনো ব্যবহারকারী পাওয়া যায়নি।</p>}
        </>}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#7b887d]">Role পরিবর্তন হলে dashboard access পরিবর্তিত হতে পারে। Admin promotion আলাদা, নিরাপদ owner-controlled process দিয়ে করতে হবে।</p>
    </div>
  </main>;
}
