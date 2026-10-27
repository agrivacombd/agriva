"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Globe2, Leaf, LoaderCircle, Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import MobileDashboardNav from "@/components/MobileDashboardNav";

const roles = [
  { id: "farmer", bn: "কৃষক", en: "Farmer", description: "খামার ও ফসল পরিচালনা" },
  { id: "buyer", bn: "ক্রেতা", en: "Buyer", description: "কৃষিপণ্য খুঁজুন" },
  { id: "seller", bn: "বিক্রেতা / ডিলার", en: "Seller / Dealer", description: "পণ্য ও কৃষি উপকরণ বিক্রি" },
  { id: "transport", bn: "পরিবহন সেবাদাতা", en: "Transport provider", description: "কৃষিপণ্য পরিবহন" },
  { id: "job_seeker", bn: "চাকরিপ্রার্থী", en: "Job seeker", description: "চাকরির সুযোগ খুঁজুন" },
  { id: "employer", bn: "নিয়োগদাতা", en: "Employer", description: "চাকরি প্রকাশ করুন" },
  { id: "student", bn: "কৃষি শিক্ষার্থী", en: "Agriculture student", description: "কৃষি বিষয়ে শিখুন" },
  { id: "agriculturist", bn: "কৃষিবিদ / বিশেষজ্ঞ", en: "Agriculture expert", description: "কৃষি জ্ঞান ও পরামর্শ" },
  { id: "rooftop_gardener", bn: "ছাদবাগানকারী", en: "Rooftop gardener", description: "নিজের বাগান পরিচালনা" },
];

export default function ProfilePage() {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          window.location.href = "/login?next=/profile";
          return;
        }
        const [{ data: profile }, { data, error: rolesError }] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("user_role_memberships").select("role").eq("user_id", user.id),
        ]);
        if (rolesError) throw rolesError;
        const membershipRoles = (data ?? [])
          .map((item) => item.role)
          .filter((role) => roles.some((candidate) => candidate.id === role));
        const legacyRoleAliases: Record<string, string> = {
          reseller: "seller",
          transport_provider: "transport",
          agronomist: "agriculturist",
          gardener: "rooftop_gardener",
        };
        const rawLegacyRole = typeof profile?.role === "string" ? profile.role : "farmer";
        const normalizedLegacyRole = legacyRoleAliases[rawLegacyRole] ?? rawLegacyRole;
        const legacyRole = roles.some((candidate) => candidate.id === normalizedLegacyRole)
          ? normalizedLegacyRole
          : "farmer";
        if (active) setSelected(Array.from(new Set(membershipRoles.length ? membershipRoles : [legacyRole])));
      } catch (cause: unknown) {
        console.error("Profile role load failed", cause);
        const errorCode =
          typeof cause === "object" && cause !== null && "code" in cause &&
          typeof (cause as { code?: unknown }).code === "string"
            ? (cause as { code: string }).code
            : "UNKNOWN";
        if (active) {
          setError(true);
          setMessage(language === "bn"
            ? `ভূমিকা লোড করা যায়নি (ত্রুটি কোড: ${errorCode})। বিস্তারিত জানতে browser console দেখুন।`
            : `Could not load your roles (error code: ${errorCode}). Check the browser console for details.`);
        }
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => { active = false; };
  }, [language]);

  function toggle(role: string) {
    setSelected((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
    setMessage("");
  }

  async function save() {
    if (selected.length === 0) {
      setError(true);
      setMessage(language === "bn" ? "কমপক্ষে একটি ভূমিকা নির্বাচন করুন।" : "Choose at least one role.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: saveError } = await supabase.rpc("update_my_role_memberships", { p_roles: selected });
      if (saveError) throw saveError;
      setError(false);
      setMessage(language === "bn" ? "আপনার ভূমিকা সফলভাবে আপডেট হয়েছে।" : "Your roles have been updated.");
    } catch (cause: unknown) {
      // Keep the full error in the browser console for diagnosis; show only the
      // stable Supabase/Postgres error code in the UI (never expose DB details).
      console.error("Profile role update failed", cause);
      const errorCode =
        typeof cause === "object" && cause !== null && "code" in cause &&
        typeof (cause as { code?: unknown }).code === "string"
          ? (cause as { code: string }).code
          : "UNKNOWN";
      setError(true);
      setMessage(language === "bn"
        ? `ভূমিকা আপডেট করা যায়নি (ত্রুটি কোড: ${errorCode})। বিস্তারিত জানতে browser console দেখুন।`
        : `Could not update roles (error code: ${errorCode}). Check the browser console for details.`);
    } finally {
      setSaving(false);
    }
  }

  const t = language === "bn"
    ? { eyebrow: "প্রোফাইল সেটিংস", title: "আপনার ভূমিকা পরিচালনা করুন", subtitle: "একটি account-এ একাধিক ভূমিকা রাখতে পারেন। যেগুলো আপনার জন্য প্রযোজ্য সেগুলো নির্বাচন করুন।", selected: "নির্বাচিত", save: "পরিবর্তন সংরক্ষণ করুন", loading: "ভূমিকা লোড হচ্ছে…" }
    : { eyebrow: "Profile settings", title: "Manage your roles", subtitle: "You can have multiple roles in one account. Select the roles that apply to you.", selected: "selected", save: "Save changes", loading: "Loading roles…" };

  return (
    <main className="min-h-screen bg-[#f5f8f2] pb-28 text-[#173b2d] md:pb-0">
      <header className="border-b border-[#e1e9df] bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"><Link href="/dashboard" className="flex items-center gap-2 text-xl font-black"><Leaf className="text-[#126b4f]" /> AGRIVA<span className="text-[#c59c3b]">.</span></Link><button type="button" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} className="inline-flex items-center gap-2 rounded-full border border-[#dce6da] px-3 py-2 text-sm font-semibold"><Globe2 size={16} />{language === "bn" ? "English" : "বাংলা"}</button></div></header>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#52705d] hover:text-[#126b4f]"><ArrowLeft size={16} />{language === "bn" ? "ড্যাশবোর্ডে ফিরুন" : "Back to dashboard"}</Link>
        <div className="mt-6 rounded-[2rem] border border-[#e1e9df] bg-white p-5 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a67f25]">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#637568]">{t.subtitle}</p>
          <div className="mt-5 inline-flex rounded-full bg-[#eaf4eb] px-3 py-1.5 text-xs font-bold text-[#26734d]">{selected.length} {t.selected}</div>
          {busy ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />{t.loading}</div> : <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => {
                const active = selected.includes(role.id);
                return <button type="button" key={role.id} aria-pressed={active} onClick={() => toggle(role.id)} className={`flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#167453]/15 ${active ? "border-[#167453] bg-[#eef7ef]" : "border-slate-200 hover:border-[#a8c9aa]"}`}>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${active ? "border-[#167453] bg-[#167453] text-white" : "border-slate-300"}`}>{active && <Check size={15} />}</span>
                  <span><span className="block font-bold">{language === "bn" ? role.bn : role.en}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{role.description}</span></span>
                </button>;
              })}
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">{language === "bn" ? "ভূমিকা নির্বাচন করলেই verified badge বা বিশেষ অনুমতি পাওয়া যায় না।" : "Selecting a role does not grant a verified badge or privileged access."}</p>
            <button type="button" onClick={save} disabled={saving} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-3 font-bold text-white hover:bg-[#0b563e] disabled:opacity-60 sm:w-auto">{saving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{t.save}</button>
            {message && <p role="status" aria-live="polite" className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message}</p>}
          </>}
        </div>
      </section>
      <MobileDashboardNav active="profile" />
    </main>
  );
}
