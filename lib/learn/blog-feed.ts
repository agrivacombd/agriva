import { LESSONS } from "@/lib/learn/lessons";

export type BlogFeedEntry = {
  slug: string;
  href: string;
  source: "blog" | "learn";
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  emoji: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
};

/** A link feed from the authoritative Learn lessons, not a copied Blog post. */
export function getLearnBlogFeed(): BlogFeedEntry[] {
  const icons: Record<string, string> = { "ধান": "🌾", "সবজি": "🥬", "মাটি": "🌱", "রোগবালাই": "🐞" };
  const categories: Record<string, string> = { "ধান": "ধান চাষ", "সবজি": "সবজি", "মাটি": "মাটির স্বাস্থ্য", "রোগবালাই": "রোগবালাই" };
  return LESSONS.map(lesson => ({
    slug: lesson.slug,
    href: `/learn/${lesson.slug}`,
    source: "learn" as const,
    category: categories[lesson.crop] || lesson.crop,
    title: lesson.title,
    excerpt: lesson.summary,
    date: "কৃষি শেখার কেন্দ্র",
    readTime: lesson.duration,
    emoji: icons[lesson.crop] || "🌱",
  }));
}

/** Old demonstration Blog posts are replaced by the closest existing Learn guide. */
export const LEGACY_BLOG_LEARN_REDIRECTS: Record<string, string> = {
  "boro-rice-season-preparation": "/learn/rice-cultivation",
  "soil-health-basics": "/learn/soil-health",
  "integrated-pest-management": "/learn/integrated-pest-management",
  "vegetable-garden-water-management": "/learn/vegetable-cultivation",
};
