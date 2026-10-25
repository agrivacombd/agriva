"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SignupRole = "farmer" | "reseller";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("farmer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function signUp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Creating account...");

    try {
      const emailRedirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { role },
        },
      });

      setMessage(
        error
          ? error.message
          : "Account created. Check your email and open the confirmation link to activate your account."
      );
    } catch {
      setMessage("Could not create your account. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <form onSubmit={signUp} className="w-full space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <Link href="/" className="text-sm font-semibold text-emerald-600">AGRIVA</Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">Join AGRIVA to explore agriculture tools and intelligence.</p>
        </div>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          I want to join as
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            value={role}
            onChange={(event) => setRole(event.target.value as SignupRole)}
          >
            <option value="farmer">Farmer</option>
            <option value="reseller">Reseller</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Email
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Password
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="password" autoComplete="new-password" minLength={6} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
        {message && <p role="status" aria-live="polite" className="break-words text-sm text-slate-600">{message}</p>}
        <p className="text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-emerald-700 underline underline-offset-4" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
