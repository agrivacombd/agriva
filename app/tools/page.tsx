import type { Metadata } from "next";
import ToolsDashboard from "@/components/tools/ToolsDashboard";

const toolsStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AGRIVA কৃষকের স্মার্ট টুলবক্স",
  url: "https://agriva.com.bd/tools",
  description:
    "বাংলাদেশের কৃষকদের জন্য বিনামূল্যের বাংলা কৃষি ক্যালকুলেটর: সার ও বীজের হিসাব, চাষের খরচ-লাভ এবং ফসলের কাজের চেকলিস্ট।",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  inLanguage: "bn-BD",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "BDT" },
  featureList: [
    "সার হিসাব ক্যালকুলেটর",
    "বীজের হিসাব",
    "চাষের খরচ ও লাভ-লোকসান ক্যালকুলেটর",
    "ফসল ক্যালেন্ডার ও কাজের চেকলিস্ট",
  ],
  provider: {
    "@type": "Organization",
    name: "AGRIVA",
    url: "https://agriva.com.bd",
  },
};

export const metadata: Metadata = {
  title: "কৃষি ক্যালকুলেটর: সার, বীজ, চাষের লাভ-লোকসান | AGRIVA",
  description:
    "বাংলাদেশের কৃষকদের জন্য বিনামূল্যে বাংলা কৃষি ক্যালকুলেটর। জমির আয়তন অনুযায়ী সার ও বীজের হিসাব করুন, চাষের খরচ-আয়-লাভ বের করুন এবং ফসলের কাজের তালিকা সাজান।",
  keywords: [
    "কৃষি ক্যালকুলেটর",
    "সার হিসাব ক্যালকুলেটর",
    "বীজের হিসাব",
    "চাষের খরচ ও লাভ",
    "কৃষি লাভ লোকসান হিসাব",
    "ফসল ক্যালেন্ডার",
    "কৃষি টুলস বাংলা",
    "বাংলাদেশ কৃষি",
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "বিনামূল্যের কৃষি ক্যালকুলেটর ও স্মার্ট টুলবক্স | AGRIVA",
    description:
      "সার ও বীজের পরিমাণ হিসাব করুন, চাষের খরচ-আয়-লাভ বুঝুন এবং কৃষিকাজের পরিকল্পনা সাজান—সহজ বাংলায়।",
    url: "/tools",
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
  },
  twitter: {
    card: "summary",
    title: "কৃষি ক্যালকুলেটর ও কৃষকের স্মার্ট টুলবক্স | AGRIVA",
    description:
      "সার, বীজ, চাষের খরচ-লাভ এবং ফসলের কাজের তালিকার বিনামূল্যের বাংলা টুলস।",
  },
};

export default function ToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(toolsStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ToolsDashboard />
    </>
  );
}
