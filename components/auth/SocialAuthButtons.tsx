"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeAuthNextPath } from "@/lib/auth/safe-next";

type SocialProvider = "google" | "facebook";

export default function SocialAuthButtons({
  returnTo,
  compact = false,
  english = false,
}: {
  returnTo?: string | null;
  compact?: boolean;
  english?: boolean;
}) {
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [message, setMessage] = useState("");

  async function continueWith(provider: SocialProvider) {
    if (pending) return;
    setPending(provider);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeAuthNextPath(returnTo, "/dashboard"));

      // OAuth provider redirects back to the same site after Supabase exchanges
      // the authorization code. No provider client secret is exposed in the browser.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callback.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        const unavailable = /provider.+(not.enabled|disabled)|unsupported.provider|not configured/i.test(error?.message || "");
        setMessage(unavailable
          ? (english ? "This sign-in provider is not yet configured. Please use email or phone." : "এই লগইন মাধ্যমটি এখনো চালু করা হয়নি। ইমেইল বা মোবাইল ব্যবহার করুন।")
          : (english ? "Unable to start social sign-in. Please try again." : "সোশ্যাল লগইন শুরু করা যাচ্ছে না। আবার চেষ্টা করুন।"));
        return;
      }
      window.location.assign(data.url);
    } catch {
      setMessage(english
        ? "Authentication is temporarily unavailable. Please try email or phone."
        : "লগইন সেবায় সমস্যা হয়েছে। ইমেইল বা মোবাইল দিয়ে চেষ্টা করুন।");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "mt-5 space-y-3"}>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => void continueWith("google")} disabled={Boolean(pending)}
          aria-label={english ? "Continue with Google" : "Google (Gmail) দিয়ে লগইন করুন"}
          className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-wait disabled:opacity-60">
          <span aria-hidden="true" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-100 font-black text-[#4285F4]">G</span>
          {pending === "google" ? (english ? "Connecting…" : "সংযোগ হচ্ছে…") : (english ? "Continue with Google" : "Google দিয়ে লগইন")}
        </button>
        <button type="button" onClick={() => void continueWith("facebook")} disabled={Boolean(pending)}
          aria-label={english ? "Continue with Facebook" : "Facebook দিয়ে লগইন করুন"}
          className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-wait disabled:opacity-60">
          <span aria-hidden="true" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-lg font-black text-white">f</span>
          {pending === "facebook" ? (english ? "Connecting…" : "সংযোগ হচ্ছে…") : (english ? "Continue with Facebook" : "Facebook দিয়ে লগইন")}
        </button>
      </div>
      {message && <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">{message}</p>}
    </div>
  );
}
