import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "AGRIVA Login", description: "Sign in to your AGRIVA account.", robots: { index: false, follow: false } };

// The former role selector was a UI-only demo, not authentication. Send users to the real Supabase sign-in flow.
export default function AuthPage() {
  redirect("/login");
}
