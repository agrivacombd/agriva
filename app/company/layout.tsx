import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "কোম্পানি পোর্টাল", template: "%s | AGRIVA Company Portal" },
  robots: { index: false, follow: false },
};

export default function CompanyPortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
