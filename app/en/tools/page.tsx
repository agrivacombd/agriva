import type { Metadata } from "next";
import ToolsHubClient from "@/components/tools/ToolsHubClient";
import { tools } from "@/lib/tools/registry";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Agriculture Tools and Online Calculators",
  description: "Explore AGRIVA tools for fertilizer and seed estimates, irrigation water, harvest timing, farm costs and profit, weather, AI agriculture assistance and farm management.",
  alternates: { canonical: "/en/tools", languages: { en: "/en/tools", "bn-BD": "/tools", "x-default": "/tools" } },
  openGraph: {
    title: "Agriculture Tools and Online Calculators | AGRIVA",
    description: "Agriculture calculators, planning, AI assistance and farm management tools in one place.",
    url: "/en/tools",
    type: "website",
    locale: "en_US",
  },
  keywords: ["agriculture tools", "farming calculators", "fertilizer calculator", "seed rate calculator", "farm management", "crop planning"],
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AGRIVA Agriculture Tools",
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.titleEn,
    url: siteUrl + tool.href,
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl + "/en" },
    { "@type": "ListItem", position: 2, name: "Tools", item: siteUrl + "/en/tools" },
  ],
};

export default function EnglishToolsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListJsonLd, breadcrumbJsonLd]).replace(/</g, "\\u003c") }} />
      <ToolsHubClient locale="en" />
    </>
  );
}
