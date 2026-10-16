"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <form onSubmit={signIn} className="w-full space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <Link href="/" className="text-sm font-semibold text-emerald-600">AGRIVA</Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to continue to your AGRIVA account.</p>
        </div>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Email
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Password
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        {message && <p role="status" className="break-words text-sm text-slate-600">{message}</p>}
        <p className="text-center text-sm text-slate-600">Don&apos;t have an account? <Link className="font-semibold text-emerald-700 underline underline-offset-4" href="/signup">Create an account</Link></p>
      </form>
    </main>
  );
}
