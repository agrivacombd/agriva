import type { Metadata } from "next";

export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "AGRIVA | Digital Agriculture Platform",
    description:
      "Explore AGRIVA's agriculture tools, crop planning resources and practical digital services for growers and agricultural professionals.",
  },
};

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
