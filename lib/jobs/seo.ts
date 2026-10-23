import type { Metadata } from "next";

export type JobSeoRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  job_type: "one-time" | "part-time" | "full-time";
  district: string;
  upazila: string;
  union_name?: string | null;
  address_hint?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_is_approximate?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
  application_deadline?: string | null;
  published_at?: string | null;
  created_at: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  compensation_type: string;
  status: string;
};

const baseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const typeLabels: Record<JobSeoRecord["job_type"], string> = {
  "one-time": "এককালীন কাজ",
  "part-time": "পার্ট-টাইম চাকরি",
  "full-time": "ফুল-টাইম চাকরি",
};

export function jobPath(job: Pick<JobSeoRecord, "slug">) {
  return `/jobs/${encodeURIComponent(job.slug)}`;
}

export function buildJobMetadata(job: JobSeoRecord): Metadata {
  const location = [job.upazila, job.district].filter(Boolean).join(", ");
  const title = `${job.title} — ${location} | AGRIVA Jobs`.slice(0, 70);
  const plainDescription = job.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const description = `${typeLabels[job.job_type]}: ${plainDescription} এলাকা: ${location}। মজুরি ও আবেদনের তথ্য AGRIVA Jobs-এ দেখুন।`.slice(0, 160);
  const canonical = jobPath(job);
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: "website", locale: "bn_BD", siteName: "AGRIVA Jobs", title, description, url: canonical },
    twitter: { card: "summary", title, description },
  };
}

export function buildJobPostingJsonLd(job: JobSeoRecord) {
  const base = baseUrl();
  const location = {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: job.upazila,
      addressRegion: job.district,
      addressCountry: "BD",
      ...(job.union_name ? { streetAddress: job.union_name } : {}),
    },
  };
  const salary =
    job.salary_min != null || job.salary_max != null
      ? {
          "@type": "MonetaryAmount",
          currency: job.salary_currency || "BDT",
          value: {
            "@type": "QuantitativeValue",
            ...(job.salary_min != null ? { minValue: job.salary_min } : {}),
            ...(job.salary_max != null ? { maxValue: job.salary_max } : {}),
            unitText: job.compensation_type === "hourly" ? "HOUR" : job.compensation_type === "monthly" ? "MONTH" : job.compensation_type === "daily" ? "DAY" : "OTHER",
          },
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${base}${jobPath(job)}#jobposting`,
    title: job.title,
    description: job.description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>"),
    identifier: { "@type": "PropertyValue", name: "AGRIVA Jobs", value: job.id },
    datePosted: job.published_at || job.created_at,
    ...(job.application_deadline ? { validThrough: job.application_deadline } : {}),
    employmentType: job.job_type === "full-time" ? "FULL_TIME" : job.job_type === "part-time" ? "PART_TIME" : "TEMPORARY",
    hiringOrganization: { "@type": "Organization", name: "AGRIVA Jobs employer", sameAs: base, description: "Employer details are provided on the job page." },
    jobLocation: location,
    ...(salary ? { baseSalary: salary } : {}),
    url: `${base}${jobPath(job)}`,
    directApply: true,
  };
}

export function buildJobBreadcrumbJsonLd(job: JobSeoRecord) {
  const base = baseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: base },
      { "@type": "ListItem", position: 2, name: "কৃষি চাকরি", item: `${base}/jobs` },
      { "@type": "ListItem", position: 3, name: typeLabels[job.job_type], item: `${base}/jobs/${job.job_type}` },
      { "@type": "ListItem", position: 4, name: job.title, item: `${base}${jobPath(job)}` },
    ],
  };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
