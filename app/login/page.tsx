"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const supabase = createSupabaseBrowserClient();

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setMessage("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in successfully. Redirect to /dashboard next.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={signIn} className="w-full space-y-5 rounded-3xl border p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-emerald-600">AGRIVA</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        </div>
        <input className="w-full rounded-xl border px-4 py-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-xl border px-4 py-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" type="submit">Sign in</button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}
