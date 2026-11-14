import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import PwaRegister from "./pwa-register";
import SiteChrome from "@/components/site/SiteChrome";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import GrowthVerification from "@/components/analytics/GrowthVerification";
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
    icon: [
      { url: "/branding/agriva-favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/branding/agriva-app-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/branding/agriva-apple-touch-180.png", sizes: "180x180", type: "image/png" }],
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
  "@id": `${siteUrl}/#organization`,
  name: "AGRIVA",
  url: siteUrl,
  logo: { "@type": "ImageObject", "@id": `${siteUrl}/#logo`, url: `${siteUrl}/branding/agriva-agriculture-brand-logo.svg`, width: 640, height: 158, caption: "AGRIVA — Growing a Better Tomorrow" },
  telephone: "+8801717504028",
  description:
    "বাংলাদেশের কৃষক ও কৃষি উদ্যোক্তাদের জন্য কৃষি পণ্য, কৃষি তথ্য এবং ডিজিটাল কৃষি সেবা।",
  areaServed: {
    "@type": "Country",
    name: "Bangladesh",
  },
  knowsLanguage: ["bn", "en"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "AGRIVA",
  url: siteUrl,
  inLanguage: ["bn-BD", "en"],
  publisher: { "@id": `${siteUrl}/#organization` },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-agriva-locale") === "en" ? "en" : "bn";

  return (
    <html lang={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <GrowthVerification />
        <GoogleAnalytics />
        <PwaRegister />
        <SiteChrome />
        {children}
      </body>
    </html>
  );
}
