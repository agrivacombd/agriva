import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEATURES = [
  { key: "seo_studio", label: "SEO Studio", description: "Seller-facing SEO title and description tools." },
  { key: "ai_seo", label: "AI SEO", description: "AI-assisted SEO suggestions for seller listings." },
  { key: "schema_settings", label: "Structured data settings", description: "Advanced schema/JSON-LD controls." },
  { key: "category_specific_fields", label: "Category-specific fields", description: "Optional fields based on product category." },
  { key: "advanced_options", label: "Advanced options", description: "Additional product configuration controls." },
  { key: "product_images", label: "Product images", description: "Seller image-upload controls (requires storage setup)." },
] as const;

async function authorize(canManage = false) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isSuperAdmin = user.app_metadata?.agriva_super_admin === true;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (isSuperAdmin) return { supabase, user, isSuperAdmin, canManage: true };
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: grant } = await supabase
    .from("admin_feature_permission_grants")
    .select("id")
    .eq("user_id", user.id)
    .eq("permission_key", "product_form_features.manage")
    .is("revoked_at", null)
    .maybeSingle();

  const canManageFeatures = Boolean(grant);
  if (canManage && !canManageFeatures) redirect("/admin");
  return { supabase, user, isSuperAdmin: false, canManage: canManageFeatures };
}

async function saveFeature(formData: FormData) {
  "use server";
  const key = String(formData.get("feature_key") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";
  if (!FEATURES.some((feature) => feature.key === key)) redirect("/admin/features?notice=invalid");
  const { supabase } = await authorize(true);
  const { error } = await supabase.from("product_form_feature_settings").update({ enabled }).eq("feature_key", key);
  revalidatePath("/admin/features");
  redirect(error ? "/admin/features?notice=error" : "/admin/features?notice=saved");
}

async function grantPermission(formData: FormData) {
  "use server";
  const targetUserId = String(formData.get("user_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId) || reason.length > 500) {
    redirect("/admin/features?notice=invalid");
  }
  const { supabase, user, isSuperAdmin } = await authorize();
  if (!isSuperAdmin) redirect("/admin");
  if (targetUserId === user.id) redirect("/admin/features?notice=self");
  const { data: target } = await supabase.from("profiles").select("role").eq("id", targetUserId).maybeSingle();
  if (target?.role !== "admin") redirect("/admin/features?notice=notadmin");
  const { error } = await supabase.from("admin_feature_permission_grants").insert({
    user_id: targetUserId,
    permission_key: "product_form_features.manage",
    granted_by: user.id,
    reason: reason || null,
  });
  revalidatePath("/admin/features");
  redirect(error ? "/admin/features?notice=granterror" : "/admin/features?notice=granted");
}

async function revokePermission(formData: FormData) {
  "use server";
  const grantId = String(formData.get("grant_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(grantId) || reason.length > 500) redirect("/admin/features?notice=invalid");
  const { supabase, user, isSuperAdmin } = await authorize();
  if (!isSuperAdmin) redirect("/admin");
  const { error } = await supabase.from("admin_feature_permission_grants").update({
    revoked_at: new Date().toISOString(),
    revoked_by: user.id,
    revoke_reason: reason || null,
  }).eq("id", grantId).is("revoked_at", null);
  revalidatePath("/admin/features");
  redirect(error ? "/admin/features?notice=revokeerror" : "/admin/features?notice=revoked");
}

export default async function AdminFeatureControlsPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const { supabase, isSuperAdmin, canManage } = await authorize();
  if (!canManage) redirect("/admin");

  const [{ data: settings, error: settingsError }, grantsResult] = await Promise.all([
    supabase.from("product_form_feature_settings").select("feature_key,enabled,updated_at").order("feature_key"),
    isSuperAdmin
      ? supabase.from("admin_feature_permission_grants").select("id,user_id,permission_key,reason,created_at").is("revoked_at", null).order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
  ]);

  const settingMap = new Map((settings ?? []).map((setting) => [setting.feature_key, setting]));
  const noticeText: Record<string, string> = {
    saved: "Feature setting saved.",
    granted: "Feature-management permission granted.",
    revoked: "Permission revoked. It takes effect on the next server authorization check.",
    invalid: "Please check the submitted values.",
    self: "You cannot grant this permission to yourself.",
    notadmin: "The target account must have the Admin role.",
    error: "Could not save the setting. Check migration status and permissions.",
    granterror: "Could not grant permission. It may already be active.",
    revokeerror: "Could not revoke the permission.",
  };

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-5 py-10 text-[#17351f] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA administration</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Product Form Feature Controls</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          These controls govern seller-facing feature visibility. They do not replace server-side authorization.
          Features remain disabled by default. Seller group targeting and image storage must be configured separately before launch.
        </p>
        {params?.notice && <p role="status" className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold">{noticeText[params.notice] ?? "Request completed."}</p>}
        {settingsError && <p className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700">Feature settings are unavailable. Apply the reviewed migration before using these controls.</p>}

        <section className="mt-7 space-y-3">
          {FEATURES.map((feature) => {
            const enabled = settingMap.get(feature.key)?.enabled === true;
            return (
              <article key={feature.key} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold">{feature.label}</h2>
                    <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                    <p className="mt-2 text-xs text-slate-500">Current state: {enabled ? "Enabled" : "Disabled"}</p>
                  </div>
                  <form action={saveFeature} className="flex items-center gap-3">
                    <input type="hidden" name="feature_key" value={feature.key} />
                    <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                    <button disabled={!settingMap.has(feature.key)} type="submit" className="rounded-xl bg-[#17351f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                      {enabled ? "Disable" : "Enable"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>

        {isSuperAdmin && (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-black">Delegate feature visibility management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Only a trusted Super Admin can grant or revoke this narrow permission. It does not grant product approval, category management, user-role management, or wholesale-price access.</p>
            <form action={grantPermission} className="mt-5 grid gap-3">
              <label className="text-sm font-bold" htmlFor="feature-admin-user">Admin profile UUID</label>
              <input id="feature-admin-user" name="user_id" required className="rounded-xl border border-slate-300 px-4 py-3" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              <label className="text-sm font-bold" htmlFor="feature-grant-reason">Reason (optional)</label>
              <input id="feature-grant-reason" name="reason" maxLength={500} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Why this permission is needed" />
              <button className="justify-self-start rounded-xl bg-[#17351f] px-4 py-3 text-sm font-bold text-white">Grant permission</button>
            </form>

            <h3 className="mt-7 font-bold">Active grants</h3>
            {grantsResult.error && <p className="mt-2 text-sm text-red-700">Could not load grants; verify migration and permissions.</p>}
            <div className="mt-3 space-y-3">
              {(grantsResult.data ?? []).map((grant) => (
                <div key={grant.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="break-all text-sm font-semibold">{grant.user_id}</p>
                  {grant.reason && <p className="mt-1 text-sm text-slate-600">{grant.reason}</p>}
                  <form action={revokePermission} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="grant_id" value={grant.id} />
                    <input name="reason" maxLength={500} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Revocation reason (optional)" />
                    <button className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700">Revoke</button>
                  </form>
                </div>
              ))}
              {!grantsResult.error && (grantsResult.data ?? []).length === 0 && <p className="text-sm text-slate-500">No active grants.</p>}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs leading-5 text-slate-500">
          Super Admin access requires the trusted Supabase Auth app_metadata claim <code>agriva_super_admin: true</code>. Do not set this in user-editable metadata. If no trusted claim is configured, access is denied by default.
        </p>
      </div>
    </main>
  );
}
