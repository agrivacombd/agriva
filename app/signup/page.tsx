"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SignupExperience from "@/components/auth/SignupExperience";
import { safeAuthNextPath } from "@/lib/auth/safe-next";

function SignupContent() {
  const params = useSearchParams();
  const next = params.get("next");
  const returnTo = next ? safeAuthNextPath(next) : undefined;
  return <SignupExperience returnTo={returnTo} />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f5f8f2] px-6 py-10 text-center text-sm text-slate-600">অ্যাকাউন্ট তৈরির পেজ লোড হচ্ছে…</main>}>
      <SignupContent />
    </Suspense>
  );
}
