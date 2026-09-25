"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const supabase = createSupabaseBrowserClient();

  async function signUp(event: FormEvent) {
    event.preventDefault();
    setMessage("Creating account...");
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created. Check your email if confirmation is enabled.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={signUp} className="w-full space-y-5 rounded-3xl border p-8 shadow-sm">
        <div><p className="text-sm font-semibold text-emerald-600">AGRIVA</p><h1 className="mt-2 text-3xl font-bold">Create your account</h1></div>
        <input className="w-full rounded-xl border px-4 py-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-xl border px-4 py-3" type="password" minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" type="submit">Create account</button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}
