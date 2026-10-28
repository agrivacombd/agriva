import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "কৃষি AI সহায়ক: ফসল, মাটি, সার ও রোগ-পোকা",
  description:
    "ফসল, মাটি, সেচ, সার ও রোগ-পোকা সম্পর্কে AGRIVA AI-কে প্রশ্ন করুন। উত্তরকে প্রাথমিক তথ্য হিসেবে নিন এবং গুরুত্বপূর্ণ সিদ্ধান্তে স্থানীয় কৃষি বিশেষজ্ঞের পরামর্শ যাচাই করুন।",
  alternates: { canonical: "/ai" },
  openGraph: {
    title: "কৃষি AI সহায়ক | AGRIVA",
    description:
      "বাংলায় ফসল, মাটি, সেচ, সার ও রোগ-পোকা সম্পর্কে কৃষি-সংক্রান্ত প্রশ্ন করুন AGRIVA AI-তে।",
    url: "/ai",
    type: "website",
    locale: "bn_BD",
  },
};

export default function AILayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
