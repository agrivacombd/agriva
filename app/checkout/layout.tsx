import type { Metadata } from "next";
import type { ReactNode } from "react";

// Account and transaction pages must never appear as search landing pages.
export const metadata: Metadata = {
  title: { absolute: "চেকআউট | AGRIVA" },
  robots: { index: false, follow: false },
};

export default function PrivatePageLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
