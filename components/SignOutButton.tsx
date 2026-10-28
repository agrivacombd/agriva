"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-[#dce6da] px-4 py-2 text-sm font-semibold text-[#126b4f] transition hover:bg-[#f2f7f0] disabled:opacity-60">
      <LogOut size={16} aria-hidden="true" />
      {busy ? "লগআউট হচ্ছে…" : "লগআউট"}
    </button>
  );
}
