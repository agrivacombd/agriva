import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Search | AGRIVA",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
