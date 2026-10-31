import type { Metadata } from "next";
import ToolsHubClient from "@/components/tools/ToolsHubClient";
import { tools } from "@/lib/tools/registry";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "কৃষি টুলস ও অনলাইন ক্যালকুলেটর",
  description: "বীজ ও সার হিসাব, চাষের খরচ ও লাভ-লোকসান, ফসল পরিকল্পনা, AI কৃষি সহায়তা এবং খামার ব্যবস্থাপনার দরকারি টুলস ব্যবহার করুন AGRIVA-তে।",
  alternates: { canonical: "/tools", languages: { "bn-BD": "/tools", en: "/en/tools", "x-default": "/tools" } },
  openGraph: {
    title: "কৃষি টুলস ও অনলাইন ক্যালকুলেটর | AGRIVA",
    description: "কৃষি হিসাব, পরিকল্পনা, AI সহায়তা ও খামার ব্যবস্থাপনার টুলস এক জায়গায়।",
    url: "/tools",
    type: "website",
    locale: "bn_BD",
  },
  keywords: ["কৃষি টুলস", "কৃষি ক্যালকুলেটর", "সার হিসাব", "বীজের হিসাব", "ফসল পরিকল্পনা", "কৃষি AI", "খামার ব্যবস্থাপনা"],
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AGRIVA কৃষি টুলস",
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    url: siteUrl + tool.href,
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl + "/" },
    { "@type": "ListItem", position: 2, name: "কৃষি টুলস", item: siteUrl + "/tools" },
  ],
};

export default function ToolsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListJsonLd, breadcrumbJsonLd]).replace(/</g, "\\u003c") }} />
      <ToolsHubClient locale="bn" />
    </>
  );
}
