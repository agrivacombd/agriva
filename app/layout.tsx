import type { Metadata, Viewport } from "next";
import PwaRegister from "./pwa-register";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    template: "%s | AGRIVA",
  },
  description:
    "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও চাকরিপ্রার্থীদের জন্য AGRIVA—কৃষি পণ্য, ফসল সহায়তা, কৃষি চাকরি, CV Builder ও ডিজিটাল টুলস এক জায়গায়।",
  applicationName: "AGRIVA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AGRIVA",
  },
  icons: {
    icon: [{ url: "/icons/agriva-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/agriva-icon.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "AGRIVA",
    locale: "bn_BD",
    url: siteUrl,
    title: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    description: "কৃষি পণ্য, ফসল সহায়তা, কৃষি চাকরি ও CV Builder—এক জায়গায়।",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIVA — কৃষি ও কৃষি উদ্যোক্তাদের ডিজিটাল প্ল্যাটফর্ম",
    description: "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও চাকরিপ্রার্থীদের জন্য ডিজিটাল প্ল্যাটফর্ম।",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6b4f",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AGRIVA",
  url: siteUrl,
  description:
    "বাংলাদেশের কৃষক ও কৃষি উদ্যোক্তাদের জন্য কৃষি পণ্য, কৃষি তথ্য এবং ডিজিটাল কৃষি সেবা।",
  areaServed: {
    "@type": "Country",
    name: "Bangladesh",
  },
  knowsLanguage: ["bn", "en"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
