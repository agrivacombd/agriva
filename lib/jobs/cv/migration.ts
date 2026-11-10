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
  document.experience = toEntries(legacy.experience, "experience");
  document.education = toEntries(legacy.education, "education");
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

  if (envelope.schemaVersion === 2 && envelope.document && typeof envelope.document === "object") {
    const document = envelope.document as CVDocument;
    if (document.schemaVersion === 2 && document.profile && Array.isArray(document.experience)) {
      return document;
    }
    return null;
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
