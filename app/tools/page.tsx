import type { Metadata } from "next";
import ToolsDashboard from "@/components/tools/ToolsDashboard";

export const metadata: Metadata = {
  title: "কৃষি টুলস: সার, বীজ, লাভ-লোকসান ও ফসল ক্যালেন্ডার",
  description:
    "বাংলাদেশের কৃষকদের জন্য বিনামূল্যে কৃষি টুলস—সার ও বীজের হিসাব, চাষের খরচ-লাভ ক্যালকুলেটর এবং ফসলের কাজের চেকলিস্ট।",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "কৃষকের স্মার্ট টুলবক্স | AGRIVA",
    description:
      "জমির হিসাব, চাষের খরচ ও লাভ এবং কৃষিকাজের পরিকল্পনার সহজ বাংলা টুলস।",
    url: "/tools",
    type: "website",
  },
};

export default function ToolsPage() {
  return <ToolsDashboard />;
}
