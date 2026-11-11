import type { Metadata } from "next";
import PlantScienceClient from "./PlantScienceClient";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/learn/plant-science`;

export const metadata: Metadata = {
  title: "বাংলাদেশের উদ্ভিদ তালিকা ও বৈজ্ঞানিক নাম",
  description: "বাংলাদেশের উদ্ভিদের বাংলা ও ইংরেজি নাম, বৈজ্ঞানিক নাম, উদ্ভিদ পরিবার ও পরিচিতির তথ্যসূত্রসহ জানুন। উদ্ভিদবিদ্যা শেখার বাংলা রেফারেন্স।",
  alternates: { canonical: pageUrl },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "AGRIVA",
    locale: "bn_BD",
    title: "বাংলাদেশের উদ্ভিদ তালিকা ও বৈজ্ঞানিক নাম | AGRIVA",
    description: "বাংলাদেশের উদ্ভিদের বাংলা ও ইংরেজি নাম, বৈজ্ঞানিক নাম, উদ্ভিদ পরিবার ও পরিচিতির তথ্যসূত্রসহ জানুন।",
  },
  twitter: {
    card: "summary_large_image",
    title: "বাংলাদেশের উদ্ভিদ তালিকা ও বৈজ্ঞানিক নাম | AGRIVA",
    description: "বাংলাদেশের উদ্ভিদের বাংলা ও ইংরেজি নাম, বৈজ্ঞানিক নাম, উদ্ভিদ পরিবার ও পরিচিতির তথ্যসূত্রসহ জানুন।",
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${pageUrl}#webpage`,
  url: pageUrl,
  name: "বাংলাদেশের উদ্ভিদ তালিকা ও বৈজ্ঞানিক নাম",
  description: "বাংলাদেশের উদ্ভিদ সম্পর্কে বাংলা-ইংরেজি নাম, বৈজ্ঞানিক নাম, পরিবার ও উৎসভিত্তিক শেখার সংগ্রহ।",
  inLanguage: "bn-BD",
  isPartOf: { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "AGRIVA", url: siteUrl },
  publisher: { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "AGRIVA", url: siteUrl },
};

export default function PlantSciencePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c") }}
      />
      <PlantScienceClient />
    </>
  );
}
