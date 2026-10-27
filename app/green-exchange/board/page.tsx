import type { Metadata } from "next";
import GreenExchangeBoard from "./board-client";

export const metadata: Metadata = {
  title: "গাছ বিনিময়ের পোস্ট | Green Exchange – AGRIVA",
  description: "গাছ, চারা, কাটিং ও বীজ বিনিময়ের পোস্ট দেখুন এবং নিজের বিনিময়ের প্রস্তাব জমা দিন। AGRIVA Green Exchange-এ নিরাপদে স্থানীয় বাগানিদের সঙ্গে যুক্ত হোন।",
  alternates: { canonical: "/green-exchange/board" },
  robots: { index: false, follow: true },
};

export default function GreenExchangeBoardPage() {
  return <GreenExchangeBoard />;
}
