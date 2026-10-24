import type { Metadata } from "next";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    template: "%s | AGRIVA",
  },
  description:
    "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও রিসেলারদের জন্য AGRIVA—কৃষি পণ্য, স্মার্ট সার্চ, কৃষি তথ্য ও ডিজিটাল টুলস এক জায়গায়।",
  applicationName: "AGRIVA",
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
    description: "কৃষি পণ্য, স্মার্ট সার্চ ও কৃষি সহায়তা—এক জায়গায়।",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIVA — কৃষি ও কৃষি উদ্যোক্তাদের ডিজিটাল প্ল্যাটফর্ম",
    description: "বাংলাদেশের কৃষক ও কৃষি উদ্যোক্তাদের জন্য ডিজিটাল প্ল্যাটফর্ম।",
  },
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
        {children}
      </body>
    </html>
  );
}
