import {
  createEmptyCVDocument,
  type CVDocument,
  type CVLanguage,
  type CVLegacyFlatData,
  type CVStoredEnvelopeV1,
} from "@/lib/jobs/cv/types";

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toEntries(value: unknown, prefix: string) {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((content, index) => ({
      id: `legacy-${prefix}-${index + 1}`,
      content,
    }));
}

function validLanguage(value: unknown): CVLanguage {
  return value === "bn" ? "bn" : "en";
}

export function migrateLegacyCV(
  legacy: CVLegacyFlatData,
  options: { language?: unknown; template?: unknown } = {},
): CVDocument {
  const document = createEmptyCVDocument(validLanguage(options.language));
  document.profile = {
    fullName: asText(legacy.fullName),
    headline: asText(legacy.headline),
    phone: asText(legacy.phone),
    email: asText(legacy.email),
    address: asText(legacy.address),
    photoUrl: asText(legacy.photoUrl),
  };
  document.summary = asText(legacy.summary);
  document.experience = toEntries(legacy.experience, "experience").map((entry) => ({ id: entry.id, jobTitle: "", company: "", location: "", startDate: "", endDate: "", description: entry.content, achievements: "" }));
  document.education = toEntries(legacy.education, "education").map((entry) => ({ id: entry.id, degree: entry.content, institution: "", location: "", startDate: "", endDate: "", details: "" }));
  document.skills = toEntries(legacy.skills, "skill");
  document.languages = toEntries(legacy.languages, "language");
  document.certifications = toEntries(legacy.certifications, "certification");
  document.settings.templateId =
    typeof options.template === "string" && options.template.trim()
      ? options.template
      : "classic";
  return document;
}

export function migrateStoredEnvelope(value: unknown): CVDocument | null {
  if (!value || typeof value !== "object") return null;
  const envelope = value as CVStoredEnvelopeV1 & {
    schemaVersion?: unknown;
    document?: unknown;
  };

  if ((envelope.schemaVersion === 3 || envelope.schemaVersion === 2) && envelope.document && typeof envelope.document === "object") {
    const stored = envelope.document as Record<string, unknown>;
    if (!stored.profile || !Array.isArray(stored.experience) || !Array.isArray(stored.education)) return null;
    if (envelope.schemaVersion === 3 && stored.schemaVersion === 3) return stored as unknown as CVDocument;
    const profile = stored.profile as Record<string, unknown>;
    const migrated = migrateLegacyCV({
      fullName: profile.fullName, headline: profile.headline, phone: profile.phone,
      email: profile.email, address: profile.address, photoUrl: profile.photoUrl,
      summary: stored.summary,
      experience: (stored.experience as Array<Record<string, unknown>>).map((item) => asText(item.content)).join("\\n"),
      education: (stored.education as Array<Record<string, unknown>>).map((item) => asText(item.content)).join("\\n"),
      skills: (stored.skills as Array<Record<string, unknown>>).map((item) => asText(item.content)).join("\\n"),
      languages: (stored.languages as Array<Record<string, unknown>>).map((item) => asText(item.content)).join("\\n"),
      certifications: (stored.certifications as Array<Record<string, unknown>>).map((item) => asText(item.content)).join("\\n"),
    }, { language: (stored.settings as Record<string, unknown> | undefined)?.language, template: (stored.settings as Record<string, unknown> | undefined)?.templateId });
    // Preserve richer records if this is a previously stored structured version.
    migrated.experience = (stored.experience as Array<Record<string, unknown>>).map((item, index) => ({
      id: asText(item.id) || `legacy-experience-${index + 1}`, jobTitle: "", company: "", location: "", startDate: "", endDate: "",
      description: asText(item.content), achievements: "",
    }));
    migrated.education = (stored.education as Array<Record<string, unknown>>).map((item, index) => ({
      id: asText(item.id) || `legacy-education-${index + 1}`, degree: asText(item.content), institution: "", location: "", startDate: "", endDate: "", details: "",
    }));
    return migrated;
  }

  if (envelope.cv && typeof envelope.cv === "object") {
    return migrateLegacyCV(envelope.cv, {
      language: envelope.language,
      template: envelope.template,
    });
  }

  // Also accept the original flat CV object in case an older build stored it directly.
  return migrateLegacyCV(envelope as CVLegacyFlatData);
}
