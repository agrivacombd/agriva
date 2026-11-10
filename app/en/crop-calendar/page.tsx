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
  return (
    <>
      <StandaloneCalculator kind="calendar" locale="en" />
      <article className="prose prose-green mx-auto mt-10 max-w-4xl px-4 pb-12 sm:px-6">
        <h2>How to plan farm work with a crop calendar</h2>
        <p>Use the checklist to organize land preparation, seed selection, planting, crop care and harvest activities. Save progress in your browser and revisit the list as the season moves forward.</p>
        <h3>Adapt the schedule to your field</h3>
        <p>Planting windows differ by crop variety, district, rainfall, irrigation access and soil condition. Treat calendar entries as planning prompts, then confirm dates with current local agricultural guidance.</p>
        <h3>Keep useful farm records</h3>
        <p>Record the planting date, seed variety, input applications and unusual weather. These notes make it easier to compare seasons and plan labour, storage and transport before harvest.</p>
      </article>
    </>
  );
}
