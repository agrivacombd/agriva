import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/marketplace/CartProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd"),
  title: {
    default: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    template: "%s | AGRIVA",
  },
  description:
    "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও রিসেলারদের জন্য AGRIVA—কৃষি পণ্য, স্মার্ট সার্চ, কৃষি তথ্য ও ডিজিটাল টুলস এক জায়গায়।",
  applicationName: "AGRIVA",
  openGraph: {
    type: "website",
    siteName: "AGRIVA",
    locale: "bn_BD",
    title: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    description: "কৃষি পণ্য, স্মার্ট সার্চ ও কৃষি সহায়তা—এক জায়গায়।",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    description: "বাংলাদেশের কৃষক ও কৃষি উদ্যোক্তাদের জন্য ডিজিটাল প্ল্যাটফর্ম।",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
