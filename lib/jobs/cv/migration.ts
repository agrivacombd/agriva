import {
  createEmptyCVDocument,
  type CVDocument,
  type CVLanguage,
  type CVStorageState,
} from "./schema";

type LegacyCV = {
  fullName?: string;
  headline?: string;
  phone?: string;
  email?: string;
  address?: string;
  summary?: string;
  education?: string;
  experience?: string;
  skills?: string;
  languages?: string;
  certifications?: string;
  photoUrl?: string;
};

type LegacyEnvelope = {
  cv?: LegacyCV;
  template?: string;
  language?: CVLanguage;
};

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const lines = (value: unknown): string[] =>
  text(value)
    .split(/\\r?\\n/)
    .map((item) => item.trim())
    .filter(Boolean);

function migrateLegacyCV(envelope: LegacyEnvelope): CVDocument {
  const old = envelope.cv ?? {};
  const document = createEmptyCVDocument(
    envelope.language === "bn" ? "bn" : "en",
    text(envelope.template) || "classic",
  );

  document.profile = {
    ...document.profile,
    fullName: text(old.fullName),
    headline: text(old.headline),
    phone: text(old.phone),
    email: text(old.email),
    address: text(old.address),
    photoUrl: text(old.photoUrl),
  };
  document.summary = text(old.summary);

  // Preserve free-form legacy content verbatim; do not invent dates or employers.
  if (text(old.experience).trim()) {
    document.experience.push({
      id: "legacy-experience-1",
      role: "",
      organization: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: text(old.experience),
    });
  }
  if (text(old.education).trim()) {
    document.education.push({
      id: "legacy-education-1",
      qualification: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      grade: "",
      details: text(old.education),
    });
  }

  document.skills = lines(old.skills);
  document.languages = lines(old.languages);
  document.certifications = lines(old.certifications);
  return document;
}

function normalizeV2(value: unknown): CVStorageState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { version?: unknown; document?: unknown };
  if (candidate.version !== 2 || !candidate.document || typeof candidate.document !== "object") {
    return null;
  }
  const defaults = createEmptyCVDocument();
  const document = candidate.document as Partial<CVDocument>;
  return {
    version: 2,
    document: {
      ...defaults,
      ...document,
      profile: { ...defaults.profile, ...(document.profile ?? {}) },
      settings: { ...defaults.settings, ...(document.settings ?? {}) },
      experience: Array.isArray(document.experience) ? document.experience : [],
      education: Array.isArray(document.education) ? document.education : [],
      skills: Array.isArray(document.skills) ? document.skills : [],
      languages: Array.isArray(document.languages) ? document.languages : [],
      certifications: Array.isArray(document.certifications) ? document.certifications : [],
      projects: Array.isArray(document.projects) ? document.projects : [],
      customSections: Array.isArray(document.customSections) ? document.customSections : [],
    },
  };
}

/** Parse and migrate the existing agriva-cv-v1 localStorage envelope without deleting it. */
export function migrateCVStorage(raw: string): CVStorageState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const current = normalizeV2(parsed);
    if (current) return current;

    if (!parsed || typeof parsed !== "object") return null;
    const legacy = parsed as LegacyEnvelope;
    if (!legacy.cv || typeof legacy.cv !== "object") return null;
    return { version: 2, document: migrateLegacyCV(legacy) };
  } catch {
    return null;
  }
}
