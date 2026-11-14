"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, X } from "lucide-react";
import SignupExperience from "@/components/auth/SignupExperience";
import PhoneOtpAuth from "@/components/auth/PhoneOtpAuth";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { safeAuthNextPath } from "@/lib/auth/safe-next";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function MarketplaceAuthModal({
  returnTo, onClose,
}: {
  returnTo: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  function completeAuth() {
    // Full navigation refreshes the Supabase cookie-authenticated page and
    // processes the pending cart intent once on the product page.
    window.location.assign(returnTo);
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError(signInError.message || "লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড যাচাই করুন।");
        return;
      }
      completeAuth();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার লগইন করুন।");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    closeRef.current?.focus();
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab") return;
      const dialog = closeRef.current?.closest('[role="dialog"]');
      if (!dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )).filter(item => item.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const switchMode = () => { setMode(value => value === "login" ? "signup" : "login"); setError(""); };
  const safeReturnTo = safeAuthNextPath(returnTo, "/marketplace");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="AGRIVA Login ও Signup"
        className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        <button type="button" ref={closeRef} onClick={onClose} aria-label="Login popup বন্ধ করুন"
          className="sticky right-3 top-3 z-10 ml-auto mr-3 mt-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
          <X size={19} />
        </button>
        <div className="mx-auto max-w-lg px-5 pb-8 sm:px-8 sm:pb-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
            <LockKeyhole size={24} />
          </span>
          <h2 className="mt-4 text-2xl font-black text-emerald-950">
            {mode === "login" ? "AGRIVA-তে লগইন করুন" : "AGRIVA অ্যাকাউন্ট তৈরি করুন"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === "login"
              ? "কার্টে পণ্য যোগ করতে লগইন করুন। লগইন হলে একই পণ্যে ফিরে কার্টে যোগ হবে।"
              : "ইমেইল অথবা মোবাইল নম্বর দিয়ে অ্যাকাউন্ট খুলুন।"}
          </p>
          <SocialAuthButtons returnTo={safeReturnTo} compact />
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Login/Signup মাধ্যম">
            <button type="button" aria-pressed={method === "email"} onClick={() => setMethod("email")}
              className={"min-h-11 rounded-lg px-3 text-sm font-black " + (method === "email" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600")}>
              ইমেইল
            </button>
            <button type="button" aria-pressed={method === "phone"} onClick={() => setMethod("phone")}
              className={"min-h-11 rounded-lg px-3 text-sm font-black " + (method === "phone" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600")}>
              মোবাইল নম্বর
            </button>
          </div>

          <div className="mt-5">
            {method === "phone" ? (
              <PhoneOtpAuth key={mode} mode={mode} onAuthenticated={completeAuth} onSwitchMode={switchMode} />
            ) : mode === "signup" ? (
              <SignupExperience embedded returnTo={safeReturnTo} onAuthenticated={completeAuth} onSwitchToLogin={() => setMode("login")} />
            ) : (
              <>
                <form onSubmit={signIn} className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">ইমেইল
                    <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)}
                      placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">পাসওয়ার্ড
                    <span className="relative mt-2 block">
                      <input type={showPassword ? "text" : "password"} autoComplete="current-password" required
                        value={password} onChange={event => setPassword(event.target.value)}
                        placeholder="পাসওয়ার্ড লিখুন" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                      <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                        className="absolute inset-y-0 right-0 px-4 text-slate-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </span>
                  </label>
                  <div className="text-right"><Link href="/forgot-password" className="text-xs font-semibold text-emerald-800 underline">পাসওয়ার্ড ভুলে গেছেন?</Link></div>
                  {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                    {busy ? "লগইন হচ্ছে…" : "লগইন করে কার্টে যোগ করুন"}
                  </button>
                </form>
                <p className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
                  নতুন ব্যবহারকারী?{" "}
                  <button type="button" onClick={switchMode} className="font-black text-emerald-800 underline underline-offset-4">অ্যাকাউন্ট তৈরি করুন</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
