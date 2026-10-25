import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    short_name: "AGRIVA",
    description: "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও চাকরিপ্রার্থীদের জন্য কৃষি পণ্য, ফসল সহায়তা, চাকরি, CV Builder ও ডিজিটাল টুলস।",
    lang: "bn-BD",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#f6f8f3",
    theme_color: "#0b6b4f",
    categories: ["agriculture", "business", "productivity"],
    icons: [
      { src: "/icons/agriva-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/agriva-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
