import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "চাষের খরচ ও লাভ-লোকসান ক্যালকুলেটর",
  description: "বীজ, সার, শ্রম, সেচ, উৎপাদন ও বিক্রয়মূল্য দিয়ে কৃষিকাজের মোট খরচ, সম্ভাব্য আয় এবং লাভ-লোকসান হিসাব করুন।",
  alternates: { canonical: "/farming-cost-profit-calculator", languages: { "bn-BD": "/farming-cost-profit-calculator", en: "/en/farming-cost-profit-calculator", "x-default": "/farming-cost-profit-calculator" } },
  openGraph: { title: "চাষের খরচ ও লাভ-লোকসান | AGRIVA", description: "নিজের তথ্য দিয়ে চাষের সম্ভাব্য খরচ, বিক্রয় আয় ও লাভ-লোকসান হিসাব করুন।", url: "/farming-cost-profit-calculator", type: "website" },
  keywords: ["চাষের খরচ", "কৃষি লাভ লোকসান", "চাষের লাভ হিসাব", "farming cost calculator", "crop profit calculator"],
};

export default function FarmingCostProfitCalculatorPage() {
  return <StandaloneCalculator kind="profit" locale="bn" />;
}
