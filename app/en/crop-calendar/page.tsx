import type { Metadata } from "next";
import StandaloneCalculator from "@/components/tools/StandaloneCalculator";

export const metadata: Metadata = {
  title: "Crop Calendar and Farming Task Checklist",
  description: "Track key seasonal farming tasks with a simple crop calendar checklist that saves your progress in your browser.",
  alternates: { canonical: "/en/crop-calendar", languages: { en: "/en/crop-calendar", "bn-BD": "/crop-calendar", "x-default": "/crop-calendar" } },
  openGraph: { title: "Crop Calendar and Task Checklist | AGRIVA", description: "Organize seasonal farm work with a practical checklist.", url: "/en/crop-calendar", type: "website", locale: "en_US" },
  keywords: ["crop calendar", "farming task checklist", "seasonal farm planning"],
};

export default function EnglishCropCalendarPage() {
  return <StandaloneCalculator kind="calendar" locale="en" />;
}
