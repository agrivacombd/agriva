import type { Metadata } from "next";
import FarmWorkspace from "@/components/farms/FarmWorkspace";

export const metadata: Metadata = {
  title: "My Farm | AGRIVA",
  description: "Manage your land records and keep a practical farm diary with AGRIVA.",
  robots: { index: false, follow: false },
};

export default function FarmsPage() {
  return <FarmWorkspace />;
}
