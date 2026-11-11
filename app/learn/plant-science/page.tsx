import type { Metadata } from "next";
import PlantScienceClient from "./PlantScienceClient";
import { plantScienceFaqs } from "./faqs";

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

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "বাংলাদেশের উদ্ভিদ তালিকা ও বৈজ্ঞানিক নাম",
      description: "বাংলাদেশের উদ্ভিদ সম্পর্কে বাংলা-ইংরেজি নাম, বৈজ্ঞানিক নাম, পরিবার ও উৎসভিত্তিক শেখার সংগ্রহ।",
      inLanguage: "bn-BD",
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      mainEntity: { "@id": `${pageUrl}#faq` },
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: pageUrl,
      inLanguage: "bn-BD",
      mainEntity: plantScienceFaqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "কৃষি শেখার কেন্দ্র", item: `${siteUrl}/learn` },
        { "@type": "ListItem", position: 3, name: "উদ্ভিদ পরিচিতি", item: pageUrl },
      ],
    },
  ],
};

export default function PlantSciencePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <PlantScienceClient />
    </>
  );
}
