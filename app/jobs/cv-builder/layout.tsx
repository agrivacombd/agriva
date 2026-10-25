import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ফ্রি CV Builder — বাংলা ও English CV তৈরি করুন",
  description:
    "কয়েক ধাপে বাংলা বা English CV তৈরি করুন, পছন্দের template-এ preview দেখুন এবং PDF হিসেবে সংরক্ষণ করুন। চাকরির আবেদনের আগে AGRIVA CV Builder ব্যবহার করুন।",
  alternates: { canonical: "/jobs/cv-builder" },
  keywords: [
    "CV Builder Bangladesh",
    "বাংলা CV তৈরি",
    "English CV maker",
    "free CV maker",
    "কৃষি চাকরির CV",
  ],
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    title: "ফ্রি CV Builder | AGRIVA",
    description:
      "বাংলা বা English CV তৈরি করুন, preview দেখুন এবং PDF হিসেবে সংরক্ষণ করুন।",
    url: "/jobs/cv-builder",
  },
};

export default function CVBuilderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
